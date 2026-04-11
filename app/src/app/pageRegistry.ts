/**
 * @file ./src/app/pageRegistry.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

export interface PageRegistryItem {
  id: string;
  path: string;
  componentPath: string;
  ownerFeature:
    | "chat"
    | "library"
    | "dorms"
    | "courses"
    | "resume"
    | "profile"
    | "router";
  contexts: Array<"auth" | "housing" | "dorm-user-interaction" | "none">;
  status: "active" | "redirect";
}

export const PAGE_REGISTRY: PageRegistryItem[] = [
  {
    id: "root-redirect",
    path: "/",
    componentPath: "src/app/routes.tsx#RootRedirect",
    ownerFeature: "router",
    contexts: ["none"],
    status: "redirect",
  },
  {
    id: "chat",
    path: "/chat",
    componentPath: "src/pages/chat/ChatPage.tsx",
    ownerFeature: "chat",
    contexts: ["auth"],
    status: "active",
  },
  {
    id: "library-home",
    path: "/library",
    componentPath: "src/pages/library/LibraryHomePage.tsx",
    ownerFeature: "library",
    contexts: ["auth"],
    status: "active",
  },
  {
    id: "library-category",
    path: "/library/category/:categoryId",
    componentPath: "src/pages/library/LibraryCategoryPage.tsx",
    ownerFeature: "library",
    contexts: ["auth"],
    status: "active",
  },
  {
    id: "library-article",
    path: "/library/article/:articleId",
    componentPath: "src/pages/library/LibraryArticlePage.tsx",
    ownerFeature: "library",
    contexts: ["auth"],
    status: "active",
  },
  {
    id: "profile",
    path: "/profile",
    componentPath: "src/pages/profile/ProfilePage.tsx",
    ownerFeature: "profile",
    contexts: ["auth"],
    status: "active",
  },
  {
    id: "courses-landing",
    path: "/courses",
    componentPath: "src/pages/courses/CoursesLandingPage.tsx",
    ownerFeature: "courses",
    contexts: ["auth"],
    status: "active",
  },
  {
    id: "resume-landing",
    path: "/resume",
    componentPath: "src/pages/resume/ResumeLandingPage.tsx",
    ownerFeature: "resume",
    contexts: ["auth"],
    status: "active",
  },
  {
    id: "dorm-list",
    path: "/dorms",
    componentPath: "src/pages/dorms/DormListPage.tsx",
    ownerFeature: "dorms",
    contexts: ["auth", "housing", "dorm-user-interaction"],
    status: "active",
  },
  {
    id: "dorm-detail",
    path: "/dorms/:id",
    componentPath: "src/pages/dorms/DormDetailPage.tsx",
    ownerFeature: "dorms",
    contexts: ["auth", "housing", "dorm-user-interaction"],
    status: "active",
  },
  {
    id: "dorm-legacy-redirect",
    path: "/dorm/:id",
    componentPath: "src/app/routes.tsx#LegacyDormRedirect",
    ownerFeature: "router",
    contexts: ["none"],
    status: "redirect",
  },
];
