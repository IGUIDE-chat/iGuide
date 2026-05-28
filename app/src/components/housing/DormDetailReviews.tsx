import React, { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Globe, MessageSquare, ThumbsUp, User, X } from "lucide-react"
import { type Language } from "../../types"
import { dormDetailTexts } from "./i18n/dormTexts"

interface Comment {
  id: string
  user_id: string
  content: string
  dorm_vote: 1 | -1 | null
  created_at: string
  display_name: string
  upvotes: number
  myVote: 1 | -1 | null
}

interface DormDetailReviewsProps {
  comments: Comment[]
  commentsLoading: boolean
  user: any
  language: Language
  fadeUp: any
  onRequestLogin: () => void
  onSaveComment: (content: string, vote: 1 | -1 | null) => Promise<void>
  onDeleteComment: (commentId: string) => void
  onVoteOnComment: (commentId: string, vote: 1 | -1 | null) => void
}

const isChinese = (text: string) => /[\u4E00-\u9FFF]/.test(text)
const detectLang = (text: string): "zh" | "en" =>
  isChinese(text) ? "zh" : "en"

export const DormDetailReviews: React.FC<DormDetailReviewsProps> = ({
  comments,
  commentsLoading,
  user,
  language,
  fadeUp,
  onRequestLogin,
  onSaveComment,
  onDeleteComment,
  onVoteOnComment,
}) => {
  const t = dormDetailTexts[language]
  const [commentContent, setCommentContent] = useState("")
  const [commentVote, setCommentVote] = useState<1 | -1 | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [translating, setTranslating] = useState<Record<string, boolean>>({})
  const [translateErrors, setTranslateErrors] = useState<
    Record<string, boolean>
  >({})

  const totalReviews = comments.length
  const thumbsUp = comments.filter((c) => c.dorm_vote === 1).length
  const positivePercent =
    totalReviews > 0 ? Math.round((thumbsUp / totalReviews) * 100) : null
  const displayedComments = showAllReviews ? comments : comments.slice(0, 3)

  const handleSubmit = async () => {
    if (!commentContent.trim()) {
      return
    }
    setSubmitting(true)
    try {
      await onSaveComment(commentContent.trim(), commentVote)
      setCommentContent("")
      setCommentVote(null)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = (commentId: string) => {
    const msg =
      language === "zh" ? "确定要删除这条评论吗？" : "Delete this comment?"
    if (!window.confirm(msg)) {
      return
    }
    onDeleteComment(commentId)
  }

  const handleTranslate = async (commentId: string, text: string) => {
    if (translations[commentId]) {
      setTranslations((prev) => {
        const next = { ...prev }
        delete next[commentId]
        return next
      })
      return
    }
    setTranslating((prev) => ({ ...prev, [commentId]: true }))
    setTranslateErrors((prev) => {
      const next = { ...prev }
      delete next[commentId]
      return next
    })
    try {
      const targetLang = language === "zh" ? "English" : "中文"
      const res = await fetch("/api/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a translator. Translate the following text to ${targetLang}. Return ONLY the translation, nothing else.`,
            },
            { role: "user", content: text },
          ],
        }),
      })
      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>
        const choices = data.choices as
          | Array<{ message?: { content?: string } }>
          | undefined
        const translated =
          choices?.[0]?.message?.content ?? (data.reply as string) ?? text
        setTranslations((prev) => ({ ...prev, [commentId]: translated }))
      } else {
        setTranslateErrors((prev) => ({ ...prev, [commentId]: true }))
      }
    } catch {
      setTranslateErrors((prev) => ({ ...prev, [commentId]: true }))
    } finally {
      setTranslating((prev) => ({ ...prev, [commentId]: false }))
    }
  }

  return (
    <motion.section
      id="reviews"
      variants={fadeUp}
      className="space-y-4 border-t border-slate-200/50 pt-6 pb-8"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-slate-900 md:text-[18px]">
          {t.ratingsAndReviews}
        </h3>
        {totalReviews > 0 && (
          <span className="text-[12px] font-medium text-slate-500 md:text-[13px]">
            {totalReviews} {language === "zh" ? "条评价" : "Reviews"}
            {positivePercent !== null &&
              ` · ${positivePercent}${t.positiveRating}`}
          </span>
        )}
      </div>

      {!user ? (
        <motion.div
          whileHover={{ scale: 1.005 }}
          className="border-illini-blue/10 flex flex-col items-center justify-between gap-4 rounded-xl border bg-white/60 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-md sm:flex-row md:rounded-2xl md:p-6"
        >
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <div className="bg-illini-blue/5 flex size-10 shrink-0 items-center justify-center rounded-full md:size-12">
              <MessageSquare className="text-illini-blue size-5 md:size-6" />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-slate-900 md:text-[15px]">
                {t.shareExp}
              </h4>
              <p className="mt-0.5 text-[12px] font-medium text-slate-500 md:text-[13px]">
                {t.loginPrompt}
              </p>
            </div>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRequestLogin}
            className="bg-illini-blue hover:bg-illini-blue/90 w-full rounded-xl px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition-colors sm:w-auto md:text-[14px]"
          >
            {t.loginBtn}
          </motion.button>
        </motion.div>
      ) : (
        <div className="rounded-xl border border-white/60 bg-white/80 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-md md:rounded-2xl md:p-5">
          <h4 className="mb-3 text-[14px] font-bold text-slate-900 md:text-[15px]">
            {t.shareExp}
          </h4>
          <div className="mb-3 flex gap-2">
            {([1, -1] as const).map((vote) => (
              <motion.button
                key={vote}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                onClick={() =>
                  setCommentVote(commentVote === vote ? null : vote)
                }
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  commentVote === vote && vote === 1
                    ? `border-illini-orange/30 bg-illini-orange/10 text-illini-orange`
                    : commentVote === vote && vote === -1
                      ? "border-red-200 bg-red-50 text-red-600"
                      : `border-slate-200 bg-white text-slate-500 hover:border-slate-300`
                } `}
              >
                <ThumbsUp
                  className={`size-3.5 ${vote === -1 ? "rotate-180" : ""} ${commentVote === vote && vote === 1 ? "fill-illini-orange/20" : ""}`}
                />
                {vote === 1 ? t.thumbsUpDorm : t.thumbsDownDorm}
              </motion.button>
            ))}
          </div>
          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder={t.leaveComment}
            rows={3}
            className="focus:border-illini-blue/40 w-full resize-none rounded-xl border border-slate-200 bg-white/50 px-3 py-2.5 text-[13px] font-medium placeholder-slate-400 transition-colors focus:outline-none md:text-[14px]"
          />
          <div className="mt-2.5 flex justify-end">
            <motion.button
              type="button"
              disabled={submitting || !commentContent.trim()}
              onClick={handleSubmit}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-illini-blue hover:bg-illini-blue/90 rounded-xl px-5 py-2 text-[13px] font-bold text-white transition-colors disabled:opacity-40 md:text-[14px]"
            >
              {submitting ? "..." : t.submitComment}
            </motion.button>
          </div>
        </div>
      )}

      {commentsLoading ? (
        <div className="py-6 text-center text-[13px] text-slate-400">
          {language === "zh" ? "加载中..." : "Loading..."}
        </div>
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-slate-400">
          {t.noComments}
        </p>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            <AnimatePresence>
              {displayedComments.map((comment, i) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="rounded-xl border border-white/60 bg-white/80 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-md md:rounded-2xl md:p-5"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
                        <User className="size-4 text-slate-400" />
                      </div>
                      <div>
                        <div className="text-[13px] leading-tight font-bold text-slate-900 md:text-[14px]">
                          {comment.display_name}
                        </div>
                        <div className="mt-0.5 text-[11px] font-medium text-slate-500 md:text-[12px]">
                          {new Date(comment.created_at).toLocaleDateString(
                            language === "zh" ? "zh-CN" : "en-US",
                            {
                              year: "numeric",
                              month: "short",
                            }
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {comment.dorm_vote === 1 && (
                        <div className="bg-illini-orange/10 flex items-center gap-1 rounded-lg px-2 py-1">
                          <ThumbsUp className="fill-illini-orange text-illini-orange size-3" />
                          <span className="text-illini-orange text-[11px] font-bold">
                            {t.recommended}
                          </span>
                        </div>
                      )}
                      {user && comment.user_id === user.id && (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 text-slate-300 transition-colors hover:text-red-400"
                          aria-label={t.deleteComment}
                        >
                          <X className="size-3.5" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                  {translations[comment.id] ? (
                    <>
                      <p className="text-[13px] leading-relaxed font-medium text-slate-600 md:text-[14px]">
                        {translations[comment.id]}
                      </p>
                      <p className="mt-1.5 border-l-2 border-slate-200 pl-3 text-[12px] leading-relaxed text-slate-400">
                        {comment.content}
                      </p>
                    </>
                  ) : (
                    <p className="text-[13px] leading-relaxed font-medium text-slate-600 md:text-[14px]">
                      {comment.content}
                    </p>
                  )}
                  {translateErrors[comment.id] && (
                    <p className="mt-1 text-[12px] text-red-400">
                      {language === "zh"
                        ? "翻译失败，点击重试"
                        : "Translation failed, click to retry"}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-4 border-t border-slate-100/50 pt-3">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.88 }}
                      onClick={() =>
                        onVoteOnComment(
                          comment.id,
                          comment.myVote === 1 ? null : 1
                        )
                      }
                      className={`group flex items-center gap-1.5 transition-colors ${
                        comment.myVote === 1
                          ? "text-illini-orange"
                          : `hover:text-illini-orange text-slate-400`
                      } `}
                    >
                      <ThumbsUp
                        className={`size-3.5 ${
                          comment.myVote === 1
                            ? "fill-illini-orange/20"
                            : "group-hover:fill-illini-orange/20"
                        } `}
                      />
                      <span className="text-[12px] font-semibold">
                        {t.helpful}
                        {comment.upvotes > 0 ? ` (${comment.upvotes})` : ""}
                      </span>
                    </motion.button>
                    {detectLang(comment.content) !== language && (
                      <button
                        type="button"
                        onClick={() =>
                          handleTranslate(comment.id, comment.content)
                        }
                        disabled={translating[comment.id]}
                        className="hover:text-illini-blue flex items-center gap-1 text-[12px] font-semibold text-slate-400 transition-colors disabled:opacity-50"
                      >
                        <Globe className="size-3.5" />
                        {translating[comment.id]
                          ? language === "zh"
                            ? "翻译中..."
                            : "Translating..."
                          : translations[comment.id]
                            ? language === "zh"
                              ? "显示原文"
                              : "Original"
                            : language === "zh"
                              ? "翻译"
                              : "Translate"}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {comments.length > 3 && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="w-full rounded-xl border border-white/50 bg-white/40 py-3 text-[13px] font-semibold text-slate-500 backdrop-blur-md transition-colors hover:bg-white/60 hover:text-slate-800 md:text-[14px]"
            >
              {showAllReviews
                ? language === "zh"
                  ? "收起"
                  : "Show less"
                : `${t.viewAllReviews} (${comments.length})`}
            </motion.button>
          )}
        </>
      )}
    </motion.section>
  )
}
