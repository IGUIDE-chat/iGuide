/**
 * @file ./src/legacy/auth/Register.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [LEGACY/UNUSED] Old register component. Replaced by LoginScreen.tsx.
// [遗留/未使用] 旧的注册组件。已被 LoginScreen.tsx 取代。
import React, { useState } from 'react'
import { useAuth } from './AuthContext'

interface RegisterProps {
  onSwitchToLogin: () => void
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { register, isLoading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!acceptTerms) {
      setError('Please accept the terms of service')
      return
    }

    const success = await register(name, email, password)
    if (!success) {
      setError('Email already registered')
    }
  }

  return (
    <div
      className="
        from-illini-blue via-slate-800 to-illini-orange/20 p-4 flex min-h-screen
        items-center justify-center bg-linear-to-br
      "
    >
      {/* Background decoration */}
      <div className="inset-0 pointer-events-none absolute overflow-hidden">
        <div
          className="
            -left-20 h-96 w-96 bg-illini-orange/10 blur-3xl absolute top-1/4
            rounded-full
          "
        ></div>
        <div
          className="
            -right-20 h-96 w-96 bg-illini-blue/10 blur-3xl absolute bottom-1/4
            rounded-full
          "
        ></div>
      </div>

      <div className="max-w-md relative w-full">
        {/* Logo/Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">IlliniGuide</h1>
          <p className="text-sm text-slate-300">UIUC Knowledge Base</p>
        </div>

        {/* Register Card */}
        <div
          className="
            rounded-2xl border-white/20 bg-white/95 p-8 shadow-2xl
            backdrop-blur-sm border
          "
        >
          <h2 className="mb-6 text-2xl font-bold text-slate-900">
            Create Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 text-sm font-medium text-slate-700 block"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="
                  rounded-lg border-slate-200 bg-slate-50 px-4 py-3
                  text-slate-900 placeholder-slate-400
                  focus:border-illini-blue focus:ring-illini-blue/50
                  w-full border transition-all
                  focus:ring-2 focus:outline-none
                "
                placeholder="John Doe"
                autoFocus
              />
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 text-sm font-medium text-slate-700 block"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  rounded-lg border-slate-200 bg-slate-50 px-4 py-3
                  text-slate-900 placeholder-slate-400
                  focus:border-illini-blue focus:ring-illini-blue/50
                  w-full border transition-all
                  focus:ring-2 focus:outline-none
                "
                placeholder="your.email@illinois.edu"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 text-sm font-medium text-slate-700 block"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  rounded-lg border-slate-200 bg-slate-50 px-4 py-3
                  text-slate-900 placeholder-slate-400
                  focus:border-illini-blue focus:ring-illini-blue/50
                  w-full border transition-all
                  focus:ring-2 focus:outline-none
                "
                placeholder="••••••••"
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 text-sm font-medium text-slate-700 block"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="
                  rounded-lg border-slate-200 bg-slate-50 px-4 py-3
                  text-slate-900 placeholder-slate-400
                  focus:border-illini-blue focus:ring-illini-blue/50
                  w-full border transition-all
                  focus:ring-2 focus:outline-none
                "
                placeholder="••••••••"
              />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="
                  mt-1 h-4 w-4 rounded-sm border-slate-300 bg-slate-50
                  text-illini-blue
                  focus:ring-illini-blue/50
                "
              />
              <label htmlFor="terms" className="ml-2 text-sm text-slate-600">
                I agree to the{' '}
                <span
                  className="
                    text-illini-blue cursor-pointer
                    hover:underline
                  "
                >
                  Terms of Service
                </span>{' '}
                and{' '}
                <span
                  className="
                    text-illini-blue cursor-pointer
                    hover:underline
                  "
                >
                  Privacy Policy
                </span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="
                  rounded-lg border-red-200 bg-red-50 px-4 py-3 text-sm
                  text-red-700 border
                "
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                rounded-lg bg-illini-orange px-4 py-3 font-semibold text-white
                shadow-lg
                hover:bg-illini-orange/90 hover:shadow-xl
                w-full transition-all duration-200
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              {isLoading ? (
                <span className="gap-2 flex items-center justify-center">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="
                  font-semibold text-illini-blue
                  hover:text-illini-blue/80
                  transition-colors
                "
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            © 2026 IlliniGuide. For UIUC students, by UIUC students.
          </p>
        </div>
      </div>
    </div>
  )
}
