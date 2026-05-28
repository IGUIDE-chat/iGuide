/**
 * @file ./src/constants.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [ROOT] Global constants and static library metadata.
import { type Article, type Category, type Language } from "./types"
import { UI_TEXT as I18N_UI_TEXT } from "./i18n/uiText"

/** @deprecated Use UI_TEXT from './i18n/uiText' directly. */
export const UI_TEXT = I18N_UI_TEXT

export const CATEGORIES: Category[] = [
  {
    id: "housing",
    icon: "🏡",
    label: "Housing & Dorms",
    description: "Dorms, apartments, and leasing guides.",
    label_zh: "住宿与宿舍",
    description_zh: "宿舍选择、公寓租房与避坑指南。",
  },
  {
    id: "academics",
    icon: "📚",
    label: "Academics",
    description: "Registration, libraries, and study spots.",
    label_zh: "学术与选课",
    description_zh: "选课技巧、图书馆与自习地点。",
  },
  {
    id: "transport",
    icon: "🚌",
    label: "Transportation",
    description: "MTD buses, VeoRide, and getting home.",
    label_zh: "交通出行",
    description_zh: "公交、共享单车与往返机场。",
  },
  {
    id: "dining",
    icon: "🍜",
    label: "Food & Dining",
    description: "Dining halls, Green St restaurants, and cafes.",
    label_zh: "饮食餐饮",
    description_zh: "食堂攻略、绿街美食与咖啡店。",
  },
  {
    id: "social",
    icon: "🎉",
    label: "Social Life",
    description: "RSOs, Quad Day, and events.",
    label_zh: "社团与社交",
    description_zh: "RSO 社团、Quad Day 与校园活动。",
  },
  {
    id: "safety",
    icon: "🛡️",
    label: "Safety & Health",
    description: "McKinley, SafeWalks, and emergency info.",
    label_zh: "安全与健康",
    description_zh: "校医院、夜间陪走与紧急联系方式。",
  },
]

export { ARTICLES } from "./data/articles"

export const getArticleText = (article: Article, lang: Language) => ({
  title: lang === "zh" && article.title_zh ? article.title_zh : article.title,
  summary:
    lang === "zh" && article.summary_zh ? article.summary_zh : article.summary,
  content:
    lang === "zh" && article.content_zh ? article.content_zh : article.content,
  tags: lang === "zh" && article.tags_zh ? article.tags_zh : article.tags,
})

export const getCategoryText = (category: Category, lang: Language) => ({
  label:
    lang === "zh" && category.label_zh ? category.label_zh : category.label,
  description:
    lang === "zh" && category.description_zh
      ? category.description_zh
      : category.description,
})
