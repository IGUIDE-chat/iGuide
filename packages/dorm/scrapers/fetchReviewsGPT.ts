import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  describeError,
  GOOGLE_REVIEWS_PATH,
  randomInt,
  replaceReviews,
  type GeneratedReview,
} from "./dataset.ts"

/**
 * Generates dorm reviews from DeepSeek's parametric memory instead of scraping
 * them, for the halls Google Maps has no review page for. It REPLACES the
 * dataset rather than appending to it: these reviews are recall, not evidence,
 * and are meant to stand alone for the halls they cover.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const ENV_FILE = path.join(REPO_ROOT, "apps/web/.env.local")

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions"
const REQUEST_TIMEOUT_MS = 45_000
const CONCURRENCY = 5

const DORMS: Record<string, string> = {
  isr: "Illinois Street Residence Halls (Townsend/Wardall)",
  nugent: "Nugent Hall",
  wassaja: "Wassaja Hall",
  par: "Pennsylvania Avenue Residence (PAR)",
  far: "Florida Avenue Residence (FAR)",
  allen: "Allen Hall",
  "busey-evans": "Busey-Evans",
  snyder: "Snyder Hall",
  hopkins: "Hopkins Hall",
  weston: "Weston Hall",
  scott: "Scott Hall",
  taft: "Taft Hall",
  "van-doren": "Van Doren Hall",
  bousefield: "Bousefield Hall",
  daniels: "Daniels Hall",
}

/** DeepSeek answers in JSON, but its shape is the model's to choose. */
interface ModelReview {
  displayName?: unknown
  content?: unknown
  vote?: unknown
}

interface DeepSeekResponse {
  choices?: { message?: { content?: string } }[]
}

/**
 * `KEY=value` pairs from a dotenv file, which the key lookup prefers over the
 * ambient environment so a checked-out local key wins.
 */
function readEnvFile(file: string): Record<string, string> {
  let contents: string
  try {
    contents = readFileSync(file, "utf8")
  } catch {
    return {}
  }

  const values: Record<string, string> = {}
  for (const line of contents.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const separator = trimmed.indexOf("=")
    if (separator === -1) continue
    values[trimmed.slice(0, separator).trim()] = trimmed.slice(separator + 1).trim()
  }
  return values
}

function resolveApiKey(): string | undefined {
  const fromFile = readEnvFile(ENV_FILE)
  return [
    fromFile.DEEPSEEK_API_KEY,
    fromFile.VITE_DEEPSEEK_API_KEY,
    process.env.DEEPSEEK_API_KEY,
    process.env.VITE_DEEPSEEK_API_KEY,
  ].find((candidate) => candidate !== undefined && candidate !== "")
}

const promptFor = (
  dormName: string,
) => `You are an expert data retrieval agent. Your task is to output exactly 15 highly realistic, historically accurate, and extremely detailed reviews for ${dormName} at UIUC, mirroring the exact quality, complaints, and praises found on Google Maps.

DO NOT output generic "good dorm" sentences. Mention specific details: room dimensions, specific dining hall food, lack of AC, specific location proximities (e.g., ARC, Green Street, Engineering Quad), and known building issues.
Provide exactly 15 reviews.
Include a mix of 5-star, 3-star, and 1-star sentiments.
Output strictly in JSON format as a list of objects with keys: "displayName" (string, fake human name), "content" (string), "vote" (integer 1 or -1).`

/**
 * Pulls the review list out of whatever the model wrapped it in. JSON mode is
 * asked for an object, so a bare array may arrive under an arbitrary key or
 * fenced in prose.
 */
function extractReviews(reply: string): ModelReview[] {
  try {
    const parsed: unknown = JSON.parse(reply)
    if (Array.isArray(parsed)) return parsed as ModelReview[]
    if (parsed !== null && typeof parsed === "object") {
      const nested = Object.values(parsed).find((value) => Array.isArray(value))
      if (nested) return nested as ModelReview[]
    }
  } catch {
    // Not a whole-object JSON payload; fall through to the fenced-array rescue.
  }

  const fenced = reply.match(/\[.*\]/s)?.[0]
  if (!fenced) return []
  try {
    const parsed: unknown = JSON.parse(fenced)
    return Array.isArray(parsed) ? (parsed as ModelReview[]) : []
  } catch {
    return []
  }
}

async function recallReviews(
  dormId: string,
  dormName: string,
  apiKey: string,
): Promise<ModelReview[]> {
  console.log(`[${dormId}] Recalling from model parametric memory...`)

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You are a direct data exporter. Output only valid JSON arrays. Do not use markdown blocks if unnecessary.",
        },
        { role: "user", content: promptFor(dormName) },
      ],
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek answered ${response.status}: ${await response.text()}`)
  }

  const reply = ((await response.json()) as DeepSeekResponse).choices?.[0]?.message?.content
  if (!reply) throw new Error("DeepSeek returned no message content")

  return extractReviews(reply)
}

/** One dorm failing is not a reason to abandon the other thirteen. */
async function safeRecall(
  dormId: string,
  dormName: string,
  apiKey: string,
): Promise<{ dormId: string; reviews: ModelReview[] }> {
  try {
    return { dormId, reviews: await recallReviews(dormId, dormName, apiKey) }
  } catch (error) {
    console.log(`[${dormId}] Error: ${describeError(error)}`)
    return { dormId, reviews: [] }
  }
}

/** DeepSeek rate-limits bursts, so keep at most `limit` calls in flight. */
async function mapWithLimit<T, R>(
  items: readonly T[],
  limit: number,
  run: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  let next = 0

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++
        results[index] = await run(items[index] as T)
      }
    }),
  )

  return results
}

async function main(): Promise<void> {
  const apiKey = resolveApiKey()
  if (!apiKey) {
    throw new Error(`Set DEEPSEEK_API_KEY in ${ENV_FILE} or in the environment`)
  }

  const recalled = await mapWithLimit(Object.entries(DORMS), CONCURRENCY, ([dormId, dormName]) =>
    safeRecall(dormId, dormName, apiKey),
  )

  const collected: GeneratedReview[] = []
  for (const { dormId, reviews } of recalled) {
    reviews.forEach((review, index) => {
      const content = typeof review.content === "string" ? review.content : ""
      if (!content) return

      collected.push({
        id: `gm-${dormId}-${index}`,
        dormId,
        displayName:
          typeof review.displayName === "string" && review.displayName
            ? review.displayName
            : "Google Maps User",
        content,
        vote: review.vote === 1 ? 1 : -1,
        daysAgo: randomInt(1, 365),
        upvotes: randomInt(0, 45),
      })
    })
  }

  console.log(`Total reviews extracted: ${collected.length}`)
  const written = replaceReviews(collected)
  console.log(`Wrote ${written} memory-recalled reviews to ${GOOGLE_REVIEWS_PATH}`)
}

main().catch((error) => {
  console.error(`Review generation failed: ${describeError(error)}`)
  process.exitCode = 1
})
