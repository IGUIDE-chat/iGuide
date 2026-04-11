/**
 * @file ./src/types.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

export type Language = "en" | "zh";
export type AIProvider = "cloud" | "local" | "coze";

// [ROOT] Global TypeScript interfaces and type definitions.
// [根组件] 全局 TypeScript 接口和类型定义。
export interface Article {
  id: string;
  category: CategoryId;
  // English Content
  title: string;
  summary: string;
  content: string;
  tags: string[];
  // Chinese Content (Optional but recommended)
  title_zh?: string;
  summary_zh?: string;
  content_zh?: string;
  tags_zh?: string[];

  lastUpdated: string;
}

export type CategoryId =
  | "housing"
  | "academics"
  | "transport"
  | "dining"
  | "social"
  | "safety";

export interface Category {
  id: CategoryId;
  icon: string;
  // English
  label: string;
  description: string;
  // Chinese
  label_zh?: string;
  description_zh?: string;
}

export interface ThinkingStep {
  id: string;
  type: "reasoning" | "searching" | "tool_call" | "processing";
  label: string;
  detail?: string;
  timestamp: number;
  done: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  isStreaming?: boolean;
  followUpQuestions?: string[];
  thinkingSteps?: ThinkingStep[];
  isThinking?: boolean;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  isPinned: boolean;
  messageCount?: number;
}

export type ViewState =
  | { type: "HOME" }
  | { type: "CATEGORY"; categoryId: CategoryId }
  | { type: "ARTICLE"; articleId: string };

export interface InitProgressCallback {
  (progress: { text: string; progress: number }): void;
}

// User authentication types
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isAdmin: boolean;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithMicrosoft: () => Promise<boolean>;
  logout: () => void;
  updateName: (name: string) => Promise<boolean>;
  isLoading: boolean;
  isGuest: boolean;
  setIsGuest: (value: boolean) => void;
  /** Trigger the app-level login screen. */
  requestLogin: () => void;
}

// QMD Knowledge Base Search types
export type SearchMode = "bm25" | "vector" | "hybrid" | "fusion";
export type SearchResultType = "dorm" | "article" | "crawled";

export interface SearchResult {
  docid: string;
  score: number;
  file: string;
  title: string;
  snippet: string;
  /** Parsed from frontmatter */
  type?: SearchResultType;
  id?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  region?: "cn" | "global";
}

export interface LibraryHistoryItem {
  id: string;
  articleId: string;
  articleTitle: string;
  articleTitleZh?: string;
  isPinned: boolean;
  viewedAt: string;
}
