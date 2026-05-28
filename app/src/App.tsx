/**
 * @file ./src/App.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { LoginScreen } from "./components/auth/LoginScreen"
import { Layout } from "./components/layout/Layout"
import { AppRoutes } from "./app/routes"
import { useAuth } from "./contexts/AuthContext"
import { HousingProvider } from "./components/housing/store/HousingContext"
import { HousingDataProvider } from "./components/housing/store/HousingDataContext"
import { DormUserInteractionProvider } from "./components/housing/store/DormUserInteractionContext"
import { CompareProvider } from "./components/housing/store/CompareContext"
import { type Language } from "./types"

export default function App() {
  const { user, isLoading, isGuest, setIsGuest } = useAuth()
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language.toLowerCase()
      return browserLang.startsWith("zh") ? "zh" : "en"
    }
    return "zh"
  })

  // Load last conversation from localStorage on mount
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(() => {
    return null
  })

  // Sync to localStorage when conversation changes
  useEffect(() => {
    if (currentConversationId && !isGuest) {
      localStorage.setItem("lastConversationId", currentConversationId)
    }
  }, [currentConversationId, isGuest])

  const clearConversation = useCallback(() => {
    setCurrentConversationId(null)
    localStorage.removeItem("lastConversationId")
  }, [])

  useEffect(() => {
    if (isGuest) {
      queueMicrotask(() => clearConversation())
    }
  }, [isGuest, clearConversation])

  useEffect(() => {
    if (user) {
      setIsGuest(false)
    }
  }, [user, setIsGuest])

  const handleGuestLogin = useCallback(() => setIsGuest(true), [setIsGuest])
  const handleExitGuest = useCallback(() => setIsGuest(false), [setIsGuest])

  const handleSelectConversation = useCallback(
    (conversationId: string | null) => {
      setCurrentConversationId(conversationId)
      if (conversationId) {
        localStorage.setItem("lastConversationId", conversationId)
      } else {
        localStorage.removeItem("lastConversationId")
      }
    },
    []
  )

  const handleNewConversation = useCallback(() => {
    setCurrentConversationId(null)
  }, [])

  const loginInitial = useMemo(() => ({ opacity: 0, y: 20 }), [])
  const loginAnimate = useMemo(() => ({ opacity: 1, y: 0 }), [])
  const loginExit = useMemo(() => ({ opacity: 0, y: -20 }), [])
  const loginTransition = useMemo(() => ({ duration: 0.3 }), [])
  const appInitial = useMemo(() => ({ opacity: 0, scale: 0.98 }), [])
  const appAnimate = useMemo(() => ({ opacity: 1, scale: 1 }), [])
  const appExit = useMemo(() => ({ opacity: 0, scale: 0.95 }), [])
  const appTransition = useMemo(
    () => ({ duration: 0.4, ease: "easeOut" as const }),
    []
  )

  if (isLoading) {
    return (
      <div className="from-illini-blue/10 to-illini-orange/10 flex min-h-screen items-center justify-center bg-linear-to-br via-white">
        <div className="text-center">
          <div className="border-illini-orange mx-auto mb-4 size-16 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-slate-600">
            {language === "zh" ? "加载中..." : "Loading..."}
          </p>
        </div>
      </div>
    )
  }

  const showLogin = !user && !isGuest

  return (
    <AnimatePresence mode="wait">
      {showLogin ? (
        <motion.div
          key="login"
          initial={loginInitial}
          animate={loginAnimate}
          exit={loginExit}
          transition={loginTransition}
          className="size-full"
        >
          <LoginScreen
            onGuestLogin={handleGuestLogin}
            language={language}
            onLanguageChange={setLanguage}
          />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={appInitial}
          animate={appAnimate}
          exit={appExit}
          transition={appTransition}
          className="size-full"
        >
          <HousingDataProvider>
            <CompareProvider>
              <HousingProvider>
                <DormUserInteractionProvider>
                  <Layout
                    language={language}
                    onLanguageChange={setLanguage}
                    isGuest={isGuest}
                    onExitGuest={handleExitGuest}
                    currentConversationId={currentConversationId}
                    onNewConversation={handleNewConversation}
                    onSelectConversation={handleSelectConversation}
                  >
                    <AppRoutes
                      language={language}
                      currentConversationId={currentConversationId}
                      onConversationCreated={setCurrentConversationId}
                    />
                  </Layout>
                </DormUserInteractionProvider>
              </HousingProvider>
            </CompareProvider>
          </HousingDataProvider>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
