/**
 * @file ./src/components/layout/SidebarPanel.tsx
 * @description Layout Component / Module
 * @description_zh 此文件属于 Layout 层，仅负责布局、导航。严禁在此处堆积业务逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from "react"

import { type Language } from "../../types"
import { ConversationSidebar } from "./ConversationSidebar"
import { DormSidebar } from "./DormSidebar"
import { LibrarySidebar } from "./LibrarySidebar"

interface SidebarPanelProps {
  activeTab: string
  language: Language
  currentPath: string
  currentConversationId?: string | null
  onNewConversation?: () => void
  onSelectConversation?: (conversationId: string | null) => void
  favoritesIconRef: React.RefObject<SVGSVGElement | null>
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  activeTab,
  language,
  currentPath,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  favoritesIconRef,
}) => {
  return (
    <div className="mx-3 flex min-h-0 flex-1 flex-col overflow-hidden border-t border-white/10 pt-2">
      {activeTab === "chat" && (
        <ConversationSidebar
          currentConversationId={currentConversationId ?? null}
          onSelectConversation={
            onSelectConversation ??
            ((_id: string) => {
              /* noop */
            })
          }
          onNewConversation={
            onNewConversation ??
            (() => {
              /* noop */
            })
          }
          language={language}
        />
      )}
      {activeTab === "library" && (
        <LibrarySidebar
          language={language}
          currentArticleId={
            currentPath.startsWith("/library/article/")
              ? currentPath.split("/").pop()
              : undefined
          }
        />
      )}
      {activeTab === "dorms" && (
        <DormSidebar
          language={language}
          currentDormId={
            currentPath.startsWith("/dorms/")
              ? currentPath.split("/").pop()
              : undefined
          }
          favoritesIconRef={favoritesIconRef}
        />
      )}
    </div>
  )
}
