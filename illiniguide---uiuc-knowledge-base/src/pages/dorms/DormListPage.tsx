/**
 * @file ./src/pages/dorms/DormListPage.tsx
 * @description Page Route Component / Module
 * @description_zh 这是一个页面级路由编排器（Orchestrator）。只负责读取 URL 参数和组装 Feature Components。不要在这里写超过 300 行的 UI 逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from 'react';
import DormList from '../../components/housing/DormList';
import AIChat from '../../components/housing/AIChat';
import { Language } from '../../types';

interface DormListPageProps {
  language: Language;
}

const DormListPage: React.FC<DormListPageProps> = ({ language }) => {
  return (
    <>
      <DormList language={language} />
      <AIChat language={language} />
    </>
  );
};

export default DormListPage;
