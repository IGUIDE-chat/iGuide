# Page Registry

`src/app/pageRegistry.ts` is the source of truth for page ownership and route
mapping.

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

Validation commands:

- `npm run typecheck`
- `npm run build`
