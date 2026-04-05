/**
 * @file ./src/legacy/components/UserMenu.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [COMPONENT] Dropdown menu for user profile actions.
// [组件] 用户个人资料操作的下拉菜单。
import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          gap-2 px-3 py-2
          hover:bg-slate-100
          flex items-center rounded-full transition-colors
        "
      >
        <div className="
          h-8 w-8 from-illini-blue to-illini-orange text-sm font-semibold
          text-white flex items-center justify-center rounded-full
          bg-linear-to-br
        ">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="
          text-sm font-medium text-slate-700
          sm:block
          hidden
        ">
          {user.name}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="inset-0 fixed z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="
            right-0 mt-2 w-56 rounded-2xl border-slate-100 bg-white shadow-xl
            absolute z-20 overflow-hidden border
          ">
            <div className="border-slate-100 p-4 border-b">
              <p className="font-semibold text-slate-900">{user.name}</p>
              <p className="text-sm text-slate-500 truncate">{user.email}</p>
            </div>

            <div className="p-2">
              <button
                onClick={() => {
                  logout()
                  setIsOpen(false)
                }}
                className="
                  rounded-xl px-4 py-2 text-sm text-red-600
                  hover:bg-red-50
                  w-full text-left transition-colors
                "
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
