/**
 * @file ./src/components/housing/AIChat.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ChatMessage } from './types/index'
import { streamChatResponse } from '../../services/ai'
import { isDormMention, findMentionedDorms } from '../../utils/housingUtils'
import { TypewriterText } from './TypewriterText'
import { Language } from '../../types'
import { aiChatTexts } from './i18n/dormTexts'

interface AIChatProps {
  language: Language
}

const AIChat: React.FC<AIChatProps> = ({ language }) => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const t = aiChatTexts[language]

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: t.initialMessage,
        timestamp: new Date(),
      },
    ])
  }, [t.initialMessage])

  useEffect(() => {
    if (!isOpen) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [isOpen])

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      const botMessageId = (Date.now() + 1).toString()
      const historyForCoze = messages
        .filter((message) => message.id !== 'welcome')
        .map((message) => ({
          role: message.role,
          text: message.text,
        }))

      const stream = streamChatResponse(
        historyForCoze,
        userMessage.text,
        language
      )
      let responseText = ''
      let hasRenderedBotMessage = false

      for await (const chunk of stream) {
        if (!chunk.text) {
          continue
        }

        if (!hasRenderedBotMessage) {
          responseText = chunk.text
          hasRenderedBotMessage = true
          setMessages((prev) => [
            ...prev,
            {
              id: botMessageId,
              role: 'model',
              text: responseText,
              timestamp: new Date(),
            },
          ])
          continue
        }

        responseText += chunk.text
        const currentText = responseText
        setMessages((prev) =>
          prev.map((message) =>
            message.id === botMessageId
              ? { ...message, text: currentText }
              : message
          )
        )
      }

      if (!responseText.trim()) {
        setMessages((prev) => [
          ...prev,
          {
            id: botMessageId,
            role: 'model',
            text: 'No response received. Please try again.',
            timestamp: new Date(),
          },
        ])
      }
    } catch (error) {
      console.error(error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: 'model',
          text: 'Connection failed. Please try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className={`
          bottom-6 right-6 p-4 shadow-2xl fixed z-50 rounded-full transition-all
          duration-300
          ${
          isOpen
            ? 'bg-gray-800 scale-75 rotate-90'
            : `
              bg-illini-orange
              hover:bg-illini-orange-dark hover:scale-110
            `
        }
        `}
      >
        {isOpen ? (
          <X className="text-white" />
        ) : (
          <MessageCircle className="h-8 w-8 text-white" />
        )}
      </button>

      <div
        className={`
          bottom-24 right-6 w-96 rounded-2xl border-gray-100 bg-white shadow-2xl
          fixed z-40 flex max-w-[calc(100vw-3rem)] origin-bottom-right flex-col
          overflow-hidden border transition-all duration-300
          ${
          isOpen
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-10 pointer-events-none scale-95 opacity-0'
        }
        `}
        style={{ height: '70vh', maxHeight: '85vh' }}
      >
        <div className="bg-illini-blue p-4 flex items-center justify-between">
          <div className="gap-3 flex items-center">
            <div className="
              h-10 w-10 bg-white/10 flex items-center justify-center
              rounded-full
            ">
              <Sparkles className="h-5 w-5 text-illini-orange" />
            </div>
            <div>
              <h3 className="font-bold text-white">{t.title}</h3>
              <p className="text-xs text-blue-200">{t.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="
          space-y-4 bg-gray-50/50 p-4 grow overflow-x-hidden overflow-y-auto
        ">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isRecent =
                index === messages.length - 1 && msg.role === 'model'
              const mentionedDorms =
                msg.role === 'model' ? findMentionedDorms(msg.text) : []

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={`
                    flex flex-col
                    ${msg.role === 'user' ? 'items-end' : `items-start`}
                  `}
                >
                  <div
                    className={`
                      rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm
                      overflow-hidden
                      ${
                      msg.role === 'user'
                        ? `
                          bg-illini-blue font-medium text-white max-w-[85%]
                          rounded-br-none
                        `
                        : `
                          border-gray-100 bg-white text-gray-800 max-w-full
                          rounded-bl-none border
                        `
                    }
                    `}
                  >
                    {msg.role === 'model' && isRecent ? (
                      <TypewriterText text={msg.text} />
                    ) : msg.role === 'user' ? (
                      <span className="
                        font-medium text-white whitespace-pre-wrap
                      ">
                        {msg.text}
                      </span>
                    ) : (
                      <div className="
                        prose prose-sm
                        prose-p:leading-relaxed
                        prose-pre:bg-gray-100 prose-pre:overflow-x-auto
                        overflow-wrap-anywhere text-gray-800 max-w-none
                        wrap-break-word
                      ">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            strong: ({ ...props }) => {
                              const content = String(props.children)
                              const isDorm = isDormMention(content)
                              return (
                                <span
                                  className={
                                    isDorm
                                      ? 'font-extrabold text-illini-orange'
                                      : 'font-bold text-gray-900'
                                  }
                                  {...props}
                                />
                              )
                            },
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {msg.role === 'model' && mentionedDorms.length > 0 && (
                    <div className="ml-2 mt-3 gap-3 flex w-full flex-col">
                      {mentionedDorms.map((dorm) =>
                        (() => {
                          const dormName =
                            language === 'zh' && dorm.name_zh
                              ? dorm.name_zh
                              : dorm.name
                          return (
                            <button
                              key={dorm.id}
                              onClick={() => navigate(`/dorms/${dorm.id}`)}
                              type="button"
                              className="
                                group gap-3 rounded-xl border-gray-100/80
                                from-white/95 to-gray-50/95 p-3 shadow-sm
                                backdrop-blur-md
                                hover:border-illini-orange/30 hover:shadow-md
                                flex w-full items-center border bg-linear-to-br
                                text-left transition-all
                              "
                            >
                              <div className="
                                h-16 w-16 rounded-lg bg-gray-100 shrink-0
                                overflow-hidden
                              ">
                                <img
                                  src={dorm.imageUrl}
                                  alt={dormName}
                                  className="
                                    size-full object-cover transition-transform
                                    duration-500
                                    group-hover:scale-105
                                  "
                                />
                              </div>
                              <div className="min-w-0 grow">
                                <div className="
                                  flex items-start justify-between
                                ">
                                  <h4 className="
                                    text-base font-bold text-gray-900
                                    group-hover:text-illini-orange
                                    truncate transition-colors
                                  ">
                                    {dormName}
                                  </h4>
                                </div>
                                <div className="mt-1.5 gap-1 flex flex-wrap">
                                  {dorm.tags.slice(0, 2).map((tag) => (
                                    <span
                                      key={tag}
                                      className="
                                        rounded-md border-gray-100 bg-gray-50
                                        px-1.5 py-0.5 text-gray-500
                                        hover:border-gray-200 hover:bg-gray-100
                                        hover:text-gray-700
                                        border text-[10px] transition-colors
                                        duration-150
                                      "
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </button>
                          )
                        })()
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
          {isLoading && (
            <div className="flex justify-start">
              <div className="
                gap-2 rounded-2xl border-gray-100 bg-white px-4 py-3 shadow-sm
                flex items-center rounded-bl-none border
              ">
                <Loader2 className="h-4 w-4 animate-spin text-illini-orange" />
                <span className="text-xs text-gray-500">{t.thinking}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-gray-100 bg-white p-4 border-t">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              className="
                rounded-xl border-gray-200 bg-gray-50 py-3 pl-4 pr-12 text-sm
                focus:border-illini-blue focus:ring-illini-blue/20
                w-full resize-none border
                focus:ring-2 focus:outline-none
              "
              rows={2}
            />
            <button
              onClick={handleSend}
              type="button"
              disabled={isLoading || !inputText.trim()}
              className="
                bottom-2 right-2 rounded-lg bg-illini-orange p-2 text-white
                hover:bg-illini-orange-dark
                absolute transition-colors
                disabled:cursor-not-allowed disabled:opacity-50
              "
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
