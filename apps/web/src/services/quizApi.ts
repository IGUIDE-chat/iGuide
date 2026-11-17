import { supabase } from "./supabase"

const API_ROOT = "/api/quiz"

export interface QuizAnswerResult {
  choice: number
  correct: boolean
  answerIndex: number
  explanation: string
}

export interface QuizQuestion {
  id: string
  courseName: string
  topic: string
  question: string
  options: string[]
  isReview: boolean
  result?: QuizAnswerResult
}

export interface DailyQuiz {
  date: string
  questions: QuizQuestion[]
  answeredCount: number
  correctCount: number
}

export interface QuizCourse {
  courseId: number
  name: string
  courseCode: string | null
  enabled: boolean
  syncedAt: string | null
}

export interface QuizStatus {
  today: string
  courses: QuizCourse[]
  lastSyncedAt: string | null
  quiz: DailyQuiz | null
  mistakeCount: number
}

export interface QuizMistake {
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

export interface CourseDigestUpload {
  courseId: number
  name: string
  courseCode: string | null
  digest: string
}

/** A failed `/api/quiz` call, carrying the endpoint's stable code. */
export class QuizApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "QuizApiError"
    this.status = status
    this.code = code
  }
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const headers: Record<string, string> = {}
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`
  if (init.body !== undefined) headers["Content-Type"] = "application/json"

  const response = await fetch(`${API_ROOT}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      error?: string
      code?: string
    } | null
    throw new QuizApiError(
      response.status,
      error?.code ?? `HTTP_${response.status}`,
      error?.error ?? `Quiz request failed (${response.status})`,
    )
  }
  return (await response.json()) as T
}

export const quizApi = {
  status: () => request<QuizStatus>("/status"),
  uploadCourses: (courses: CourseDigestUpload[]) =>
    request<{ courses: QuizCourse[] }>("/courses", { method: "PUT", body: { courses } }),
  setCourseEnabled: (courseId: number, enabled: boolean) =>
    request<{ ok: true }>(`/courses/${courseId}`, { method: "PATCH", body: { enabled } }),
  startToday: (language: "en" | "zh") =>
    request<{ quiz: DailyQuiz }>("/today", { method: "POST", body: { language } }),
  answer: (questionId: string, choice: number) =>
    request<{ quiz: DailyQuiz }>("/today/answers", {
      method: "POST",
      body: { questionId, choice },
    }),
  mistakes: () => request<{ mistakes: QuizMistake[] }>("/mistakes"),
}
