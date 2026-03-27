/**
 * @file ./src/components/housing/edit-panel/DormEditPanelShell.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from 'react';
import { X } from 'lucide-react';
import { ActiveTab } from './useDormEditForm';

interface TabConfig {
  id: ActiveTab;
  icon: React.ReactNode;
  label: string;
}

interface DormEditPanelShellProps {
  title: string;
  activeTab: ActiveTab;
  tabs: TabConfig[];
  saving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  saveLabel: string;
  savingLabel: string;
  savedLabel: string;
  cancelLabel: string;
  onClose: () => void;
  onSave: () => void;
  onTabChange: (tab: ActiveTab) => void;
  children: React.ReactNode;
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
      <div className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-white shadow-2xl flex flex-col border-l border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 bg-illini-blue text-white flex-shrink-0">
          <span className="font-bold text-base truncate">{title}</span>
          <button type="button" onClick={onClose} className="hover:text-gray-300 flex-shrink-0 ml-2">
            <X size={20} />
          </button>
        </div>
        <div className="flex border-b border-gray-200 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-illini-orange text-illini-blue'
                  : 'text-gray-500 hover:text-illini-blue'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm">{children}</div>
        <div className="border-t border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 bg-white">
          {activeTab !== 'history' && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-illini-orange hover:bg-illini-orange-dark text-white font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 text-sm"
            >
              {saving ? savingLabel : saveLabel}
            </button>
          )}
          {saveSuccess && <span className="text-xs text-emerald-600 font-medium">{savedLabel}</span>}
          {saveError && <span className="text-xs text-red-600 font-medium">{saveError}</span>}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-xs text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-300 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </>
  );
};
