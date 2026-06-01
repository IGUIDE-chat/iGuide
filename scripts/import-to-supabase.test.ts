import { expect, test } from "vite-plus/test"

import {
  chunkText,
  cleanText,
  detectSourceKind,
  parseArgs,
} from "./import-to-supabase"

test("parseArgs requires source and supports dry-run and limit", () => {
  expect(() => parseArgs([])).toThrow(/--source/)

  expect(
    parseArgs([
      "--source",
      "data_collection/raw_crawl.jsonl",
      "--dry-run",
      "--limit",
      "5",
    ])
  ).toEqual({
    source: "data_collection/raw_crawl.jsonl",
    dryRun: true,
    limit: 5,
  })
})

test("cleanText strips html and normalizes whitespace", () => {
  const input =
    "<h1>Hello</h1>\n<p>World&nbsp;&amp;&nbsp;UIUC</p>\n\n<div>Line   two</div>"

  expect(cleanText(input)).toBe("Hello World & UIUC Line two")
})

test("chunkText uses overlap between adjacent chunks", () => {
  const text = "A".repeat(2000) + "B".repeat(2000) + "C".repeat(200)
  const chunks = chunkText(text, 2000, 200)

  expect(chunks.length).toBe(3)
  expect(chunks[0].length).toBe(2000)
  expect(chunks[1].slice(0, 200)).toBe(chunks[0].slice(-200))
  expect(chunks[2].slice(0, 200)).toBe(chunks[1].slice(-200))
})

test("detectSourceKind prefers jsonl files in directories", () => {
  expect(detectSourceKind("/tmp/raw_crawl.jsonl", false)).toBe("jsonl")
  expect(detectSourceKind("/tmp/uiuc_knowledge_base", true)).toBe("directory")
  expect(detectSourceKind("/tmp/doc.md", false)).toBe("markdown")
})
