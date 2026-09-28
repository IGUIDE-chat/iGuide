import React, { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { ArticleView } from "../../components/library/ArticleView"
import { ARTICLES } from "../../constants"
import { libraryService } from "../../services/libraryService"
import { Language } from "../../types"

interface LibraryArticlePageProps {
  language: Language
}

const LibraryArticlePage: React.FC<LibraryArticlePageProps> = ({ language }) => {
  const { articleId } = useParams<{ articleId: string }>()
  const navigate = useNavigate()

  const article = ARTICLES.find((item) => item.id === articleId)

  useEffect(() => {
    if (article) {
      libraryService.addToHistory(article)
    }
  }, [article])

  if (!article) {
    return <div className="p-8 text-center text-slate-500">Article not found</div>
  }

  return (
    <div className="no-scrollbar size-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-8 pb-24">
        <ArticleView
          article={article}
          onBack={() => navigate("/library")}
          onSearch={(query) => {
            navigate(`/library?q=${encodeURIComponent(query)}`)
          }}
          language={language}
        />
      </div>
    </div>
  )
}

export default LibraryArticlePage
