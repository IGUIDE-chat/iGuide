import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArticleView } from '../../components/ArticleView';
import { ARTICLES } from '../../constants';
import { Language } from '../../types';
import { libraryService } from '../../services/libraryService';

interface LibraryArticlePageProps {
  language: Language;
}

const LibraryArticlePage: React.FC<LibraryArticlePageProps> = ({ language }) => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();

  const article = ARTICLES.find((item) => item.id === articleId);

  useEffect(() => {
    if (article) {
      libraryService.addToHistory(article);
    }
  }, [article]);

  if (!article) {
    return <div className="p-8 text-center text-slate-500">Article not found</div>;
  }

  return (
    <div className="h-full overflow-y-auto w-full no-scrollbar">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <ArticleView
          article={article}
          onBack={() => navigate('/library')}
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
