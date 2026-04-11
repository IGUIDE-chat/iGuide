/**
 * @file ./src/pages/library/LibraryArticlePage.tsx
 * @description Page Route Component / Module
 * @description_zh 这是一个页面级路由编排器（Orchestrator）。只负责读取 URL 参数和组装 Feature Components。不要在这里写超过 300 行的 UI 逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArticleView } from "../../components/library/ArticleView";
import { ARTICLES } from "../../constants";
import { Language } from "../../types";
import { libraryService } from "../../services/libraryService";

interface LibraryArticlePageProps {
  language: Language;
}

const LibraryArticlePage: React.FC<LibraryArticlePageProps> = ({
  language,
}) => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();

  const article = ARTICLES.find((item) => item.id === articleId);

  useEffect(() => {
    if (article) {
      libraryService.addToHistory(article);
    }
  }, [article]);

  if (!article) {
    return (
      <div className="p-8 text-center text-slate-500">Article not found</div>
    );
  }

  return (
    <div className="no-scrollbar size-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-8 pb-24">
        <ArticleView
          article={article}
          onBack={() => navigate("/library")}
          onSearch={(query) => {
            navigate(`/library?q=${encodeURIComponent(query)}`);
          }}
          language={language}
        />
      </div>
    </div>
  );
};

export default LibraryArticlePage;
