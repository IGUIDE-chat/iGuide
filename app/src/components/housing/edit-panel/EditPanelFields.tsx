/**
 * @file ./src/components/housing/edit-panel/EditPanelFields.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { Plus, Trash2 } from "lucide-react"
import React from "react"

export const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-illini-blue"

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}

export function EditableList({
  items,
  onChange,
  placeholder,
}: {
  items: string[]
  onChange: (next: string[]) => void
  placeholder: string
}) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={item || `empty-${String(index)}`}
          className="flex items-center gap-2"
        >
          <input
            aria-label="Input field"
            className="focus:ring-illini-blue flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
            value={item}
            onChange={(event) => {
              const next = [...items]
              next[index] = event.target.value
              onChange(next)
            }}
          />
          <button
            type="button"
            onClick={() => {
              onChange(
                items.filter((_, currentIndex) => currentIndex !== index)
              )
            }}
            className="text-red-400 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          onChange([...items, ""])
        }}
        className="text-illini-blue flex items-center gap-1 text-xs hover:underline"
      >
        <Plus size={12} /> {placeholder}
      </button>
    </div>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 select-none">
      <button
        type="button"
        aria-label={label}
        tabIndex={0}
        onClick={() => {
          onChange(!checked)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement).click()
          }
        }}
        className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${checked ? "bg-illini-orange" : "bg-gray-300"} `}
      >
        <div
          className={`size-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0"} `}
        />
      </button>
      <span className="text-gray-700">{label}</span>
    </label>
  )
}
