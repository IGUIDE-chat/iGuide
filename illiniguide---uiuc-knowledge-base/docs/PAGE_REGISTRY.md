# Page Registry

`src/app/pageRegistry.ts` is the source of truth for page ownership and route mapping.

Rules:
- Every route in `src/app/routes.tsx` must exist in `pageRegistry`.
- Every `pageRegistry` entry must map to an actual route.
- New pages must be added to `pageRegistry` before merge.

Current routes:
- `/` -> redirect to `/chat`
- `/chat` -> `src/pages/chat/ChatPage.tsx`
- `/library` -> `src/pages/library/LibraryHomePage.tsx`
- `/library/category/:categoryId` -> `src/pages/library/LibraryCategoryPage.tsx`
- `/library/article/:articleId` -> `src/pages/library/LibraryArticlePage.tsx`
- `/profile` -> `src/pages/profile/ProfilePage.tsx`
- `/courses` -> `src/pages/courses/CoursesLandingPage.tsx`
- `/resume` -> `src/pages/resume/ResumeLandingPage.tsx`
- `/dorms` -> `src/pages/dorms/DormListPage.tsx`
- `/dorms/:id` -> `src/pages/dorms/DormDetailPage.tsx`
- `/dorm/:id` -> redirect to `/dorms/:id`

Validation command:
- `npm run verify:architecture`

---

## 中文版本 (Chinese Version)

# 页面注册表 (Page Registry)

`src/app/pageRegistry.ts` 是页面所有权和路由映射的单一事实来源。

规则：
- `src/app/routes.tsx` 中的每条路由必须存在于 `pageRegistry` 中。
- `pageRegistry` 中的每个条目必须映射到实际的路由。
- 新页面必须在合并之前添加到 `pageRegistry` 中。

当前路由：
- `/` -> 重定向至 `/chat`
- `/chat` -> `src/pages/chat/ChatPage.tsx`
- `/library` -> `src/pages/library/LibraryHomePage.tsx`
- `/library/category/:categoryId` -> `src/pages/library/LibraryCategoryPage.tsx`
- `/library/article/:articleId` -> `src/pages/library/LibraryArticlePage.tsx`
- `/profile` -> `src/pages/profile/ProfilePage.tsx`
- `/courses` -> `src/pages/courses/CoursesLandingPage.tsx`
- `/resume` -> `src/pages/resume/ResumeLandingPage.tsx`
- `/dorms` -> `src/pages/dorms/DormListPage.tsx`
- `/dorms/:id` -> `src/pages/dorms/DormDetailPage.tsx`
- `/dorm/:id` -> 重定向至 `/dorms/:id`

验证命令：
- `npm run verify:architecture`
