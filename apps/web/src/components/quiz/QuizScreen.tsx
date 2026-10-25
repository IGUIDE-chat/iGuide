import React, { useCallback, useEffect, useRef, useState } from "react"

import { useAuth } from "../../contexts/AuthContext"
import {
  quizApi,
  QuizApiError,
  type DailyQuiz,
  type QuizMistake,
  type QuizStatus,
} from "../../services/quizApi"
import type { Language } from "../../types"
import { canvasExtensionVersion, syncCanvas } from "./canvasBridge"
import { CanvasPanel } from "./CanvasPanel"
import { QuestionCard } from "./QuestionCard"
import { QUIZ_TEXT, type QuizText } from "./quizText"

/** A background sync runs at most this often; the button always works. */
const AUTO_SYNC_AFTER_MS = 20 * 60 * 60 * 1000

interface QuizScreenProps {
  language: Language
}

type Tab = "today" | "mistakes"

const MistakeList: React.FC<{ mistakes: QuizMistake[] | null; text: QuizText }> = ({
  mistakes,
  text,
}) => {
  if (!mistakes) return <p className="py-8 text-center text-sm text-slate-500">{text.loading}</p>
  if (!mistakes.length) {
    return <p className="py-8 text-center text-sm text-slate-500">{text.mistakesEmpty}</p>
  }
  return (
    <div className="space-y-3">
      {mistakes.map((mistake) => (
        <article key={mistake.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              {mistake.courseName}
            </span>
            <span className="text-slate-400">{mistake.topic}</span>
            <span className="text-red-500">{text.missed(mistake.timesWrong)}</span>
          </div>
          <p className="mb-2 text-sm font-medium whitespace-pre-line text-slate-900">
            {mistake.question}
          </p>
          <p className="text-sm text-emerald-800">
            <span className="font-semibold">{text.answer}: </span>
            {mistake.options[mistake.answerIndex]}
          </p>
          {mistake.explanation && (
            <p className="mt-1 text-sm text-slate-600">{mistake.explanation}</p>
          )}
        </article>
      ))}
    </div>
  )
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ language }) => {
  const text = QUIZ_TEXT[language]
  const { user } = useAuth()
  const [status, setStatus] = useState<QuizStatus | null>(null)
  const [extensionInstalled, setExtensionInstalled] = useState(false)
  const [tab, setTab] = useState<Tab>("today")
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [answering, setAnswering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState<QuizMistake[] | null>(null)
  const autoSynced = useRef(false)

  const describeError = useCallback(
    (caught: unknown) => (caught instanceof QuizApiError ? caught.message : text.error),
    [text.error],
  )

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await quizApi.status())
    } catch (caught) {
      setError(describeError(caught))
    }
  }, [describeError])

  const runSync = useCallback(
    async (interactive: boolean) => {
      setSyncing(true)
      setSyncMessage(null)
      try {
        const result = await syncCanvas(interactive)
        if (result.status === "OK") {
          if (!result.courses.length) setSyncMessage(text.noCourses)
          await quizApi.uploadCourses(result.courses)
          await loadStatus()
        } else if (result.status === "NEEDS_SIGN_IN") {
          setSyncMessage(text.needsSignIn)
        } else if (result.status === "ERROR") {
          setSyncMessage(`${text.syncFailed}: ${result.message}`)
        } else {
          // CANCELLED or TIMEOUT: the sign-in tab was closed or left unfinished.
          setSyncMessage(text.cancelled)
        }
      } catch (caught) {
        setSyncMessage(`${text.syncFailed}: ${describeError(caught)}`)
      } finally {
        setSyncing(false)
      }
    },
    [describeError, loadStatus, text],
  )

  useEffect(() => {
    // The extension marks the page at document_start; check again shortly after
    // in case this effect ran first.
    setExtensionInstalled(Boolean(canvasExtensionVersion()))
    const timer = window.setTimeout(
      () => setExtensionInstalled(Boolean(canvasExtensionVersion())),
      500,
    )
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (user) void loadStatus()
  }, [user, loadStatus])

  // Refresh course progress in the background once a day, without opening tabs.
  useEffect(() => {
    if (!status || !extensionInstalled || autoSynced.current) return
    autoSynced.current = true
    const stale =
      !status.lastSyncedAt ||
      Date.now() - new Date(status.lastSyncedAt).getTime() > AUTO_SYNC_AFTER_MS
    if (stale && !status.quiz) void runSync(false)
  }, [status, extensionInstalled, runSync])

  useEffect(() => {
    if (tab !== "mistakes" || !user) return
    setMistakes(null)
    quizApi
      .mistakes()
      .then(({ mistakes: list }) => setMistakes(list))
      .catch((caught) => setError(describeError(caught)))
  }, [tab, user, describeError])

  const setQuiz = (quiz: DailyQuiz) =>
    setStatus((current) => (current ? { ...current, quiz } : current))

  const startQuiz = async () => {
    setGenerating(true)
    setError(null)
    try {
      const { quiz } = await quizApi.startToday(language)
      setQuiz(quiz)
    } catch (caught) {
      setError(
        caught instanceof QuizApiError && caught.code === "NO_COURSES"
          ? text.needCourse
          : describeError(caught),
      )
    } finally {
      setGenerating(false)
    }
  }

  const answer = async (questionId: string, choice: number) => {
    setAnswering(true)
    try {
      const { quiz } = await quizApi.answer(questionId, choice)
      setQuiz(quiz)
    } catch (caught) {
      setError(describeError(caught))
    } finally {
      setAnswering(false)
    }
  }

  const toggleCourse = async (courseId: number, enabled: boolean) => {
    setStatus((current) =>
      current
        ? {
            ...current,
            courses: current.courses.map((course) =>
              course.courseId === courseId ? { ...course, enabled } : course,
            ),
          }
        : current,
    )
    try {
      await quizApi.setCourseEnabled(courseId, enabled)
    } catch (caught) {
      setError(describeError(caught))
      void loadStatus()
    }
  }

  if (!user) {
    return (
      <div className="flex size-full items-center justify-center bg-white p-6 text-center">
        <div className="max-w-sm">
          <h1 className="mb-2 text-xl font-bold text-slate-900">{text.signInTitle}</h1>
          <p className="text-sm text-slate-500">{text.signInBody}</p>
        </div>
      </div>
    )
  }

  const quiz = status?.quiz ?? null
  const hasEnabledCourse = Boolean(status?.courses.some((course) => course.enabled))
  const finished = quiz && quiz.questions.length > 0 && quiz.answeredCount === quiz.questions.length

  return (
    <div className="size-full overflow-auto bg-slate-50/60">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 md:py-10">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{text.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
        </header>

        <CanvasPanel
          text={text}
          language={language}
          extensionInstalled={extensionInstalled}
          courses={status?.courses ?? []}
          lastSyncedAt={status?.lastSyncedAt ?? null}
          syncing={syncing}
          message={syncMessage}
          onSync={() => void runSync(true)}
          onToggleCourse={(courseId, enabled) => void toggleCourse(courseId, enabled)}
        />

        <nav className="flex gap-1 rounded-full bg-slate-100 p-1 text-sm">
          {(["today", "mistakes"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex-1 rounded-full px-3 py-1.5 font-medium transition-colors ${
                tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              {key === "today" ? text.todayTab : text.mistakesTab}
              {key === "mistakes" && status?.mistakeCount ? ` · ${status.mistakeCount}` : ""}
            </button>
          ))}
        </nav>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {tab === "mistakes" ? (
          <MistakeList mistakes={mistakes} text={text} />
        ) : !status ? (
          <p className="py-8 text-center text-sm text-slate-500">{text.loading}</p>
        ) : quiz ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-600">
              {finished
                ? text.done(quiz.correctCount, quiz.questions.length)
                : text.progress(quiz.answeredCount, quiz.questions.length, quiz.correctCount)}
            </p>
            {quiz.questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                index={index}
                question={question}
                text={text}
                busy={answering}
                onAnswer={(choice) => void answer(question.id, choice)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
            {generating ? (
              <p className="text-sm text-slate-600">{text.generating}</p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void startQuiz()}
                  disabled={!hasEnabledCourse || syncing}
                  className="bg-illini-orange hover:bg-illini-orange/90 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                >
                  {text.start}
                </button>
                {!hasEnabledCourse && (
                  <p className="mt-3 text-xs text-slate-500">{text.needCourse}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
