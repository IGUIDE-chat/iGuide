import React from "react"

import AIChat from "../../components/housing/AIChat"
import { DormListMobileHeaderPortal } from "../../components/housing/dorm-list/DormListMobileHeader"
import DormList from "../../components/housing/DormList"
import { Language } from "../../types"

interface DormListPageProps {
  language: Language
}

const DormListPage: React.FC<DormListPageProps> = ({ language }) => {
  return (
    <>
      <DormListMobileHeaderPortal language={language} />
      <DormList language={language} />
      <AIChat language={language} />
    </>
  )
}

export default DormListPage
