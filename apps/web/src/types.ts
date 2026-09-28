export type Language = "en" | "zh"
export type AIProvider = "cloud" | "local" | "coze"

export interface Article {
  id: string
  category: CategoryId
  title: string
  summary: string
  content: string
  tags: string[]
  title_zh?: string
  summary_zh?: string
  content_zh?: string
  tags_zh?: string[]

  lastUpdated: string
}

export type CategoryId = "housing" | "academics" | "transport" | "dining" | "social" | "safety"

export interface Category {
  id: CategoryId
  icon: string
  label: string
  description: string
  label_zh?: string
  description_zh?: string
}

export interface ThinkingStep {
  id: string
  type: "reasoning" | "searching" | "tool_call" | "processing"
  label: string
  detail?: string
  timestamp: number
  done: boolean
}

export interface ChatMessage {
  id: string
  role: "user" | "model"
  text: string
  isStreaming?: boolean
  followUpQuestions?: string[]
  thinkingSteps?: ThinkingStep[]
  isThinking?: boolean
}

export interface ConversationSummary {
  id: string
  title: string
  updatedAt: string
  isPinned: boolean
  messageCount?: number
}

export type ViewState =
  | { type: "HOME" }
  | { type: "CATEGORY"; categoryId: CategoryId }
  | { type: "ARTICLE"; articleId: string }

export interface InitProgressCallback {
  (progress: { text: string; progress: number }): void
}

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  isAdmin: boolean
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  loginWithGoogle: () => Promise<boolean>
  loginWithMicrosoft: () => Promise<boolean>
  logout: () => void
  updateName: (name: string) => Promise<boolean>
  isLoading: boolean
  isGuest: boolean
  setIsGuest: (value: boolean) => void
  /** Trigger the app-level login screen. */
  requestLogin: () => void
}

export type SearchMode = "bm25" | "vector" | "hybrid" | "fusion"
export type SearchResultType = "dorm" | "article" | "crawled"

export interface SearchResult {
  docid: string
  score: number
  file: string
  title: string
  snippet: string
  /** Parsed from frontmatter */
  type?: SearchResultType
  id?: string
  metadata?: Record<string, unknown>
}

export interface SearchResponse {
  results: SearchResult[]
  query: string
  region?: "cn" | "global"
}

export interface LibraryHistoryItem {
  id: string
  articleId: string
  articleTitle: string
  articleTitleZh?: string
  isPinned: boolean
  viewedAt: string
}
