/**
 * @file ./src/components/profile/ProfileScreen.tsx
 * @description Profile feature UI
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [PAGE] User profile management and settings.
// [页面] 用户个人资料管理和设置页面。
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Language } from "../../types";
import { memoryService } from "../../services/memoryService";
import { IntegrationsSection } from "./IntegrationsSection";

interface ProfileScreenProps {
  language: Language;
  onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  language,
  onBack,
}) => {
  const { user, logout, updateName } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [isLoading, setIsLoading] = useState(false);

  // Soul editor state
  const [soul, setSoul] = useState("");
  const [isSoulEditing, setIsSoulEditing] = useState(false);
  const [isSoulSaving, setIsSoulSaving] = useState(false);

  // User memory state
  const [userMemory, setUserMemory] = useState("");
  const [isMemoryEditing, setIsMemoryEditing] = useState(false);
  const [isMemorySaving, setIsMemorySaving] = useState(false);

  // Load soul and memory on mount
  useEffect(() => {
    if (!user) return;
    void memoryService.getSoul(user.id).then(setSoul);
    void memoryService.getUserMemory(user.id).then(setUserMemory);
  }, [user]);

  const handleSaveSoul = async () => {
    if (!user) return;
    setIsSoulSaving(true);
    await memoryService.updateSoul(user.id, soul);
    setIsSoulSaving(false);
    setIsSoulEditing(false);
  };

  const handleSaveMemory = async () => {
    if (!user) return;
    setIsMemorySaving(true);
    await memoryService.updateUserMemory(user.id, userMemory);
    setIsMemorySaving(false);
    setIsMemoryEditing(false);
  };

  const handleClearMemory = async () => {
    if (
      !user ||
      !confirm(
        language === "zh"
          ? "确定要清空 AI 对你的记忆吗？"
          : "Clear all AI memory about you?"
      )
    )
      return;
    setUserMemory("");
    await memoryService.updateUserMemory(user.id, "");
  };

  const t = {
    en: {
      profile: "Profile",
      signOut: "Sign Out",
      email: "Email",
      account: "Account",
      back: "Back",
      confirmSignOut: "Are you sure you want to sign out?",
      cancel: "Cancel",
      nickname: "Nickname",
      edit: "Edit",
      save: "Save",
      saving: "Saving...",
      soulTitle: "AI Persona",
      soulDesc: "Customize how the AI assistant talks to you",
      soulPlaceholder: "e.g. Be more casual, use slang, focus on CS topics...",
      memoryTitle: "AI Memory",
      memoryDesc: "What the AI remembers about you across conversations",
      memoryPlaceholder:
        "No memories yet. Chat with the AI and it will remember key info about you.",
      clearMemory: "Clear Memory",
      charCount: "chars",
    },
    zh: {
      profile: "个人资料",
      signOut: "退出登录",
      email: "邮箱",
      account: "账户",
      back: "返回",
      confirmSignOut: "确定要退出登录吗?",
      cancel: "取消",
      nickname: "昵称",
      edit: "修改",
      save: "保存",
      saving: "保存中...",
      soulTitle: "AI 人设",
      soulDesc: "自定义 AI 助手的说话风格和关注点",
      soulPlaceholder:
        "例如：更随意一点，多用网络用语，重点关注 CS 相关话题...",
      memoryTitle: "AI 记忆",
      memoryDesc: "AI 跨对话记住的你的信息",
      memoryPlaceholder: "暂无记忆。和 AI 聊天后，它会自动记住你的关键信息。",
      clearMemory: "清空记忆",
      charCount: "字符",
    },
  }[language];

  const handleSignOut = async () => {
    if (confirm(t.confirmSignOut)) {
      await logout();
      navigate("/");
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === user?.name) {
      setIsEditing(false);
      return;
    }
    setIsLoading(true);
    const success = await updateName(newName);
    setIsLoading(false);
    if (success) {
      setIsEditing(false);
    } else {
      alert("Failed to update name. Please try again.");
    }
  };

  if (!user) return null;

  return (
    <div className="size-full overflow-y-auto bg-white">
      <div className="mx-auto max-w-md px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={onBack}
            className="
              -ml-2 rounded-full p-2 text-slate-500 transition-colors
              hover:bg-slate-100
            "
          >
            <svg
              className="size-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{t.profile}</h1>
        </div>

        {/* Profile Card */}
        <div
          className="
            mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm
          "
        >
          <div className="flex flex-col items-center">
            <div
              className="
                mb-4 flex size-24 items-center justify-center rounded-full
                bg-illini-orange text-4xl font-bold text-white shadow-lg
                shadow-illini-orange/20
              "
            >
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>

            {isEditing ? (
              <div className="mb-2 flex w-full max-w-[200px] items-center gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="
                    w-full border-b-2 border-illini-orange bg-transparent px-3
                    py-1 text-center font-bold text-slate-900
                    focus:outline-none
                  "
                  autoFocus
                />
              </div>
            ) : (
              <h2
                className="
                  mb-1 flex items-center gap-2 text-xl font-bold text-slate-900
                "
              >
                {user.name || "User"}
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setNewName(user.name);
                  }}
                  className="
                    text-slate-400
                    hover:text-illini-blue
                  "
                >
                  <svg
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </h2>
            )}

            <p className="text-sm text-slate-500">{user.email}</p>

            {isEditing && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="
                    rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium
                    text-slate-500 transition-colors
                    hover:bg-slate-200
                  "
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleUpdateName}
                  disabled={isLoading}
                  className="
                    rounded-full bg-illini-orange px-4 py-1.5 text-xs
                    font-medium text-white transition-colors
                    hover:bg-illini-blue
                    disabled:opacity-50
                  "
                >
                  {isLoading ? t.saving : t.save}
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-4">
            <div className="space-y-1">
              <label
                className="
                  text-xs font-semibold tracking-wider text-slate-400 uppercase
                "
              >
                {t.email}
              </label>
              <div
                className="
                  rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm
                  font-medium text-slate-700
                "
              >
                {user.email}
              </div>
            </div>
          </div>
        </div>

        {/* Soul Editor */}
        <div
          className="
            mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm
          "
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3
                className="
                  flex items-center gap-2 text-base font-bold text-slate-900
                "
              >
                <span>🎭</span> {t.soulTitle}
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">{t.soulDesc}</p>
            </div>
            {!isSoulEditing && (
              <button
                onClick={() => setIsSoulEditing(true)}
                className="
                  text-xs font-medium text-illini-orange transition-colors
                  hover:text-illini-blue
                "
              >
                {t.edit}
              </button>
            )}
          </div>
          {isSoulEditing ? (
            <>
              <textarea
                value={soul}
                onChange={(e) => setSoul(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder={t.soulPlaceholder}
                className="
                  w-full resize-none rounded-lg border border-slate-200
                  bg-slate-50 p-3 text-sm text-slate-700
                  focus:border-illini-orange focus:ring-2
                  focus:ring-illini-orange/30 focus:outline-none
                "
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {soul.length}/500 {t.charCount}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsSoulEditing(false)}
                    className="
                      rounded-full bg-slate-100 px-3 py-1 text-xs font-medium
                      text-slate-500 transition-colors
                      hover:bg-slate-200
                    "
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSaveSoul}
                    disabled={isSoulSaving}
                    className="
                      rounded-full bg-illini-orange px-3 py-1 text-xs
                      font-medium text-white transition-colors
                      hover:bg-illini-blue
                      disabled:opacity-50
                    "
                  >
                    {isSoulSaving ? t.saving : t.save}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div
              className="
                min-h-[60px] rounded-lg border border-slate-100 bg-slate-50 p-3
                text-sm text-slate-600
              "
            >
              {soul || (
                <span className="text-slate-400 italic">
                  {t.soulPlaceholder}
                </span>
              )}
            </div>
          )}
        </div>

        {/* User Memory */}
        <div
          className="
            mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm
          "
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3
                className="
                  flex items-center gap-2 text-base font-bold text-slate-900
                "
              >
                <span>🧠</span> {t.memoryTitle}
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">{t.memoryDesc}</p>
            </div>
            <div className="flex gap-2">
              {!isMemoryEditing && userMemory && (
                <button
                  onClick={handleClearMemory}
                  className="
                    text-xs font-medium text-red-400 transition-colors
                    hover:text-red-600
                  "
                >
                  {t.clearMemory}
                </button>
              )}
              {!isMemoryEditing && (
                <button
                  onClick={() => setIsMemoryEditing(true)}
                  className="
                    text-xs font-medium text-illini-orange transition-colors
                    hover:text-illini-blue
                  "
                >
                  {t.edit}
                </button>
              )}
            </div>
          </div>
          {isMemoryEditing ? (
            <>
              <textarea
                value={userMemory}
                onChange={(e) => setUserMemory(e.target.value)}
                maxLength={1500}
                rows={6}
                placeholder={t.memoryPlaceholder}
                className="
                  w-full resize-none rounded-lg border border-slate-200
                  bg-slate-50 p-3 text-sm text-slate-700
                  focus:border-illini-orange focus:ring-2
                  focus:ring-illini-orange/30 focus:outline-none
                "
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {userMemory.length}/1500 {t.charCount}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsMemoryEditing(false)}
                    className="
                      rounded-full bg-slate-100 px-3 py-1 text-xs font-medium
                      text-slate-500 transition-colors
                      hover:bg-slate-200
                    "
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSaveMemory}
                    disabled={isMemorySaving}
                    className="
                      rounded-full bg-illini-orange px-3 py-1 text-xs
                      font-medium text-white transition-colors
                      hover:bg-illini-blue
                      disabled:opacity-50
                    "
                  >
                    {isMemorySaving ? t.saving : t.save}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div
              className="
                min-h-[60px] rounded-lg border border-slate-100 bg-slate-50 p-3
                text-sm whitespace-pre-wrap text-slate-600
              "
            >
              {userMemory || (
                <span className="text-slate-400 italic">
                  {t.memoryPlaceholder}
                </span>
              )}
            </div>
          )}
        </div>

        <IntegrationsSection language={language} />

        {/* Actions */}
        <button
          onClick={handleSignOut}
          className="
            group flex w-full items-center justify-center gap-2 rounded-xl
            bg-red-50 py-3.5 font-semibold text-red-600 transition-colors
            hover:bg-red-100
          "
        >
          <svg
            className="
              size-5 transition-transform
              group-hover:scale-110
            "
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {t.signOut}
        </button>
      </div>
    </div>
  );
};
