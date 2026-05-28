/**
 * @file ./src/pages/courses/CourseListPage.tsx
 * @description Page Route Component / Module
 * @description_zh 这是一个页面级路由编排器（Orchestrator）。只负责读取 URL 参数和组装 Feature Components。不要在这里写超过 300 行的 UI 逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from "react";
import { type Language } from "../../types";
import CourseList from "../../components/courses/CourseList";

interface CourseListPageProps {
  language: Language;
}

const CourseListPage: React.FC<CourseListPageProps> = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Courses</h1>
          <p className="text-sm text-slate-500 mt-1">UIUC course catalog</p>
        </div>
        <CourseList />
      </div>
    </div>
  );
};

export default CourseListPage;
