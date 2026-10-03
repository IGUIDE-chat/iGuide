import { AnimatePresence, motion } from "framer-motion"
import * as React from "react"
import { useCallback, useEffect, useState } from "react"

import { AppRoutes } from "./app/routes"
import { LoginScreen } from "./components/auth/LoginScreen"
import { Layout } from "./components/layout/Layout"
import { useAuth } from "./contexts/AuthContext"
import { Language } from "./types"

export default function App() {
  const { user, isLoading, isGuest, setIsGuest } = useAuth()
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language.toLowerCase()
      return browserLang.startsWith("zh") ? "zh" : "en"
    }
    return "zh"
  })

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    return null
  })

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

  const handleSelectConversation = (conversationId: string | null) => {
    setCurrentConversationId(conversationId)
    if (conversationId) {
      localStorage.setItem("lastConversationId", conversationId)
    } else {
      localStorage.removeItem("lastConversationId")
    }
  }

  const handleNewConversation = () => {
    setCurrentConversationId(null)
  }

  if (isLoading) {
    return (
      <div className="from-illini-blue/10 to-illini-orange/10 flex min-h-screen items-center justify-center bg-linear-to-br via-white">
        <div className="text-center">
          <div className="border-illini-orange mx-auto mb-4 size-16 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-slate-600">{language === "zh" ? "加载中..." : "Loading..."}</p>
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="size-full"
        >
          <LoginScreen
            onGuestLogin={() => setIsGuest(true)}
            language={language}
            onLanguageChange={setLanguage}
          />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="size-full"
        >
          <Layout
            language={language}
            onLanguageChange={setLanguage}
            isGuest={isGuest}
            onExitGuest={() => setIsGuest(false)}
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}
