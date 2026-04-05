/**
 * @file ./src/components/housing/edit-panel/EditPanelFields.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from 'react'
import { Plus, Trash2 } from 'lucide-react'

export const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-illini-blue'

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="font-medium text-gray-700 block">{label}</label>
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
        <div key={index} className="gap-2 flex items-center">
          <input
            className="
              rounded-lg border-gray-300 px-3 py-1.5 text-sm
              focus:ring-illini-blue
              flex-1 border
              focus:ring-2 focus:outline-none
            "
            value={item}
            onChange={(event) => {
              const next = [...items]
              next[index] = event.target.value
              onChange(next)
            }}
          />
          <button
            type="button"
            onClick={() =>
              onChange(
                items.filter((_, currentIndex) => currentIndex !== index)
              )
            }
            className="
              text-red-400
              hover:text-red-600
            "
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="
          gap-1 text-xs text-illini-blue flex items-center
          hover:underline
        "
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
    <label className="gap-2 flex cursor-pointer items-center select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`
          h-5 w-9 px-0.5 flex items-center rounded-full transition-colors
          ${checked ? 'bg-illini-orange' : 'bg-gray-300'}
        `}
      >
        <div
          className={`
            h-4 w-4 bg-white shadow-sm rounded-full transition-transform
            ${checked ? 'translate-x-4' : 'translate-x-0'}
          `}
        />
      </div>
      <span className="text-gray-700">{label}</span>
    </label>
  )
}
