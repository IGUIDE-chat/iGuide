/**
 * @file ./src/components/housing/AIChat.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { useChat } from "@ai-sdk/react"
import {
  DefaultChatTransport,
  type UIDataTypes,
  type UIMessage,
  type UIMessagePart,
  type UITools,
} from "ai"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react"
import React, { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { useNavigate } from "react-router-dom"
import remarkGfm from "remark-gfm"

import { supabase } from "../../services/supabase"
import { type Language } from "../../types"
import { findMentionedDorms, isDormMention } from "../../utils/housingUtils"
import { ImeSafeTextarea } from "../chat/ImeSafeTextarea"
import { Typewriter } from "../ui/Typewriter"
import { aiChatTexts } from "./i18n/dormTexts"

const DormMentionStrong = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  const content = String(children)
  const isDorm = isDormMention(content)
  return (
    <span
      className={
        isDorm ? "text-illini-orange font-extrabold" : "font-bold text-gray-900"
      }
      {...props}
    >
      {children}
    </span>
  )
}

const dormMarkdownComponents = {
  strong: DormMentionStrong,
} as const

interface AIChatProps {
  language: Language
}

const extractText = (
  parts: Array<UIMessagePart<UIDataTypes, UITools>>
): string =>
  parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")

function DormCardButton({
  dorm,
  dormName,
  onNavigate,
}: {
  dorm: { id: string; imageUrl: string; tags: string[] }
  dormName: string
  onNavigate: () => void
}) {
  return (
    <button
      onClick={onNavigate}
      type="button"
      className="group hover:border-illini-orange/30 flex w-full items-center gap-3 rounded-xl border border-gray-100/80 bg-linear-to-br from-white/95 to-gray-50/95 p-3 text-left shadow-sm backdrop-blur-md transition-all hover:shadow-md"
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <img
          src={dorm.imageUrl}
          alt={dormName}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 grow">
        <div className="flex items-start justify-between">
          <h4 className="group-hover:text-illini-orange truncate text-base font-bold text-gray-900 transition-colors">
            {dormName}
          </h4>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {dorm.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-gray-100 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500 transition-colors duration-150 hover:border-gray-200 hover:bg-gray-100 hover:text-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}

const AIChat: React.FC<AIChatProps> = ({ language }) => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const t = aiChatTexts[language]

  const languageRef = useRef(language)
  languageRef.current = language

  const apiUrl = import.meta.env.VITE_API_GATEWAY_URL
    ? `${import.meta.env.VITE_API_GATEWAY_URL}/chat`
    : "/chat"

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiUrl,
        body: () => ({
          lang: languageRef.current,
        }),
        headers: async (): Promise<Record<string, string>> => {
          const {
            data: { session },
          } = await supabase.auth.getSession()
          return session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}
        },
      }),
    [apiUrl]
  )

  const initialMessages = useMemo<UIMessage[]>(
    () => [
      {
        id: "welcome",
        role: "assistant",
        parts: [{ type: "text", text: t.initialMessage }],
      } as UIMessage,
    ],
    [t.initialMessage]
  )

  const chat = useChat({
    transport,
    messages: initialMessages,
    onError: (err) => {
      console.error("[housing AIChat]", err)
    },
  })

  const isLoading = chat.status === "submitted" || chat.status === "streaming"

  useEffect(() => {
    if (!isOpen) {
      return
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
  }, [isOpen])

  const handleSend = () => {
    const trimmed = inputText.trim()
    if (!trimmed || isLoading) {
      return
    }
    void chat.sendMessage({ text: trimmed })
    setInputText("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(!isOpen)
        }}
        type="button"
        className={`fixed right-6 bottom-6 z-50 rounded-full p-4 shadow-2xl transition-all duration-300 ${
          isOpen
            ? "scale-75 rotate-90 bg-gray-800"
            : `bg-illini-orange hover:bg-illini-orange-dark hover:scale-110`
        } `}
      >
        {isOpen ? (
          <X className="text-white" />
        ) : (
          <MessageCircle className="size-8 text-white" />
        )}
      </button>

      <div
        className={`fixed right-6 bottom-24 z-40 flex w-96 max-w-[calc(100vw-3rem)] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl transition-all duration-300 ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-10 scale-95 opacity-0"
        } `}
        style={{ height: "70vh", maxHeight: "85vh" }}
      >
        <div className="bg-illini-blue flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-white/10">
              <Sparkles className="text-illini-orange size-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">{t.title}</h3>
              <p className="text-xs text-blue-200">{t.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="grow space-y-4 overflow-x-hidden overflow-y-auto bg-gray-50/50 p-4">
          <AnimatePresence initial={false}>
            {chat.messages.map((msg, index) => {
              const isAssistant = msg.role === "assistant"
              const isUser = msg.role === "user"
              const text = extractText(msg.parts)
              const isRecent = index === chat.messages.length - 1 && isAssistant
              const mentionedDorms = isAssistant ? findMentionedDorms(text) : []

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex flex-col ${isUser ? "items-end" : `items-start`} `}
                >
                  <div
                    className={`overflow-hidden rounded-2xl px-5 py-4 text-sm/relaxed shadow-sm ${
                      isUser
                        ? `bg-illini-blue max-w-[85%] rounded-br-none font-medium text-white`
                        : `max-w-full rounded-bl-none border border-gray-100 bg-white text-gray-800`
                    } `}
                  >
                    {(() => {
                      if (isAssistant && isRecent) {
                        return (
                          <Typewriter
                            text={text}
                            mode="stream"
                            markdown
                            markdownComponents={dormMarkdownComponents}
                          />
                        )
                      }
                      if (isUser) {
                        return (
                          <span className="font-medium whitespace-pre-wrap text-white">
                            {text}
                          </span>
                        )
                      }
                      return (
                        <div className="prose prose-sm prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:overflow-x-auto overflow-wrap-anywhere max-w-none wrap-break-word text-gray-800">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={dormMarkdownComponents}
                          >
                            {text}
                          </ReactMarkdown>
                        </div>
                      )
                    })()}
                  </div>

                  {isAssistant && mentionedDorms.length > 0 && (
                    <div className="mt-3 ml-2 flex w-full flex-col gap-3">
                      {mentionedDorms.map((dorm) => {
                        const dormName =
                          language === "zh" && dorm.name_zh
                            ? dorm.name_zh
                            : dorm.name
                        return (
                          <DormCardButton
                            key={dorm.id}
                            dorm={dorm}
                            dormName={dormName}
                            onNavigate={() => navigate(`/dorms/${dorm.id}`)}
                          />
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-none border border-gray-100 bg-white px-4 py-3 shadow-sm">
                <Loader2 className="text-illini-orange size-4 animate-spin" />
                <span className="text-xs text-gray-500">{t.thinking}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-100 bg-white p-4">
          <div className="relative">
            <ImeSafeTextarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              className="focus:border-illini-blue focus:ring-illini-blue/20 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 py-3 pr-12 pl-4 text-sm focus:ring-2 focus:outline-none"
              rows={2}
            />
            <button
              onClick={handleSend}
              type="button"
              disabled={isLoading || !inputText.trim()}
              className="bg-illini-orange hover:bg-illini-orange-dark absolute right-2 bottom-2 rounded-lg p-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default AIChat
