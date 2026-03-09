export type Language = 'en' | 'zh';
export type AIProvider = 'cloud' | 'local' | 'coze';

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

export type CategoryId = 'housing' | 'academics' | 'transport' | 'dining' | 'social' | 'safety';

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

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
  followUpQuestions?: string[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  isPinned: boolean;
  messageCount?: number;
}

export type ViewState =
  | { type: 'HOME' }
  | { type: 'CATEGORY'; categoryId: CategoryId }
  | { type: 'ARTICLE'; articleId: string };

export interface InitProgressCallback {
  (progress: { text: string; progress: number }): void;
}

// User authentication types
export interface User {
  id: string;
  name: string;
  email: string;
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

export interface LibraryHistoryItem {
  id: string;
  articleId: string;
  articleTitle: string;
  articleTitleZh?: string;
  isPinned: boolean;
  viewedAt: string;
}