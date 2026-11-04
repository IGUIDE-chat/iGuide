import assert from "node:assert/strict"
import test from "node:test"

import { normalizeQuestions } from "./generate.ts"
import {
  QuizError,
  QuizService,
  applyAnswer,
  parseCourseUpload,
  quizDate,
  splitQuestionCount,
} from "./service.ts"
import type {
  CourseRow,
  CourseUpload,
  DailyRow,
  NewQuestion,
  QuestionRow,
  QuestionStatsPatch,
  QuizStore,
} from "./store.ts"

class MemoryStore implements QuizStore {
  courses: CourseRow[] = []
  questions: QuestionRow[] = []
  daily = new Map<string, DailyRow>()
  private nextId = 1

  async listCourses() {
    return this.courses
  }
  async replaceCourses(_userId: string, courses: CourseUpload[], syncedAt: string) {
    const enabled = new Map(this.courses.map((course) => [course.courseId, course.enabled]))
    this.courses = courses.map((course) => ({
      ...course,
      enabled: enabled.get(course.courseId) ?? true,
      syncedAt,
    }))
  }
  async setCourseEnabled(_userId: string, courseId: number, enabled: boolean) {
    const course = this.courses.find((row) => row.courseId === courseId)
    if (course) course.enabled = enabled
    return Boolean(course)
  }
  async getDaily(_userId: string, quizDate: string) {
    return this.daily.get(quizDate) ?? null
  }
  async insertDaily(_userId: string, row: DailyRow) {
    this.daily.set(row.quizDate, row)
    return row
  }
  async saveAnswers(_userId: string, quizDate: string, answers: Record<string, number>) {
    const row = this.daily.get(quizDate)
    if (row) row.answers = answers
  }
  async getQuestions(_userId: string, ids: string[]) {
    return this.questions.filter((question) => ids.includes(question.id))
  }
  async insertQuestions(_userId: string, questions: NewQuestion[]) {
    const rows = questions.map((question) => ({
      ...question,
      id: `q${this.nextId++}`,
      timesWrong: 0,
      reviewStreak: 0,
      mastered: false,
    }))
    this.questions.push(...rows)
    return rows
  }
  async updateQuestionStats(_userId: string, id: string, patch: QuestionStatsPatch) {
    Object.assign(this.questions.find((question) => question.id === id) ?? {}, patch)
  }
  async listOpenMistakes() {
    return this.questions.filter((question) => question.timesWrong > 0 && !question.mastered)
  }
  async countOpenMistakes() {
    return (await this.listOpenMistakes()).length
  }
  async listRecentStems() {
    return this.questions.map((question) => question.question)
  }
}

function deepSeekReturning(questions: unknown[]) {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = []
  const fetch = async (url: string, init?: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init?.body)) })
    return new Response(
      JSON.stringify({ choices: [{ message: { content: JSON.stringify({ questions }) } }] }),
      { status: 200 },
    )
  }
  return { fetch, calls }
}

const sampleQuestion = (courseId: number, question: string) => ({
  course_id: courseId,
  topic: "Limits",
  question,
  options: ["A", "B", "C", "D"],
  answer_index: 2,
  explanation: "Because C.",
})

const course = (courseId: number, enabled = true): CourseRow => ({
  courseId,
  name: `Course ${courseId}`,
  courseCode: `C ${courseId}`,
  enabled,
  digest: `Digest for ${courseId}`,
  syncedAt: "2026-10-14T12:00:00.000Z",
})

const NOON_CHICAGO = new Date("2026-10-14T17:00:00Z")

test("quizDate follows Urbana-Champaign midnight, not UTC", () => {
  assert.equal(quizDate(new Date("2026-10-15T03:00:00Z")), "2026-10-14")
  assert.equal(quizDate(new Date("2026-10-15T06:00:00Z")), "2026-10-15")
})

test("splitQuestionCount spreads questions and gives every course one", () => {
  assert.deepEqual(splitQuestionCount(8, 3), [3, 3, 2])
  assert.deepEqual(splitQuestionCount(8, 10), Array(10).fill(1))
  assert.deepEqual(splitQuestionCount(8, 0), [])
})

test("applyAnswer keeps a mistake open until two correct answers in a row", () => {
  const base: QuestionRow = {
    id: "q",
    courseId: 1,
    courseName: "C",
    topic: "t",
    question: "?",
    options: ["a", "b", "c", "d"],
    answerIndex: 0,
    explanation: "",
    createdOn: "2026-10-01",
    timesWrong: 0,
    reviewStreak: 0,
    mastered: false,
  }
  assert.deepEqual(applyAnswer(base, true), { timesWrong: 0, reviewStreak: 0, mastered: false })
  const wrong = { ...base, ...applyAnswer(base, false) }
  assert.deepEqual(wrong, { ...base, timesWrong: 1 })
  const once = { ...wrong, ...applyAnswer(wrong, true) }
  assert.equal(once.mastered, false)
  const twice = { ...once, ...applyAnswer(once, true) }
  assert.equal(twice.mastered, true)
  assert.deepEqual(applyAnswer(once, false), { timesWrong: 2, reviewStreak: 0, mastered: false })
})

test("normalizeQuestions drops malformed items and keeps the answer through the shuffle", () => {
  const courses = [{ courseId: 7, courseName: "MATH 444", digest: "", questionCount: 2 }]
  let seed = 0.37
  const random = () => (seed = (seed * 9301 + 0.49297) % 1)
  const result = normalizeQuestions(
    {
      questions: [
        { ...sampleQuestion(7, "Good?"), options: ["w", "x", "right", "z"] },
        sampleQuestion(99, "Unknown course"),
        { ...sampleQuestion(7, "Three options"), options: ["a", "b", "c"] },
        { ...sampleQuestion(7, "Duplicate options"), options: ["a", "a", "b", "c"] },
        { ...sampleQuestion(7, "Bad index"), answer_index: 4 },
      ],
    },
    courses,
    random,
  )
  assert.equal(result.length, 1)
  assert.equal(result[0].options[result[0].answerIndex], "right")
  assert.equal(result[0].courseName, "MATH 444")
})

test("parseCourseUpload rejects malformed uploads and clips digests", () => {
  assert.throws(() => parseCourseUpload({}), QuizError)
  assert.throws(
    () =>
      parseCourseUpload({
        courses: [
          { courseId: 1, name: "A", digest: "" },
          { courseId: 1, name: "B", digest: "" },
        ],
      }),
    /unique/,
  )
  const [parsed] = parseCourseUpload({
    courses: [{ courseId: "12", name: " STAT 410 ", courseCode: "", digest: "x".repeat(20_000) }],
  })
  assert.equal(parsed.courseId, 12)
  assert.equal(parsed.name, "STAT 410")
  assert.equal(parsed.courseCode, null)
  assert.equal(parsed.digest.length, 12_000)
})

test("ensureToday needs a synced, enabled course", async () => {
  const store = new MemoryStore()
  store.courses = [course(1, false)]
  const service = new QuizService(store, { deepseekKey: "k", now: () => NOON_CHICAGO })
  await assert.rejects(
    service.ensureToday("u", "en"),
    (error: QuizError) => error.code === "NO_COURSES",
  )
})

test("ensureToday generates once per day and mixes in past mistakes", async () => {
  const store = new MemoryStore()
  store.courses = [course(1), course(2), course(3, false)]
  store.questions.push({
    id: "old",
    courseId: 1,
    courseName: "C 1",
    topic: "Old",
    question: "Missed before?",
    options: ["a", "b", "c", "d"],
    answerIndex: 1,
    explanation: "b",
    createdOn: "2026-10-10",
    timesWrong: 1,
    reviewStreak: 0,
    mastered: false,
  })
  const provider = deepSeekReturning([sampleQuestion(1, "New one?"), sampleQuestion(2, "New two?")])
  const service = new QuizService(store, {
    deepseekKey: "k",
    fetch: provider.fetch,
    now: () => NOON_CHICAGO,
  })

  const quiz = await service.ensureToday("u", "zh")
  assert.equal(quiz.date, "2026-10-14")
  assert.equal(quiz.questions.length, 3)
  assert.deepEqual(
    quiz.questions.filter((question) => question.isReview).map((question) => question.id),
    ["old"],
  )
  assert.ok(
    quiz.questions.every((question) => !question.result),
    "answers stay hidden",
  )

  // Only enabled courses reach the prompt, and the explanation language follows the caller.
  const prompt = provider.calls[0].body.messages as Array<{ content: string }>
  assert.match(prompt[1].content, /course_id 1/)
  assert.doesNotMatch(prompt[1].content, /course_id 3/)
  assert.match(prompt[0].content, /Simplified Chinese/)

  await service.ensureToday("u", "zh")
  assert.equal(provider.calls.length, 1, "a second call reuses today's quiz")
})

test("answer records the first choice only and updates the mistake bank", async () => {
  const store = new MemoryStore()
  store.courses = [course(1)]
  const provider = deepSeekReturning([sampleQuestion(1, "Pick C?")])
  const service = new QuizService(store, {
    deepseekKey: "k",
    fetch: provider.fetch,
    now: () => NOON_CHICAGO,
  })
  const quiz = await service.ensureToday("u", "en")
  const id = quiz.questions[0].id
  const correctIndex = store.questions[0].answerIndex
  const wrongIndex = (correctIndex + 1) % 4

  const answered = await service.answer("u", { questionId: id, choice: wrongIndex })
  assert.equal(answered.answeredCount, 1)
  assert.equal(answered.correctCount, 0)
  assert.equal(answered.questions[0].result?.answerIndex, correctIndex)
  assert.equal(store.questions[0].timesWrong, 1)

  const again = await service.answer("u", { questionId: id, choice: correctIndex })
  assert.equal(again.questions[0].result?.choice, wrongIndex, "the first answer stands")
  assert.equal(store.questions[0].timesWrong, 1)
  assert.equal((await service.mistakes("u")).length, 1)

  await assert.rejects(
    service.answer("u", { questionId: "nope", choice: 0 }),
    (error: QuizError) => error.status === 404,
  )
  await assert.rejects(
    service.answer("u", { questionId: id }),
    (error: QuizError) => error.status === 400,
  )
})

test("a DeepSeek failure surfaces as a 502 and leaves no quiz behind", async () => {
  const store = new MemoryStore()
  store.courses = [course(1)]
  const service = new QuizService(store, {
    deepseekKey: "k",
    fetch: async () => new Response("busy", { status: 503 }),
    now: () => NOON_CHICAGO,
  })
  await assert.rejects(service.ensureToday("u", "en"), (error: QuizError) => error.status === 502)
  assert.equal(store.daily.size, 0)
})
