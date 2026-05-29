/**
 * @file ./src/components/auth/LoginScreen.tsx
 * @description Auth feature UI
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { motion } from "framer-motion"
// [PAGE] Combined login/registration screen with guest mode support.
// [页面] 集成了访客模式支持的登录/注册页面。
import * as React from "react"
import { useState } from "react"

import { useAuth } from "../../contexts/AuthContext"
import { UI_TEXT } from "../../i18n/uiText"
import { type Language } from "../../types"

interface LoginScreenProps {
  onGuestLogin?: () => void
  language: Language
  onLanguageChange: (lang: Language) => void
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onGuestLogin,
  language,
  onLanguageChange,
}) => {
  const { login, register, loginWithGoogle, loginWithMicrosoft } = useAuth()
  const t = UI_TEXT[language]

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let success = false
      if (isLogin) {
        success = await login(email, password)
      } else {
        // Use email prefix as default name
        const defaultName = email.split("@")[0]
        success = await register(defaultName, email, password)
      }

      if (!success) {
        setError(isLogin ? t.loginError : t.registerError)
      }
    } catch {
      setError(t.genericError)
    } finally {
      setLoading(false)
    }
  }

  let submitLabel: string
  if (loading) {
    submitLabel = t.processing
  } else if (isLogin) {
    submitLabel = t.loginAction
  } else {
    submitLabel = t.registerAction
  }

  return (
    <button
      type="button"
      tabIndex={0}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onGuestLogin?.()
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).click()
        }
      }}
      className="from-illini-blue/10 to-illini-orange/10 relative flex min-h-screen cursor-default items-start justify-center overflow-y-auto bg-linear-to-br via-white px-4 pt-16 md:pt-32"
    >
      {/* Language Switcher - Responsive Position */}
      <div className="absolute top-4 right-4 z-50 md:top-8 md:right-8">
        <button
          type="button"
          onClick={() => {
            onLanguageChange(language === "en" ? "zh" : "en")
          }}
          className="hover:border-illini-blue/30 hover:text-illini-blue flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur-md transition-all md:px-4 md:py-2.5"
        >
          <span>{language === "en" ? "🌏 中文" : "🌏 English"}</span>
        </button>
      </div>

      <motion.div
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl md:p-8"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-slate-900">
            {t.loginTitle}
          </h1>
          <p className="text-slate-500">{t.loginSubtitle}</p>
        </div>

        {/* Toggle */}
        <div className="relative isolate mb-6 flex gap-2 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true)
            }}
            className={`relative z-10 flex-1 rounded-full px-4 py-2 font-medium transition-colors ${
              isLogin
                ? "text-illini-blue"
                : `text-slate-500 hover:text-slate-900`
            } `}
          >
            {isLogin && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 -z-10 rounded-full bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            {t.loginSwitch}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false)
            }}
            className={`relative z-10 flex-1 rounded-full px-4 py-2 font-medium transition-colors ${
              isLogin
                ? `text-slate-500 hover:text-slate-900`
                : "text-illini-blue"
            } `}
          >
            {!isLogin && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 -z-10 rounded-full bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            {t.registerSwitch}
          </button>
        </div>

        {/* Google Login */}
        <button
          type="button"
          onClick={() => loginWithGoogle()}
          className="group mb-3 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="size-5 opacity-70 transition-opacity group-hover:opacity-100"
          />
          {t.googleLogin}
        </button>

        {/* Microsoft Login */}
        <button
          type="button"
          onClick={() => loginWithMicrosoft()}
          className="group mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
        >
          <svg
            className="size-5 opacity-70 transition-opacity group-hover:opacity-100"
            viewBox="0 0 21 21"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          {t.microsoftLogin}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-slate-400">{t.orEmail}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="mb-2 ml-1 block text-sm font-bold text-slate-700"
            >
              {t.emailLabel}
            </label>
            <input
              id="login-email"
              aria-label={t.emailLabel}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
              }}
              className="focus:border-illini-blue focus:ring-illini-blue/10 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 transition-all focus:bg-white focus:ring-4 focus:outline-none"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-2 ml-1 block text-sm font-bold text-slate-700"
            >
              {t.passwordLabel}
            </label>
            <input
              id="login-password"
              aria-label={t.passwordLabel}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
              }}
              className="focus:border-illini-blue focus:ring-illini-blue/10 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 transition-all focus:bg-white focus:ring-4 focus:outline-none"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-illini-blue shadow-illini-blue/20 hover:bg-illini-blue/90 hover:shadow-illini-blue/30 w-full rounded-xl py-3.5 text-lg font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitLabel}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? t.noAccount : t.hasAccount}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError("")
            }}
            className="text-illini-blue ml-1 font-medium hover:underline"
          >
            {isLogin ? t.registerNow : t.loginNow}
          </button>
        </div>

        {/* Guest Mode Link */}
        <div className="mt-4 border-t border-slate-100/80 pt-4 text-center">
          <button
            type="button"
            onClick={onGuestLogin}
            className="text-xs text-slate-400 transition-colors hover:text-slate-600 hover:underline"
          >
            {t.guestMode}
          </button>
        </div>
      </motion.div>
    </button>
  )
}
