/**
 * @file ./src/pages/resume/ResumeLandingPage.tsx
 * @description Page Route Component / Module
 * @description_zh 这是一个页面级路由编排器（Orchestrator）。只负责读取 URL 参数和组装 Feature Components。不要在这里写超过 300 行的 UI 逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from "react";
import { AgentLandingPage } from "../../components/AgentLandingPage";
import { Language } from "../../types";

interface ResumeLandingPageProps {
  language: Language;
}

const ResumeLandingPage: React.FC<ResumeLandingPageProps> = ({ language }) => {
  return <AgentLandingPage type="resume" language={language} />;
};

export default ResumeLandingPage;
