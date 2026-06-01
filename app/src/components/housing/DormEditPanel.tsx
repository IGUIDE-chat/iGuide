/**
 * @file ./src/components/housing/DormEditPanel.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { FileText, History, Image, Info, Tag } from "lucide-react"
// [COMPONENT] Entry point for the admin edit panel — wires form hook + shell + tab components.
// [组件] 管理员编辑面板入口，将表单 hook、外壳和各 Tab 组件组合在一起。
import React from "react"

import type { Language } from '../../types';
import { ContentTab } from "./edit-panel/ContentTab"
import { DetailsTab } from "./edit-panel/DetailsTab"
import { DormEditPanelShell } from "./edit-panel/DormEditPanelShell"
import { HistoryTab } from "./edit-panel/HistoryTab"
import { MediaTab } from "./edit-panel/MediaTab"
import { TagsTab } from "./edit-panel/TagsTab"
import { useDormEditForm } from "./edit-panel/useDormEditForm"
import type { Dorm } from './types/index';

interface DormEditPanelProps {
  dorm: Dorm
  language: Language
  onClose: () => void
  onSaved: (updated: Dorm) => void
}

const DormEditPanel: React.FC<DormEditPanelProps> = ({
  dorm,
  language,
  onClose,
  onSaved,
}) => {
  const form = useDormEditForm({ dorm, language, onClose, onSaved })
  const { t } = form

  const tabs = [
    {
      id: "content" as const,
      icon: <FileText size={14} />,
      label: t.tabs.content,
    },
    { id: "details" as const, icon: <Info size={14} />, label: t.tabs.details },
    { id: "tags" as const, icon: <Tag size={14} />, label: t.tabs.tags },
    {
      id: "media" as const,
      // eslint-disable-next-line jsx-a11y/alt-text -- Lucide icon, not an image
      icon: <Image size={14} alt="" aria-hidden="true" />,
      label: t.tabs.media,
    },
    {
      id: "history" as const,
      icon: <History size={14} />,
      label: t.tabs.history,
    },
  ]

  return (
    <DormEditPanelShell
      title={dorm.name}
      activeTab={form.activeTab}
      tabs={tabs}
      saving={form.saving}
      saveSuccess={form.saveSuccess}
      saveError={form.saveError}
      saveLabel={t.actions.save}
      savingLabel={t.actions.saving}
      savedLabel={t.actions.saved}
      cancelLabel={t.actions.cancel}
      onClose={onClose}
      onSave={form.save}
      onTabChange={form.setActiveTab}
    >
      {form.activeTab === "content" && <ContentTab form={form} />}
      {form.activeTab === "details" && <DetailsTab form={form} />}
      {form.activeTab === "tags" && <TagsTab form={form} />}
      {form.activeTab === "media" && <MediaTab form={form} />}
      {form.activeTab === "history" && <HistoryTab form={form} />}
    </DormEditPanelShell>
  )
}

export default DormEditPanel
