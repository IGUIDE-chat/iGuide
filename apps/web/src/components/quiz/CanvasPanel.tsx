import React from "react"

import type { QuizCourse } from "../../services/quizApi"
import { EXTENSION_DOWNLOAD_URL, type QuizText } from "./quizText"

interface CanvasPanelProps {
  text: QuizText
  language: "en" | "zh"
  extensionInstalled: boolean
  courses: QuizCourse[]
  lastSyncedAt: string | null
  syncing: boolean
  message: string | null
  onSync: () => void
  onToggleCourse: (courseId: number, enabled: boolean) => void
}

function formatTime(value: string | null, language: "en" | "zh", never: string): string {
  if (!value) return never
  return new Date(value).toLocaleString(language === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export const CanvasPanel: React.FC<CanvasPanelProps> = ({
  text,
  language,
  extensionInstalled,
  courses,
  lastSyncedAt,
  syncing,
  message,
  onSync,
  onToggleCourse,
}) => {
  if (!extensionInstalled) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">{text.installTitle}</h2>
        <p className="mb-3 text-sm/relaxed text-slate-600">{text.installBody}</p>
        <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-slate-600">
          {text.installSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <a
          href={EXTENSION_DOWNLOAD_URL}
          download
          className="bg-illini-orange hover:bg-illini-orange/90 inline-block rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          {text.download}
        </a>
      </section>
    )
  }

  const connected = courses.length > 0

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{text.canvasTitle}</h2>
          <p className="text-xs text-slate-500">
            {text.lastSynced}: {formatTime(lastSyncedAt, language, text.never)}
          </p>
        </div>
        <button
          type="button"
          onClick={onSync}
          disabled={syncing}
          className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {syncing ? text.syncing : connected ? text.syncNow : text.connect}
        </button>
      </div>

      {!connected && !syncing && <p className="text-xs text-slate-500">{text.connectHint}</p>}
      {message && <p className="mb-2 text-xs text-amber-700">{message}</p>}

      {connected && (
        <>
          <div className="flex flex-wrap gap-2">
            {courses.map((course) => (
              <button
                key={course.courseId}
                type="button"
                onClick={() => onToggleCourse(course.courseId, !course.enabled)}
                title={course.name}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  course.enabled
                    ? "border-illini-blue bg-illini-blue text-white"
                    : "border-slate-200 bg-white text-slate-400 line-through"
                }`}
              >
                {course.courseCode || course.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">{text.courseHint}</p>
        </>
      )}
    </section>
  )
}
