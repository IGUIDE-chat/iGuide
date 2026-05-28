/**
 * @file ./src/pages/profile/ProfilePage.tsx
 * @description Page Route Component / Module
 * @description_zh 这是一个页面级路由编排器（Orchestrator）。只负责读取 URL 参数和组装 Feature Components。不要在这里写超过 300 行的 UI 逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useCallback } from "react"
import { ProfileScreen } from "../../components/profile/ProfileScreen"
import { type Language } from "../../types"

interface ProfilePageProps {
  language: Language
}

const ProfilePage: React.FC<ProfilePageProps> = ({ language }) => {
  const handleBack = useCallback(() => window.history.back(), [])

  return <ProfileScreen language={language} onBack={handleBack} />
}

export default ProfilePage
