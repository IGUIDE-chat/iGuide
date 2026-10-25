import React from "react"

import type { QuizQuestion } from "../../services/quizApi"
import type { QuizText } from "./quizText"

interface QuestionCardProps {
  index: number
  question: QuizQuestion
  text: QuizText
  busy: boolean
  onAnswer: (choice: number) => void
}

const LETTERS = ["A", "B", "C", "D", "E", "F"]

export const QuestionCard: React.FC<QuestionCardProps> = ({
  index,
  question,
  text,
  busy,
  onAnswer,
}) => {
  const result = question.result

  const optionClass = (optionIndex: number) => {
    if (!result) {
      return "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
    }
    if (optionIndex === result.answerIndex)
      return "border-emerald-500 bg-emerald-50 text-emerald-900"
    if (optionIndex === result.choice) return "border-red-400 bg-red-50 text-red-900"
    return "border-slate-100 bg-white text-slate-400"
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-400">#{index + 1}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
          {question.courseName}
        </span>
        <span className="text-slate-400">{question.topic}</span>
        {question.isReview && (
          <span className="bg-illini-orange/10 text-illini-orange rounded-full px-2 py-0.5 font-semibold">
            {text.review}
          </span>
        )}
      </div>

      <p className="mb-4 text-[15px]/relaxed font-medium whitespace-pre-line text-slate-900">
        {question.question}
      </p>

      <div className="space-y-2">
        {question.options.map((option, optionIndex) => (
          <button
            key={optionIndex}
            type="button"
            disabled={Boolean(result) || busy}
            onClick={() => onAnswer(optionIndex)}
            className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-default ${optionClass(optionIndex)}`}
          >
            <span className="mt-px font-semibold">{LETTERS[optionIndex]}</span>
            <span className="whitespace-pre-line">{option}</span>
          </button>
        ))}
      </div>

      {result && (
        <div
          className={`mt-4 rounded-xl px-3 py-2.5 text-sm/relaxed ${
            result.correct ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
          }`}
        >
          <span className="font-semibold">{result.correct ? text.correct : text.wrong}</span>
          {result.explanation && <span className="ml-1">{result.explanation}</span>}
        </div>
      )}
    </article>
  )
}
