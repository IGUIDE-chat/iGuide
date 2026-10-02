import React from "react"

import { useLayout } from "../../contexts/LayoutContext"
import { Language } from "../../types"
import { ConversationSidebar } from "./ConversationSidebar"
import { LibrarySidebar } from "./LibrarySidebar"

interface SidebarPanelProps {
  activeTab: string
  language: Language
  currentPath: string
  currentConversationId?: string | null
  onNewConversation?: () => void
  onSelectConversation?: (conversationId: string | null) => void
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  activeTab,
  language,
  currentPath,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
}) => {
  // Feature packages (e.g. @iguide/dorm) fill this from inside their own route tree.
  const { sidebarSlot } = useLayout()

  return (
    <div className="mx-3 flex min-h-0 flex-1 flex-col overflow-hidden border-t border-white/10 pt-2">
      {activeTab === "chat" && (
        <ConversationSidebar
          currentConversationId={currentConversationId ?? null}
          onSelectConversation={onSelectConversation ?? (() => {})}
          onNewConversation={onNewConversation ?? (() => {})}
          language={language}
        />
      )}
      {activeTab === "library" && (
        <LibrarySidebar
          language={language}
          currentArticleId={
            currentPath.startsWith("/library/article/") ? currentPath.split("/").pop() : undefined
          }
        />
      )}
      {sidebarSlot}
    </div>
  )
}
