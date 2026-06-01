/**
 * @file ./src/legacy/components/UserMenu.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [COMPONENT] Dropdown menu for user profile actions.
// [组件] 用户个人资料操作的下拉菜单。
import React, { useState } from "react"

import { useAuth } from "../../contexts/AuthContext"

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-slate-100"
      >
        <div className="from-illini-blue to-illini-orange flex size-8 items-center justify-center rounded-full bg-linear-to-br text-sm font-semibold text-white">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden text-sm font-medium text-slate-700 sm:block">
          {user.name}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
            <div className="border-b border-slate-100 p-4">
              <p className="font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
            </div>

            <div className="p-2">
              <button
                onClick={() => {
                  logout()
                  setIsOpen(false)
                }}
                className="w-full rounded-xl px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                登出
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
