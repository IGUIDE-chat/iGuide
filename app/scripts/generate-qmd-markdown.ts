/**
 * @file scripts/generate-qmd-markdown.ts
 * @description Generates the Markdown corpus consumed by tobi/qmd.
 */

import fs from "node:fs/promises"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

import { ARTICLES } from "../src/data/articles/index"
import { type Article } from "../src/types"
import { UIUC_DORMS } from "../src/components/housing/constants/dormData"
import {
  type BathroomScope,
  type Dorm,
} from "../src/components/housing/types/index"
import {
  finalizeDormRecord,
  sanitizeFloorPlansForStorage,
} from "../src/utils/dormData"
import { getDormBathroomSummary, normalizeDorm } from "../src/utils/roomOptions"

const __dirname = import.meta.dirname
const PROJECT_ROOT = path.resolve(__dirname, "..")
const QMD_ROOT = path.resolve(PROJECT_ROOT, "../qmd-content")
const HANDBOOK_OCR_SCRIPT = path.resolve(
  PROJECT_ROOT,
  "scripts/generate-handbook-ocr.py"
)
const PYTHON_CMD = process.env.PYTHON ?? "python"
const TODAY = new Date().toISOString().slice(0, 10)
const DORMS_TABLE = "dorms"

dotenv.config({ path: path.resolve(PROJECT_ROOT, ".env.local"), quiet: true })
dotenv.config({ path: path.resolve(PROJECT_ROOT, ".env"), quiet: true })

interface DormDocumentRecord {
  dorm: Dorm
  updatedAt: string
  source: string
}

interface Frontmatter {
  id: string
  type: "article" | "dorm" | "handbook"
  lang: "en" | "zh"
  source: string
  title: string
  updated_at: string
  category?: string
  tags?: string[]
}

function sanitizeLine(value: string | undefined | null) {
  return (value ?? "").replaceAll("\r\n", "\n").trim()
}

function sanitizeParagraph(value: string | undefined | null) {
  return sanitizeLine(value).replaceAll(/\n{3,}/g, "\n\n")
}

function yamlString(value: string) {
  return JSON.stringify(value)
}

function renderFrontmatter(frontmatter: Frontmatter) {
  const lines = ["---"]

  for (const [key, value] of Object.entries(frontmatter)) {
    if (value == null) {
      continue
    }

    if (Array.isArray(value)) {
      lines.push(`${key}:`)
      for (const item of value) {
        lines.push(`  - ${yamlString(item)}`)
      }
      continue
    }

    lines.push(`${key}: ${yamlString(String(value))}`)
  }

  lines.push("---", "")
  return lines.join("\n")
}

function renderBulletList(items: Array<string | undefined>, emptyText: string) {
  const normalized = items.map((item) => sanitizeLine(item)).filter(Boolean)

  if (normalized.length === 0) {
    return `- ${emptyText}`
  }

  return normalized.map((item) => `- ${item}`).join("\n")
}

function renderOptionalValue(label: string, value: string | undefined) {
  const normalized = sanitizeLine(value)
  return normalized ? `- ${label}: ${normalized}` : undefined
}

function getArticleTitle(article: Article, lang: "en" | "zh") {
  return lang === "zh"
    ? sanitizeLine(article.title_zh) || article.title
    : article.title
}

function getArticleSummary(article: Article, lang: "en" | "zh") {
  return lang === "zh"
    ? sanitizeLine(article.summary_zh) || article.summary
    : article.summary
}

function getArticleContent(article: Article, lang: "en" | "zh") {
  return lang === "zh"
    ? sanitizeParagraph(article.content_zh) ||
        sanitizeParagraph(article.content)
    : sanitizeParagraph(article.content)
}

function getArticleTags(article: Article, lang: "en" | "zh") {
  return lang === "zh" && article.tags_zh?.length
    ? article.tags_zh
    : article.tags
}

function buildArticleMarkdown(article: Article, lang: "en" | "zh") {
  const title = getArticleTitle(article, lang)
  const summary = getArticleSummary(article, lang)
  const content = getArticleContent(article, lang)
  const tags = getArticleTags(article, lang)

  const frontmatter = renderFrontmatter({
    id: article.id,
    type: "article",
    lang,
    source: "src/data/articles",
    title,
    updated_at: article.lastUpdated,
    category: article.category,
    tags,
  })

  return (
    frontmatter +
    [
      `# ${title}`,
      "",
      summary,
      "",
      "## Metadata",
      "",
      `- Category: ${article.category}`,
      `- Tags: ${tags.join(", ")}`,
      `- Last Updated: ${article.lastUpdated}`,
      "",
      "## Content",
      "",
      content,
      "",
    ].join("\n")
  )
}

function getDormTitle(dorm: Dorm, lang: "en" | "zh") {
  return lang === "zh" ? sanitizeLine(dorm.name_zh) || dorm.name : dorm.name
}

function getDormDescription(dorm: Dorm, lang: "en" | "zh") {
  return lang === "zh"
    ? sanitizeParagraph(dorm.description_zh) ||
        sanitizeParagraph(dorm.description)
    : sanitizeParagraph(dorm.description)
}

function getDormPros(dorm: Dorm, lang: "en" | "zh") {
  return lang === "zh" && dorm.pros_zh?.length ? dorm.pros_zh : dorm.pros
}

function getDormCons(dorm: Dorm, lang: "en" | "zh") {
  return lang === "zh" && dorm.cons_zh?.length ? dorm.cons_zh : dorm.cons
}

function getDormLocation(dorm: Dorm, lang: "en" | "zh") {
  return lang === "zh"
    ? sanitizeLine(dorm.location_zh) || dorm.location
    : dorm.location
}

function getHousingTypeLabel(
  housingType: Dorm["housingType"],
  lang: "en" | "zh"
) {
  if (lang === "zh") {
    return housingType === "URH" ? "大学宿舍（URH）" : "认证私营宿舍（PCH）"
  }
  return housingType === "URH"
    ? "University Residence Halls (URH)"
    : "Private Certified Housing (PCH)"
}

function getDiningLabel(dining: Dorm["dining"], lang: "en" | "zh") {
  const labels = {
    en: {
      inside: "Dining hall in building",
      nearby: "Nearby dining",
      none: "No dedicated dining",
    },
    zh: {
      inside: "楼内食堂",
      nearby: "附近就餐",
      none: "无配套餐饮",
    },
  }

  return labels[lang][dining]
}

function getAcLabel(ac: boolean, lang: "en" | "zh") {
  if (lang === "zh") {
    return ac ? "有空调" : "无空调"
  }
  return ac ? "Air-conditioned" : "No AC"
}

function getBathroomScopeLabel(scope: BathroomScope, lang: "en" | "zh") {
  const labels = {
    en: {
      communal: "Communal bath",
      "individual-use": "Single-use shared bath",
      "semi-private": "Semi-private bath",
      private: "Private bath",
    },
    zh: {
      communal: "公共卫浴",
      "individual-use": "公共单人卫浴",
      "semi-private": "半独立卫浴",
      private: "独立卫浴",
    },
  }

  return labels[lang][scope]
}

function formatCurrency(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? `$${value.toLocaleString("en-US")}`
    : undefined
}

function buildRoomOptionLine(
  option: NonNullable<Dorm["roomOptions"]>[number],
  lang: "en" | "zh"
) {
  const parts: string[] = []

  if (option.labelCode) {
    parts.push(option.labelCode)
  }
  if (option.bedCount != null) {
    parts.push(
      lang === "zh" ? `${option.bedCount}人` : `${option.bedCount} bed`
    )
  }
  if (
    option.bathroomScope === "communal" ||
    option.bathroomScope === "individual-use"
  ) {
    parts.push(getBathroomScopeLabel(option.bathroomScope, lang))
  } else if (option.bathroomCount != null && option.bathroomCount > 0) {
    parts.push(
      lang === "zh"
        ? `${option.bathroomCount}卫`
        : `${option.bathroomCount} bath`
    )
  } else {
    parts.push(getBathroomScopeLabel(option.bathroomScope, lang))
  }

  return parts.join(" | ")
}

function buildFloorPlanLine(
  plan: NonNullable<Dorm["floorPlans"]>[number],
  lang: "en" | "zh"
) {
  const parts: string[] = []
  const displayName =
    sanitizeLine(plan.officialName) ||
    plan.labelCode ||
    plan.type ||
    (lang === "zh" ? "未命名房型" : "Unnamed layout")

  parts.push(displayName)

  if (typeof plan.price === "number") {
    parts.push(formatCurrency(plan.price) ?? "")
  }
  if (typeof plan.sqft === "number" && Number.isFinite(plan.sqft)) {
    parts.push(`${plan.sqft} sqft`)
  }
  if (plan.bedSize) {
    parts.push(plan.bedSize)
  }
  if (plan.description) {
    parts.push(sanitizeLine(plan.description))
  }

  return parts.filter(Boolean).join(" | ")
}

function buildDormMarkdown(record: DormDocumentRecord, lang: "en" | "zh") {
  const { dorm, updatedAt, source } = record
  const title = getDormTitle(dorm, lang)
  const description = getDormDescription(dorm, lang)
  const website = sanitizeLine(dorm.website)
  const imageUrl = sanitizeLine(dorm.imageUrl)

  const quickFacts = [
    renderOptionalValue(
      lang === "zh" ? "英文名" : "English Name",
      lang === "zh" ? dorm.name : sanitizeLine(dorm.name_zh)
    ),
    `- ${lang === "zh" ? "住宿类型" : "Housing Type"}: ${getHousingTypeLabel(dorm.housingType, lang)}`,
    `- ${lang === "zh" ? "位置" : "Location"}: ${getDormLocation(dorm, lang)}`,
    renderOptionalValue(
      lang === "zh" ? "年费用" : "Annual Price",
      formatCurrency(dorm.price)
    ),
    renderOptionalValue(
      lang === "zh" ? "申请费" : "Application Fee",
      formatCurrency(dorm.applicationFee)
    ),
    `- ${lang === "zh" ? "空调" : "AC"}: ${getAcLabel(dorm.ac, lang)}`,
    `- ${lang === "zh" ? "餐饮" : "Dining"}: ${getDiningLabel(dorm.dining, lang)}`,
    `- ${lang === "zh" ? "卫浴" : "Bathroom"}: ${getDormBathroomSummary(dorm, lang)}`,
    renderOptionalValue(
      lang === "zh" ? "地址" : "Address",
      lang === "zh"
        ? sanitizeLine(dorm.address_zh) || dorm.address
        : dorm.address
    ),
    renderOptionalValue(lang === "zh" ? "官网" : "Website", website),
    renderOptionalValue(lang === "zh" ? "主图" : "Primary Image", imageUrl),
  ].filter(Boolean) as string[]

  const roomOptions = dorm.roomOptions?.length
    ? dorm.roomOptions
        .map((option) => `- ${buildRoomOptionLine(option, lang)}`)
        .join("\n")
    : `- ${lang === "zh" ? "无房型选项数据" : "No room option data"}`

  const floorPlans = dorm.floorPlans?.length
    ? dorm.floorPlans
        .map((plan) => `- ${buildFloorPlanLine(plan, lang)}`)
        .join("\n")
    : `- ${lang === "zh" ? "无详细户型数据" : "No detailed floor plan data"}`

  const frontmatter = renderFrontmatter({
    id: dorm.id,
    type: "dorm",
    lang,
    source,
    title,
    updated_at: updatedAt,
    tags: dorm.tags,
  })

  return (
    frontmatter +
    [
      `# ${title}`,
      "",
      description,
      "",
      `## ${lang === "zh" ? "基础信息" : "Quick Facts"}`,
      "",
      ...quickFacts,
      "",
      `## ${lang === "zh" ? "优点" : "Pros"}`,
      "",
      renderBulletList(
        getDormPros(dorm, lang),
        lang === "zh" ? "暂无优点信息" : "No pros provided"
      ),
      "",
      `## ${lang === "zh" ? "注意点" : "Cons"}`,
      "",
      renderBulletList(
        getDormCons(dorm, lang),
        lang === "zh" ? "暂无注意点信息" : "No cons provided"
      ),
      "",
      `## ${lang === "zh" ? "标签" : "Tags"}`,
      "",
      `- ${dorm.tags.join(", ")}`,
      "",
      `## ${lang === "zh" ? "餐饮说明" : "Dining Details"}`,
      "",
      sanitizeParagraph(dorm.diningNearbyDetail) ||
        (lang === "zh" ? "无额外餐饮信息。" : "No additional dining details."),
      "",
      `## ${lang === "zh" ? "房型选项" : "Room Options"}`,
      "",
      roomOptions,
      "",
      `## ${lang === "zh" ? "户型与价格" : "Floor Plans"}`,
      "",
      floorPlans,
      "",
    ].join("\n")
  )
}

function mapDormRow(row: Record<string, unknown>): DormDocumentRecord {
  const fallbackDorm = UIUC_DORMS.find((item) => item.id === row.id)
  const dorm = finalizeDormRecord(
    normalizeDorm({
      id: row.id as string,
      name: (row.name as string) ?? fallbackDorm?.name ?? "",
      name_zh: (row.name_zh as string) ?? fallbackDorm?.name_zh,
      description:
        (row.description as string) ?? fallbackDorm?.description ?? "",
      description_zh:
        (row.description_zh as string) ?? fallbackDorm?.description_zh,
      imageUrl: (row.image_url as string) ?? fallbackDorm?.imageUrl ?? "",
      price: Number(row.price) || fallbackDorm?.price || 0,
      priceRange:
        (row.price_range as Dorm["priceRange"]) ??
        fallbackDorm?.priceRange ??
        "$",
      location:
        (row.location as string) ?? fallbackDorm?.location ?? "Main Quad",
      location_zh: (row.location_zh as string) ?? fallbackDorm?.location_zh,
      housingType:
        (row.housing_type as Dorm["housingType"]) ??
        fallbackDorm?.housingType ??
        "URH",
      ac: row.ac != null ? Boolean(row.ac) : (fallbackDorm?.ac ?? false),
      dining:
        (row.dining as Dorm["dining"]) ?? fallbackDorm?.dining ?? "nearby",
      diningNearbyDetail:
        (row.dining_nearby_detail as string) ??
        fallbackDorm?.diningNearbyDetail,
      bathroomType:
        (row.bathroom_type as Dorm["bathroomType"]) ??
        fallbackDorm?.bathroomType ??
        "communal",
      lat: Number(row.lat) || fallbackDorm?.lat || 0,
      lng: Number(row.lng) || fallbackDorm?.lng || 0,
      tags: (row.tags as string[]) ?? fallbackDorm?.tags ?? [],
      structuredTags:
        (row.structured_tags as Dorm["structuredTags"]) ??
        fallbackDorm?.structuredTags,
      categorizedTags: (row.categorized_tags as Dorm["categorizedTags"]) ?? {
        livingConditions: fallbackDorm?.categorizedTags.livingConditions ?? [],
        facilities: fallbackDorm?.categorizedTags.facilities ?? [],
        lifestyle: fallbackDorm?.categorizedTags.lifestyle ?? [],
        ...(fallbackDorm?.categorizedTags.llcNames?.length
          ? { llcNames: fallbackDorm.categorizedTags.llcNames }
          : {}),
      },
      roomTypes:
        (row.room_types as Dorm["roomTypes"]) ?? fallbackDorm?.roomTypes ?? [],
      roomOptions:
        (row.room_options as Dorm["roomOptions"]) ?? fallbackDorm?.roomOptions,
      floorPlans:
        sanitizeFloorPlansForStorage(row.floor_plans as Dorm["floorPlans"]) ??
        fallbackDorm?.floorPlans,
      galleryImages:
        (row.gallery_images as string[]) ?? fallbackDorm?.galleryImages,
      pros: (row.pros as string[]) ?? fallbackDorm?.pros ?? [],
      pros_zh: (row.pros_zh as string[]) ?? fallbackDorm?.pros_zh,
      cons: (row.cons as string[]) ?? fallbackDorm?.cons ?? [],
      cons_zh: (row.cons_zh as string[]) ?? fallbackDorm?.cons_zh,
      applicationFee:
        row.application_fee != null
          ? Number(row.application_fee)
          : fallbackDorm?.applicationFee,
      address: (row.address as string) ?? fallbackDorm?.address,
      address_zh: (row.address_zh as string) ?? fallbackDorm?.address_zh,
      website: (row.website as string) ?? fallbackDorm?.website,
    })
  )

  return {
    dorm,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : TODAY,
    source: "supabase:dorms",
  }
}

function fallbackDormRecords(): DormDocumentRecord[] {
  return UIUC_DORMS.map((dorm) => ({
    dorm,
    updatedAt: TODAY,
    source: "src/components/housing/constants/dormData.ts",
  }))
}

async function fetchDormRecords(): Promise<DormDocumentRecord[]> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "[qmd] Supabase env missing. Falling back to static dorm data."
    )
    return fallbackDormRecords()
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.from(DORMS_TABLE).select("*")

    if (error) {
      console.warn(
        `[qmd] Failed to fetch dorms from Supabase: ${error.message}`
      )
      return fallbackDormRecords()
    }

    if (!data?.length) {
      console.warn(
        "[qmd] Supabase dorm query returned no rows. Falling back to static dorm data."
      )
      return fallbackDormRecords()
    }

    return data.map((row) => mapDormRow(row as Record<string, unknown>))
  } catch (error) {
    console.warn(
      "[qmd] Supabase dorm fetch threw. Falling back to static dorm data.",
      error
    )
    return fallbackDormRecords()
  }
}

async function resetManagedDirectories() {
  await fs.mkdir(QMD_ROOT, { recursive: true })
  await Promise.all([
    fs.rm(path.join(QMD_ROOT, "articles"), { recursive: true, force: true }),
    fs.rm(path.join(QMD_ROOT, "dorms"), { recursive: true, force: true }),
    fs.rm(path.join(QMD_ROOT, "handbook"), { recursive: true, force: true }),
  ])
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function writeFile(filePath: string, content: string) {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, content, "utf8")
}

async function generateArticleCorpus() {
  for (const lang of ["en", "zh"] as const) {
    const outputDir = path.join(QMD_ROOT, "articles", lang)
    await ensureDir(outputDir)

    for (const article of ARTICLES) {
      await writeFile(
        path.join(outputDir, `${article.id}.md`),
        buildArticleMarkdown(article, lang)
      )
    }
  }

  console.log(`[qmd] Wrote ${ARTICLES.length * 2} article documents.`)
}

async function generateDormCorpus() {
  const records = await fetchDormRecords()

  for (const lang of ["en", "zh"] as const) {
    const outputDir = path.join(QMD_ROOT, "dorms", lang)
    await ensureDir(outputDir)

    for (const record of records) {
      await writeFile(
        path.join(outputDir, `${record.dorm.id}.md`),
        buildDormMarkdown(record, lang)
      )
    }
  }

  console.log(`[qmd] Wrote ${records.length * 2} dorm documents.`)
}

function generateHandbookCorpus() {
  const outputPath = path.join(
    QMD_ROOT,
    "handbook",
    "zh",
    "uiuc-new-student-handbook-2025.md"
  )

  execFileSync(
    PYTHON_CMD,
    ["-X", "utf8", HANDBOOK_OCR_SCRIPT, "--output", outputPath],
    {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
    }
  )

  console.log(`[qmd] Wrote handbook document to ${outputPath}.`)
}

export async function generateQmdMarkdown() {
  await resetManagedDirectories()
  await generateArticleCorpus()
  await generateDormCorpus()
  generateHandbookCorpus()
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  path.resolve(process.argv[1]) === import.meta.filename

if (isDirectRun) {
  generateQmdMarkdown().catch((error) => {
    console.error("[qmd] Markdown generation failed:", error)
    process.exit(1)
  })
}
