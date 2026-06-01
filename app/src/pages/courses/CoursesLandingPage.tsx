/**
 * @file ./src/pages/courses/CoursesLandingPage.tsx
 * @description Page Route Component / Module
 * @description_zh 这是一个页面级路由编排器（Orchestrator）。只负责读取 URL 参数和组装 Feature Components。不要在这里写超过 300 行的 UI 逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from "react"

import { type Language } from "../../types"
import CourseListPage from "./CourseListPage"

interface CoursesLandingPageProps {
  language: Language
}

const CoursesLandingPage: React.FC<CoursesLandingPageProps> = ({
  language,
}) => {
  return <CourseListPage language={language} />
}

export default CoursesLandingPage
