import React from "react"

import AIChat from "../../components/housing/AIChat"
import DormList from "../../components/housing/DormList"
import { Language } from "../../types"

interface DormListPageProps {
  language: Language
}

const DormListPage: React.FC<DormListPageProps> = ({ language }) => {
  return (
    <>
      <DormList language={language} />
      <AIChat language={language} />
    </>
  )
}

export default DormListPage
