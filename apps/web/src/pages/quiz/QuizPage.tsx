import React from "react"

import { QuizScreen } from "../../components/quiz/QuizScreen"
import { Language } from "../../types"

interface QuizPageProps {
  language: Language
}

const QuizPage: React.FC<QuizPageProps> = ({ language }) => {
  return <QuizScreen language={language} />
}

export default QuizPage
