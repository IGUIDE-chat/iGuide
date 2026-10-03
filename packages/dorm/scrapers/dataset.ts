import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/**
 * The review dataset every script in this directory writes to, plus the record
 * shape it stores. The Puppeteer scrapers and the DeepSeek generator both
 * produce `GeneratedReview`s, so they share the renderer and the write modes.
 */

/** One `generateComment(...)` entry in the dataset. */
export interface GeneratedReview {
  id: string
  dormId: string
  displayName: string
  content: string
  vote: 1 | -1
  daysAgo: number
  upvotes: number
}

export const GOOGLE_REVIEWS_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../apps/web/src/components/housing/constants/googleReviews.ts",
)

const ARRAY_DECLARATION = "export const GOOGLE_REVIEWS"

/**
 * oxfmt wraps a call that overflows this column count onto one line per
 * argument. Rendering at the same width keeps the dataset formatter-clean the
 * moment it is written, instead of leaving `vp check --fix` to reflow it.
 */
const PRINT_WIDTH = 100

/** A uniform random integer, inclusive on both ends. */
export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function renderReview(review: GeneratedReview): string {
  // Backslashes are escaped first, otherwise the escapes the later steps add
  // would themselves be escaped; newlines come last so the two characters this
  // writes survive as an escape rather than becoming one.
  const content = review.content
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${")
    .replace(/\r\n|[\r\n]/g, "\\n")

  const args = [
    JSON.stringify(review.id),
    JSON.stringify(review.dormId),
    JSON.stringify(review.displayName),
    `\`${content}\``,
    String(review.vote),
    String(review.daysAgo),
    String(review.upvotes),
  ]

  const singleLine = `  generateComment(${args.join(", ")})`
  if (singleLine.length <= PRINT_WIDTH) return singleLine

  return ["  generateComment(", ...args.map((arg) => `    ${arg},`), "  )"].join("\n")
}

/** Every entry carries a trailing comma, the last one included, as oxfmt writes it. */
function renderEntries(reviews: GeneratedReview[]): string {
  return reviews.map((review) => `${renderReview(review)},`).join("\n")
}

/** Index just past the string literal opened at `start`. */
function skipQuoted(source: string, start: number): number {
  const quote = source[start]
  let index = start + 1

  while (index < source.length) {
    const char = source[index]
    if (char === "\\") {
      index += 2
      continue
    }
    if (char === quote) return index + 1
    index += 1
  }

  return source.length
}

/**
 * Index just past the template literal opened at `start`, including any
 * `${...}` interpolation, which is itself scanned as a block.
 */
function skipTemplateLiteral(source: string, start: number): number {
  let index = start + 1

  while (index < source.length) {
    const char = source[index]
    if (char === "\\") {
      index += 2
      continue
    }
    if (char === "`") return index + 1
    if (char === "$" && source[index + 1] === "{") {
      index = findBlockEnd(source, index + 1) + 1
      continue
    }
    index += 1
  }

  return source.length
}

/**
 * Index of the `]` closing the block opened at `openIndex`. Strings, template
 * literals and comments are skipped, so brackets inside review text cannot end
 * the array early: a review is free to mention `];`.
 */
function findBlockEnd(source: string, openIndex: number): number {
  let depth = 0
  let index = openIndex

  while (index < source.length) {
    const char = source[index]

    if (char === "/" && source[index + 1] === "/") {
      const lineEnd = source.indexOf("\n", index)
      if (lineEnd === -1) break
      index = lineEnd + 1
      continue
    }

    if (char === "/" && source[index + 1] === "*") {
      const commentEnd = source.indexOf("*/", index + 2)
      if (commentEnd === -1) break
      index = commentEnd + 2
      continue
    }

    if (char === '"' || char === "'") {
      index = skipQuoted(source, index)
      continue
    }

    if (char === "`") {
      index = skipTemplateLiteral(source, index)
      continue
    }

    if (char === "[" || char === "(" || char === "{") {
      depth += 1
      index += 1
      continue
    }

    if (char === "]" || char === ")" || char === "}") {
      depth -= 1
      if (depth === 0) return index
      index += 1
      continue
    }

    index += 1
  }

  throw new Error(`${ARRAY_DECLARATION} is unterminated in ${GOOGLE_REVIEWS_PATH}`)
}

/**
 * Bounds of the `GOOGLE_REVIEWS` array literal. The opening bracket is taken
 * from after the assignment, so the `[]` in the `DormComment[]` type annotation
 * is not mistaken for the array itself.
 */
function locateDatasetArray(source: string): { open: number; close: number } {
  const declaration = source.indexOf(ARRAY_DECLARATION)
  const assignment =
    declaration === -1 ? -1 : source.indexOf("=", declaration + ARRAY_DECLARATION.length)
  const open = assignment === -1 ? -1 : source.indexOf("[", assignment)

  if (open === -1) {
    throw new Error(`${ARRAY_DECLARATION} is missing from ${GOOGLE_REVIEWS_PATH}`)
  }

  return { open, close: findBlockEnd(source, open) }
}

/**
 * Adds `reviews` after the last existing entry, keeping the dataset's header and
 * everything already collected. Writes nothing when there is nothing to add, so
 * an empty scrape cannot clear the file.
 */
export function appendReviews(reviews: GeneratedReview[]): number {
  if (reviews.length === 0) return 0

  const source = readFileSync(GOOGLE_REVIEWS_PATH, "utf8")
  const { close } = locateDatasetArray(source)

  const head = source.slice(0, close).trimEnd()
  const tail = source.slice(close)
  const separator = head.endsWith(",") || head.endsWith("[") ? "" : ","

  writeFileSync(
    GOOGLE_REVIEWS_PATH,
    `${head}${separator}\n${renderEntries(reviews)}\n${tail}`,
    "utf8",
  )
  return reviews.length
}

/**
 * Swaps the array body for `reviews` while keeping the header, so a rerun cannot
 * regress the import or the `generateComment` signature. Writes nothing when
 * there is nothing to write.
 */
export function replaceReviews(reviews: GeneratedReview[]): number {
  if (reviews.length === 0) return 0

  const source = readFileSync(GOOGLE_REVIEWS_PATH, "utf8")
  const { open, close } = locateDatasetArray(source)

  writeFileSync(
    GOOGLE_REVIEWS_PATH,
    `${source.slice(0, open + 1)}\n${renderEntries(reviews)}\n${source.slice(close)}`,
    "utf8",
  )
  return reviews.length
}
