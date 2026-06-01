/**
 * @file ./src/pages/dorms/DormDetailPage.tsx
 * @description Page Route Component / Module
 * @description_zh 这是一个页面级路由编排器（Orchestrator）。只负责读取 URL 参数和组装 Feature Components。不要在这里写超过 300 行的 UI 逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from "react"

import AIChat from "../../components/housing/AIChat"
import DormDetail from "../../components/housing/DormDetail"
import { type Language } from "../../types"

interface DormDetailPageProps {
  language: Language
}

const DormDetailPage: React.FC<DormDetailPageProps> = ({ language }) => {
  return (
    <>
      <DormDetail language={language} />
      <AIChat language={language} />
    </>
  )
}

export default DormDetailPage
