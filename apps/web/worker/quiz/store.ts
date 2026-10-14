/**
 * Quiz persistence. The Supabase implementation runs every query with the
 * caller's own bearer token, so the owner-only RLS policies in
 * `scripts/migrations/create_quiz_tables.sql` decide every row; the Worker
 * holds no service-role key. Nothing here stores a Canvas credential: courses
 * arrive as plain-text digests built in the student's own browser.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export interface CourseUpload {
  courseId: number
  name: string
  courseCode: string | null
  digest: string
}

export interface CourseRow {
  courseId: number
  name: string
  courseCode: string | null
  enabled: boolean
  digest: string | null
  syncedAt: string | null
}

export interface QuestionRow {
  id: string
  courseId: number
  courseName: string
  topic: string
  question: string
  options: string[]
  answerIndex: number
  explanation: string
  createdOn: string
  timesWrong: number
  reviewStreak: number
  mastered: boolean
}

export type NewQuestion = Omit<QuestionRow, "id" | "timesWrong" | "reviewStreak" | "mastered">

export interface DailyRow {
  quizDate: string
  questionIds: string[]
  reviewIds: string[]
  answers: Record<string, number>
}

export interface QuestionStatsPatch {
  timesWrong: number
  reviewStreak: number
  mastered: boolean
}

export interface QuizStore {
  listCourses(userId: string): Promise<CourseRow[]>
  replaceCourses(userId: string, courses: CourseUpload[], syncedAt: string): Promise<void>
  setCourseEnabled(userId: string, courseId: number, enabled: boolean): Promise<boolean>
  getDaily(userId: string, quizDate: string): Promise<DailyRow | null>
  insertDaily(userId: string, row: DailyRow): Promise<DailyRow>
  saveAnswers(userId: string, quizDate: string, answers: Record<string, number>): Promise<void>
  getQuestions(userId: string, ids: string[]): Promise<QuestionRow[]>
  insertQuestions(userId: string, questions: NewQuestion[]): Promise<QuestionRow[]>
  updateQuestionStats(userId: string, id: string, patch: QuestionStatsPatch): Promise<void>
  listOpenMistakes(userId: string, limit: number): Promise<QuestionRow[]>
  countOpenMistakes(userId: string): Promise<number>
  listRecentStems(userId: string, sinceDate: string, limit: number): Promise<string[]>
}

interface QuestionRecord {
  id: string
  course_id: number
  course_name: string
  topic: string
  question: string
  options: string[]
  answer_index: number
  explanation: string
  created_on: string
  times_wrong: number
  review_streak: number
  mastered: boolean
}

const QUESTION_COLUMNS =
  "id, course_id, course_name, topic, question, options, answer_index, explanation, created_on, times_wrong, review_streak, mastered"

function toQuestion(record: QuestionRecord): QuestionRow {
  return {
    id: record.id,
    courseId: Number(record.course_id),
    courseName: record.course_name,
    topic: record.topic,
    question: record.question,
    options: record.options,
    answerIndex: record.answer_index,
    explanation: record.explanation,
    createdOn: record.created_on,
    timesWrong: record.times_wrong,
    reviewStreak: record.review_streak,
    mastered: record.mastered,
  }
}

function check<T>(result: { data: T; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`Supabase ${what} failed: ${result.error.message}`)
  return result.data
}

export class SupabaseQuizStore implements QuizStore {
  private readonly db: SupabaseClient

  constructor(env: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string }, accessToken: string) {
    this.db = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      // The Worker holds no session; the caller's token rides on every query.
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
        fetch: (input, init) => fetch(input, init),
      },
    })
  }

  async listCourses(userId: string): Promise<CourseRow[]> {
    const data = check(
      await this.db
        .from("quiz_courses")
        .select("course_id, name, course_code, enabled, context_digest, synced_at")
        .eq("user_id", userId)
        .order("name"),
      "list courses",
    )
    return (data ?? []).map((row) => ({
      courseId: Number(row.course_id),
      name: row.name,
      courseCode: row.course_code,
      enabled: row.enabled,
      digest: row.context_digest,
      syncedAt: row.synced_at,
    }))
  }

  /**
   * Mirrors the uploaded term: courses that are no longer listed go, new ones
   * start enabled, and an existing course keeps the student's enabled choice.
   */
  async replaceCourses(userId: string, courses: CourseUpload[], syncedAt: string) {
    const existing = await this.listCourses(userId)
    const keep = new Set(courses.map((course) => course.courseId))
    const stale = existing.filter((course) => !keep.has(course.courseId)).map((c) => c.courseId)
    if (stale.length) {
      check(
        await this.db.from("quiz_courses").delete().eq("user_id", userId).in("course_id", stale),
        "delete stale courses",
      )
    }
    if (courses.length) {
      check(
        await this.db.from("quiz_courses").upsert(
          courses.map((course) => ({
            user_id: userId,
            course_id: course.courseId,
            name: course.name,
            course_code: course.courseCode,
            context_digest: course.digest,
            synced_at: syncedAt,
          })),
          { onConflict: "user_id,course_id" },
        ),
        "upsert courses",
      )
    }
  }

  async setCourseEnabled(userId: string, courseId: number, enabled: boolean) {
    const data = check(
      await this.db
        .from("quiz_courses")
        .update({ enabled })
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .select("course_id"),
      "update course",
    )
    return (data ?? []).length > 0
  }

  async getDaily(userId: string, quizDate: string): Promise<DailyRow | null> {
    const data = check(
      await this.db
        .from("quiz_daily")
        .select("quiz_date, question_ids, review_ids, answers")
        .eq("user_id", userId)
        .eq("quiz_date", quizDate)
        .maybeSingle(),
      "read daily quiz",
    )
    if (!data) return null
    return {
      quizDate: data.quiz_date,
      questionIds: data.question_ids ?? [],
      reviewIds: data.review_ids ?? [],
      answers: (data.answers ?? {}) as Record<string, number>,
    }
  }

  async insertDaily(userId: string, row: DailyRow): Promise<DailyRow> {
    const result = await this.db.from("quiz_daily").insert({
      user_id: userId,
      quiz_date: row.quizDate,
      question_ids: row.questionIds,
      review_ids: row.reviewIds,
      answers: row.answers,
    })
    // A concurrent request may have created today's quiz first; theirs wins.
    if (result.error?.code === "23505") {
      const existing = await this.getDaily(userId, row.quizDate)
      if (existing) return existing
    }
    check(result, "create daily quiz")
    return row
  }

  async saveAnswers(userId: string, quizDate: string, answers: Record<string, number>) {
    check(
      await this.db
        .from("quiz_daily")
        .update({ answers })
        .eq("user_id", userId)
        .eq("quiz_date", quizDate),
      "save answers",
    )
  }

  async getQuestions(userId: string, ids: string[]): Promise<QuestionRow[]> {
    if (!ids.length) return []
    const data = check(
      await this.db
        .from("quiz_questions")
        .select(QUESTION_COLUMNS)
        .eq("user_id", userId)
        .in("id", ids),
      "read questions",
    )
    return ((data ?? []) as QuestionRecord[]).map(toQuestion)
  }

  async insertQuestions(userId: string, questions: NewQuestion[]): Promise<QuestionRow[]> {
    if (!questions.length) return []
    const data = check(
      await this.db
        .from("quiz_questions")
        .insert(
          questions.map((question) => ({
            user_id: userId,
            course_id: question.courseId,
            course_name: question.courseName,
            topic: question.topic,
            question: question.question,
            options: question.options,
            answer_index: question.answerIndex,
            explanation: question.explanation,
            created_on: question.createdOn,
          })),
        )
        .select(QUESTION_COLUMNS),
      "insert questions",
    )
    return ((data ?? []) as QuestionRecord[]).map(toQuestion)
  }

  async updateQuestionStats(userId: string, id: string, patch: QuestionStatsPatch) {
    check(
      await this.db
        .from("quiz_questions")
        .update({
          times_wrong: patch.timesWrong,
          review_streak: patch.reviewStreak,
          mastered: patch.mastered,
          last_answered_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("id", id),
      "update question",
    )
  }

  async listOpenMistakes(userId: string, limit: number): Promise<QuestionRow[]> {
    const data = check(
      await this.db
        .from("quiz_questions")
        .select(QUESTION_COLUMNS)
        .eq("user_id", userId)
        .gt("times_wrong", 0)
        .eq("mastered", false)
        .order("last_answered_at", { ascending: true })
        .limit(limit),
      "list mistakes",
    )
    return ((data ?? []) as QuestionRecord[]).map(toQuestion)
  }

  async countOpenMistakes(userId: string): Promise<number> {
    const result = await this.db
      .from("quiz_questions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("times_wrong", 0)
      .eq("mastered", false)
    check(result, "count mistakes")
    return result.count ?? 0
  }

  async listRecentStems(userId: string, sinceDate: string, limit: number): Promise<string[]> {
    const data = check(
      await this.db
        .from("quiz_questions")
        .select("question")
        .eq("user_id", userId)
        .gte("created_on", sinceDate)
        .order("created_at", { ascending: false })
        .limit(limit),
      "list recent questions",
    )
    return (data ?? []).map((row) => String(row.question).slice(0, 140))
  }
}
