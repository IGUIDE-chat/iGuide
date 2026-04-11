import test from "node:test";
import assert from "node:assert/strict";

import {
	chunkText,
	cleanText,
	detectSourceKind,
	parseArgs,
} from "./import-to-supabase";

test("parseArgs requires source and supports dry-run and limit", () => {
	assert.throws(() => parseArgs([]), /--source/);

	assert.deepEqual(
		parseArgs([
			"--source",
			"data_collection/raw_crawl.jsonl",
			"--dry-run",
			"--limit",
			"5",
		]),
		{
			source: "data_collection/raw_crawl.jsonl",
			dryRun: true,
			limit: 5,
		},
	);
});

test("cleanText strips html and normalizes whitespace", () => {
	const input =
		"<h1>Hello</h1>\n<p>World&nbsp;&amp;&nbsp;UIUC</p>\n\n<div>Line   two</div>";

	assert.equal(cleanText(input), "Hello World & UIUC Line two");
});

test("chunkText uses overlap between adjacent chunks", () => {
	const text = "A".repeat(2000) + "B".repeat(2000) + "C".repeat(200);
	const chunks = chunkText(text, 2000, 200);

	assert.equal(chunks.length, 3);
	assert.equal(chunks[0].length, 2000);
	assert.equal(chunks[1].slice(0, 200), chunks[0].slice(-200));
	assert.equal(chunks[2].slice(0, 200), chunks[1].slice(-200));
});

test("detectSourceKind prefers jsonl files in directories", () => {
	assert.equal(detectSourceKind("/tmp/raw_crawl.jsonl", false), "jsonl");
	assert.equal(detectSourceKind("/tmp/uiuc_knowledge_base", true), "directory");
	assert.equal(detectSourceKind("/tmp/doc.md", false), "markdown");
});
