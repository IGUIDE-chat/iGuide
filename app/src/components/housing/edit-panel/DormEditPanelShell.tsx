/**
 * @file ./src/components/housing/edit-panel/DormEditPanelShell.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from "react"
import { X } from "lucide-react"
import { type ActiveTab } from "./useDormEditForm"

interface TabConfig {
  id: ActiveTab
  icon: React.ReactNode
  label: string
}

interface DormEditPanelShellProps {
  title: string
  activeTab: ActiveTab
  tabs: TabConfig[]
  saving: boolean
  saveSuccess: boolean
  saveError: string | null
  saveLabel: string
  savingLabel: string
  savedLabel: string
  cancelLabel: string
  onClose: () => void
  onSave: () => void
  onTabChange: (tab: ActiveTab) => void
  children: React.ReactNode
}

export const DormEditPanelShell: React.FC<DormEditPanelShellProps> = ({
  title,
  activeTab,
  tabs,
  saving,
  saveSuccess,
  saveError,
  saveLabel,
  savingLabel,
  savedLabel,
  cancelLabel,
  onClose,
  onSave,
  onTabChange,
  children,
}) => {
  return (
    <>
      {/* No full-page backdrop — left side stays fully interactive and scrollable */}
      <div className="fixed top-0 right-0 z-50 flex size-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-2xl">
        <div className="bg-illini-blue flex shrink-0 items-center justify-between px-4 py-3 text-white">
          <span className="truncate text-base font-bold">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 shrink-0 hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex shrink-0 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onTabChange(tab.id)
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-illini-orange text-illini-blue border-b-2"
                  : `hover:text-illini-blue text-gray-500`
              } `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
          {children}
        </div>
        <div className="flex shrink-0 items-center gap-3 border-t border-gray-200 bg-white px-4 py-3">
          {activeTab !== "history" && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="bg-illini-orange hover:bg-illini-orange-dark flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors disabled:opacity-60"
            >
              {saving ? savingLabel : saveLabel}
            </button>
          )}
          {saveSuccess && (
            <span className="text-xs font-medium text-emerald-600">
              {savedLabel}
            </span>
          )}
          {saveError && (
            <span className="text-xs font-medium text-red-600">
              {saveError}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-500 transition-colors hover:text-gray-700"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </>
  )
}
