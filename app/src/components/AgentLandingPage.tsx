/**
 * @file ./src/components/AgentLandingPage.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [PAGE] Landing page template for specific agents (Courses, Dorms, Resume).
// [页面] 用于特定智能体（课程、宿舍、简历）的着陆页模板。
import * as React from "react"
import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { type Language } from "../types"
import { UI_TEXT } from "../i18n/uiText"
import {
  type MailingListTopic,
  mailingListService,
} from "../services/mailingListService"

interface AgentLandingPageProps {
  type: "courses" | "dorms" | "resume"
  language: Language
}

const AGENT_CONFIG = {
  courses: {
    icon: (
      <svg
        className="text-illini-blue size-10"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
    ),
    gradient: "from-illini-blue to-blue-600",
  },
  dorms: {
    icon: (
      <svg
        className="text-illini-orange size-10"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
    gradient: "from-illini-orange to-orange-500",
  },
  resume: {
    icon: (
      <svg
        className="size-10 text-emerald-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    gradient: "from-emerald-500 to-teal-600",
  },
}

export const AgentLandingPage: React.FC<AgentLandingPageProps> = ({
  type,
  language,
}) => {
  const t = UI_TEXT[language]
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const config = AGENT_CONFIG[type]

  const title =
    type === "courses"
      ? t.coursesTitle
      : type === "dorms"
        ? t.dormsTitle
        : t.resumeTitle
  const desc =
    type === "courses"
      ? t.coursesDesc
      : type === "dorms"
        ? t.dormsDesc
        : t.resumeDesc

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      return
    }
    setSubmitting(true)
    setError(null)

    const result = await mailingListService.subscribe(
      email,
      type as MailingListTopic
    )
    setSubmitting(false)

    if (result.success) {
      setSubmitted(true)
    } else {
      setError(
        language === "zh"
          ? "提交失败，请重试。"
          : "Failed to submit. Please try again."
      )
    }
  }

  return (
    <div className="flex size-full items-center justify-center overflow-auto bg-white p-4 md:p-8">
      <div className="relative w-full max-w-md text-center">
        {/* Icon - static, doesn't change with language */}
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 shadow-sm md:mb-6 md:size-20">
          {config.icon}
        </div>

        {/* Animated text content with crossfade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={language}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Title */}
            <h1 className="mb-3 text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>

            {/* Coming Soon Badge */}
            <div className="mb-5">
              <span className="bg-illini-orange inline-block rounded-full px-3 py-1 text-xs font-semibold text-white">
                {t.comingSoon}
              </span>
            </div>

            {/* Description */}
            <p className="mx-auto mb-8 min-h-12 max-w-sm text-sm/relaxed text-slate-500">
              {desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Email Form - partially animated */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="mx-auto max-w-xs space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              required
              className="focus:ring-illini-blue/10 w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-slate-300 focus:ring-2 focus:outline-none"
            />
            <AnimatePresence mode="wait">
              <motion.button
                key={language + "-btn"}
                type="submit"
                disabled={submitting}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-illini-orange hover:bg-illini-orange/90 w-full rounded-full py-3 text-sm font-semibold text-white shadow-md transition-colors active:scale-[0.98] disabled:opacity-60"
              >
                {submitting
                  ? language === "zh"
                    ? "提交中…"
                    : "Submitting…"
                  : t.notifyMe}
              </motion.button>
            </AnimatePresence>
            {error && (
              <p className="text-center text-xs text-red-500">{error}</p>
            )}
          </form>
        ) : (
          <div className="mx-auto max-w-xs rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <span className="mb-2 block text-2xl">✅</span>
            <p className="text-sm font-medium text-slate-600">
              {t.emailSuccess}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
