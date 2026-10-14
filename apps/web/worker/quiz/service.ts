/**
 * The daily quiz: one quiz per student per UIUC calendar day, built from fresh
 * questions on what each course is covering now plus a few past mistakes.
 *
 * A mistake keeps coming back until the student answers it right twice in a
 * row; answering a never-missed question right changes nothing.
 */

import {
  generateQuestions,
  shuffle,
  type CourseContext,
  type FetchLike,
  type QuizLanguage,
} from "./generate.ts"
import type {
  CourseRow,
  CourseUpload,
  DailyRow,
  QuestionRow,
  QuestionStatsPatch,
  QuizStore,
} from "./store.ts"

export const QUIZ_TIME_ZONE = "America/Chicago"
export const NEW_QUESTIONS_PER_DAY = 8
export const REVIEW_QUESTIONS_PER_DAY = 4
export const MAX_COURSES = 12
export const MAX_DIGEST_CHARS = 12_000
/** Correct answers in a row that take a question out of the mistake bank. */
export const MASTERY_STREAK = 2

export class QuizError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "QuizError"
    this.status = status
    this.code = code
  }
}

export interface AnswerResult {
  choice: number
  correct: boolean
  answerIndex: number
  explanation: string
}

export interface QuizQuestionView {
  id: string
  courseName: string
  topic: string
  question: string
  options: string[]
  isReview: boolean
  /** Present once answered; the answer stays hidden until then. */
  result?: AnswerResult
}

export interface QuizView {
  date: string
  questions: QuizQuestionView[]
  answeredCount: number
  correctCount: number
}

export interface CourseSummary {
  courseId: number
  name: string
  courseCode: string | null
  enabled: boolean
  syncedAt: string | null
}

export interface QuizStatus {
  today: string
  courses: CourseSummary[]
  lastSyncedAt: string | null
  quiz: QuizView | null
  mistakeCount: number
}

export interface MistakeView {
  id: string
  courseName: string
  topic: string
  question: string
  options: string[]
  answerIndex: number
  explanation: string
  timesWrong: number
  reviewStreak: number
}

/** `YYYY-MM-DD` in Urbana-Champaign, so a quiz turns over at local midnight. */
export function quizDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: QUIZ_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function applyAnswer(question: QuestionRow, correct: boolean): QuestionStatsPatch {
  if (!correct) {
    return { timesWrong: question.timesWrong + 1, reviewStreak: 0, mastered: false }
  }
  if (question.timesWrong === 0) {
    return { timesWrong: 0, reviewStreak: question.reviewStreak, mastered: question.mastered }
  }
  const reviewStreak = question.reviewStreak + 1
  return { timesWrong: question.timesWrong, reviewStreak, mastered: reviewStreak >= MASTERY_STREAK }
}

/** Spreads `total` questions over the courses, at least one each. */
export function splitQuestionCount(total: number, courseCount: number): number[] {
  if (courseCount <= 0) return []
  const base = Math.max(1, Math.floor(total / courseCount))
  const extra = Math.max(0, total - base * courseCount)
  return Array.from({ length: courseCount }, (_, index) => base + (index < extra ? 1 : 0))
}

/** Validates the extension's upload; anything malformed is a 400. */
export function parseCourseUpload(body: unknown): CourseUpload[] {
  const list = (body as { courses?: unknown } | null)?.courses
  if (!Array.isArray(list)) throw new QuizError(400, "INVALID_UPLOAD", "courses must be an array")
  if (list.length > MAX_COURSES) {
    throw new QuizError(400, "INVALID_UPLOAD", `At most ${MAX_COURSES} courses can be synced`)
  }
  const seen = new Set<number>()
  return list.map((item) => {
    const course = item as Record<string, unknown>
    const courseId = Number(course.courseId)
    if (!Number.isSafeInteger(courseId) || courseId <= 0 || seen.has(courseId)) {
      throw new QuizError(400, "INVALID_UPLOAD", "Each course needs a unique numeric courseId")
    }
    seen.add(courseId)
    if (typeof course.name !== "string" || !course.name.trim()) {
      throw new QuizError(400, "INVALID_UPLOAD", "Each course needs a name")
    }
    if (typeof course.digest !== "string") {
      throw new QuizError(400, "INVALID_UPLOAD", "Each course needs a digest")
    }
    return {
      courseId,
      name: course.name.trim().slice(0, 200),
      courseCode:
        typeof course.courseCode === "string" && course.courseCode.trim()
          ? course.courseCode.trim().slice(0, 100)
          : null,
      digest: course.digest.slice(0, MAX_DIGEST_CHARS),
    }
  })
}

function toSummary(course: CourseRow): CourseSummary {
  return {
    courseId: course.courseId,
    name: course.name,
    courseCode: course.courseCode,
    enabled: course.enabled,
    syncedAt: course.syncedAt,
  }
}

function buildView(daily: DailyRow, questions: QuestionRow[]): QuizView {
  const byId = new Map(questions.map((question) => [question.id, question]))
  const reviews = new Set(daily.reviewIds)
  const views: QuizQuestionView[] = []
  let correctCount = 0

  for (const id of daily.questionIds) {
    const question = byId.get(id)
    if (!question) continue
    const view: QuizQuestionView = {
      id,
      courseName: question.courseName,
      topic: question.topic,
      question: question.question,
      options: question.options,
      isReview: reviews.has(id),
    }
    const choice = daily.answers[id]
    if (typeof choice === "number") {
      const correct = choice === question.answerIndex
      if (correct) correctCount += 1
      view.result = {
        choice,
        correct,
        answerIndex: question.answerIndex,
        explanation: question.explanation,
      }
    }
    views.push(view)
  }

  return {
    date: daily.quizDate,
    questions: views,
    answeredCount: views.filter((view) => view.result).length,
    correctCount,
  }
}

export interface QuizServiceDeps {
  deepseekKey: string | undefined
  fetch?: FetchLike
  now?: () => Date
  random?: () => number
}

export class QuizService {
  private readonly store: QuizStore
  private readonly deps: QuizServiceDeps

  constructor(store: QuizStore, deps: QuizServiceDeps) {
    this.store = store
    this.deps = deps
  }

  private today(): string {
    return quizDate(this.deps.now?.() ?? new Date())
  }

  private async view(userId: string, daily: DailyRow): Promise<QuizView> {
    return buildView(daily, await this.store.getQuestions(userId, daily.questionIds))
  }

  async status(userId: string): Promise<QuizStatus> {
    const today = this.today()
    const [courses, daily, mistakeCount] = await Promise.all([
      this.store.listCourses(userId),
      this.store.getDaily(userId, today),
      this.store.countOpenMistakes(userId),
    ])
    const synced = courses
      .map((course) => course.syncedAt)
      .filter((value): value is string => !!value)
    return {
      today,
      courses: courses.map(toSummary),
      lastSyncedAt: synced.length ? (synced.sort().at(-1) ?? null) : null,
      quiz: daily ? await this.view(userId, daily) : null,
      mistakeCount,
    }
  }

  async uploadCourses(userId: string, body: unknown): Promise<CourseSummary[]> {
    const courses = parseCourseUpload(body)
    const syncedAt = (this.deps.now?.() ?? new Date()).toISOString()
    await this.store.replaceCourses(userId, courses, syncedAt)
    return (await this.store.listCourses(userId)).map(toSummary)
  }

  async setCourseEnabled(userId: string, courseId: number, enabled: unknown): Promise<void> {
    if (typeof enabled !== "boolean") {
      throw new QuizError(400, "INVALID_BODY", "enabled must be true or false")
    }
    if (!(await this.store.setCourseEnabled(userId, courseId, enabled))) {
      throw new QuizError(404, "COURSE_NOT_FOUND", "No such course")
    }
  }

  /** Today's quiz, generating it on the first call of the day. */
  async ensureToday(userId: string, language: QuizLanguage): Promise<QuizView> {
    const today = this.today()
    const existing = await this.store.getDaily(userId, today)
    if (existing) return this.view(userId, existing)

    const courses = (await this.store.listCourses(userId))
      .filter((course) => course.enabled && course.digest)
      .slice(0, NEW_QUESTIONS_PER_DAY)
    if (!courses.length) {
      throw new QuizError(409, "NO_COURSES", "Sync Canvas and enable at least one course first")
    }

    const random = this.deps.random ?? Math.random
    const counts = splitQuestionCount(NEW_QUESTIONS_PER_DAY, courses.length)
    const contexts: CourseContext[] = courses.map((course, index) => ({
      courseId: course.courseId,
      courseName: course.courseCode || course.name,
      digest: course.digest as string,
      questionCount: counts[index],
    }))

    const [recentQuestions, mistakes] = await Promise.all([
      this.store.listRecentStems(userId, addDays(today, -14), 40),
      this.store.listOpenMistakes(userId, 30),
    ])
    const reviews = shuffle(
      mistakes.filter((question) => question.createdOn < today),
      random,
    ).slice(0, REVIEW_QUESTIONS_PER_DAY)

    let generated
    try {
      generated = await generateQuestions({
        apiKey: this.deps.deepseekKey,
        courses: contexts,
        today,
        language,
        recentQuestions,
        fetch: this.deps.fetch,
      })
    } catch (error) {
      console.error("Quiz generation failed:", error)
      throw new QuizError(502, "GENERATION_FAILED", "Could not generate today's questions")
    }

    const inserted = await this.store.insertQuestions(
      userId,
      generated.map((question) => ({ ...question, createdOn: today })),
    )
    const daily = await this.store.insertDaily(userId, {
      quizDate: today,
      questionIds: shuffle([...inserted, ...reviews], random).map((question) => question.id),
      reviewIds: reviews.map((question) => question.id),
      answers: {},
    })
    return this.view(userId, daily)
  }

  async answer(userId: string, body: unknown): Promise<QuizView> {
    const { questionId, choice } = (body ?? {}) as { questionId?: unknown; choice?: unknown }
    if (typeof questionId !== "string" || !Number.isInteger(choice)) {
      throw new QuizError(400, "INVALID_BODY", "questionId and an integer choice are required")
    }
    const today = this.today()
    const daily = await this.store.getDaily(userId, today)
    if (!daily || !daily.questionIds.includes(questionId)) {
      throw new QuizError(404, "QUESTION_NOT_FOUND", "That question is not in today's quiz")
    }
    // The first answer counts; a resubmission just returns the quiz as it is.
    if (typeof daily.answers[questionId] === "number") return this.view(userId, daily)

    const [question] = await this.store.getQuestions(userId, [questionId])
    if (!question) throw new QuizError(404, "QUESTION_NOT_FOUND", "That question no longer exists")
    const index = choice as number
    if (index < 0 || index >= question.options.length) {
      throw new QuizError(400, "INVALID_BODY", "choice is out of range")
    }

    await this.store.updateQuestionStats(
      userId,
      questionId,
      applyAnswer(question, index === question.answerIndex),
    )
    const answers = { ...daily.answers, [questionId]: index }
    await this.store.saveAnswers(userId, today, answers)
    return this.view(userId, { ...daily, answers })
  }

  async mistakes(userId: string): Promise<MistakeView[]> {
    const rows = await this.store.listOpenMistakes(userId, 100)
    return rows.map((row) => ({
      id: row.id,
      courseName: row.courseName,
      topic: row.topic,
      question: row.question,
      options: row.options,
      answerIndex: row.answerIndex,
      explanation: row.explanation,
      timesWrong: row.timesWrong,
      reviewStreak: row.reviewStreak,
    }))
  }
}
