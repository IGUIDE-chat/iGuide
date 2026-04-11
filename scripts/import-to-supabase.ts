import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_EMBEDDING_MODEL = "multilingual-e5-small";
const DEFAULT_EMBEDDING_DIMENSIONS = 384;
const EMBEDDING_BATCH_SIZE = 32;
const DEFAULT_CHUNK_SIZE = 2000;
const DEFAULT_CHUNK_OVERLAP = 200;
const PROGRESS_INTERVAL = 10;

type SourceKind = "jsonl" | "markdown" | "directory";

interface CliOptions {
	source: string;
	dryRun: boolean;
	limit?: number;
}

interface SourceDocument {
	url: string;
	title: string;
	content: string;
	source: string;
	category: string | null;
	metadata: Record<string, unknown>;
}

interface DocumentRecord {
	id: string;
	url: string | null;
}

interface DocumentPayload {
	title: string;
	content: string;
	url: string;
	source: string;
	category: string | null;
	embedding: number[] | null;
	metadata: Record<string, unknown>;
	indexed_at: string;
}

interface ChunkPayload {
	document_id: string;
	chunk_index: number;
	content: string;
	embedding: number[] | null;
}

interface ImportStats {
	total_documents: number;
	total_chunks: number;
	new: number;
	updated: number;
	skipped: number;
}

interface RuntimeEnv {
	supabaseUrl?: string;
	supabaseServiceKey?: string;
	embeddingApiBaseUrl?: string;
	embeddingApiKey?: string;
	embeddingModel: string;
	embeddingDimensions: number;
}

interface ParsedMarkdown {
	frontmatter: Record<string, string>;
	body: string;
}

export function parseArgs(argv: string[]): CliOptions {
	let source = "";
	let dryRun = false;
	let limit: number | undefined;

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];

		if (arg === "--source") {
			source = argv[index + 1] ?? "";
			index += 1;
			continue;
		}

		if (arg === "--dry-run") {
			dryRun = true;
			continue;
		}

		if (arg === "--limit") {
			const rawLimit = argv[index + 1] ?? "";
			const parsed = Number.parseInt(rawLimit, 10);
			if (!Number.isFinite(parsed) || parsed <= 0) {
				throw new Error("--limit must be a positive integer");
			}
			limit = parsed;
			index += 1;
			continue;
		}

		throw new Error(`Unknown argument: ${arg}`);
	}

	if (!source) {
		throw new Error("Missing required --source <path> argument");
	}

	return { source, dryRun, limit };
}

export function cleanText(input: string): string {
	return decodeHtmlEntities(input)
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/\r\n/g, "\n")
		.replace(/\s+/g, " ")
		.trim();
}

export function chunkText(
	text: string,
	chunkSize = DEFAULT_CHUNK_SIZE,
	overlap = DEFAULT_CHUNK_OVERLAP,
): string[] {
	if (!text) {
		return [];
	}

	if (text.length <= chunkSize) {
		return [text];
	}

	const chunks: string[] = [];
	let start = 0;

	while (start < text.length) {
		const end = Math.min(start + chunkSize, text.length);
		const chunk = text.slice(start, end).trim();
		if (chunk) {
			chunks.push(chunk);
		}
		if (end >= text.length) {
			break;
		}
		start = Math.max(0, end - overlap);
	}

	return chunks;
}

export function detectSourceKind(
	sourcePath: string,
	isDirectory: boolean,
): SourceKind {
	if (isDirectory) {
		return "directory";
	}

	if (sourcePath.endsWith(".jsonl")) {
		return "jsonl";
	}

	if (sourcePath.endsWith(".md") || sourcePath.endsWith(".markdown")) {
		return "markdown";
	}

	throw new Error(`Unsupported source path: ${sourcePath}`);
}

function decodeHtmlEntities(input: string): string {
	const entityMap: Record<string, string> = {
		"&nbsp;": " ",
		"&amp;": "&",
		"&lt;": "<",
		"&gt;": ">",
		"&quot;": '"',
		"&#39;": "'",
	};

	return input.replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, (match) => {
		return entityMap[match] ?? match;
	});
}

function getEnv(): RuntimeEnv {
	const embeddingDimensions = Number.parseInt(
		process.env.EMBEDDING_DIMENSIONS || String(DEFAULT_EMBEDDING_DIMENSIONS),
		10,
	);

	return {
		supabaseUrl: process.env.SUPABASE_URL,
		supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
		embeddingApiBaseUrl: process.env.EMBEDDING_API_BASE_URL,
		embeddingApiKey: process.env.EMBEDDING_API_KEY,
		embeddingModel: process.env.EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
		embeddingDimensions:
			Number.isFinite(embeddingDimensions) && embeddingDimensions > 0
				? embeddingDimensions
				: DEFAULT_EMBEDDING_DIMENSIONS,
	};
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const env = getEnv();
	const documents = await loadSourceDocuments(options.source, options.limit);

	if (!options.dryRun) {
		requireEnv(env);
	}

	const stats: ImportStats = {
		total_documents: 0,
		total_chunks: 0,
		new: 0,
		updated: 0,
		skipped: 0,
	};

	const supabaseClient = new SupabaseRestClient(env);
	const embeddingClient = new EmbeddingApiClient(env);

	for (const [index, sourceDocument] of documents.entries()) {
		const prepared = prepareDocument(sourceDocument);

		if (!prepared) {
			stats.skipped += 1;
			continue;
		}

		const { document, chunks } = prepared;

		if (options.dryRun) {
			stats.total_documents += 1;
			stats.total_chunks += chunks.length;
			stats.new += 1;
		} else {
			const [documentEmbedding] = await embeddingClient.embedDocuments([
				document.content,
			]);
			const chunkEmbeddings = await embeddingClient.embedDocuments(chunks);

			const outcome = await upsertDocumentGraph(
				supabaseClient,
				document,
				documentEmbedding ?? null,
				chunks,
				chunkEmbeddings,
			);

			stats.total_documents += 1;
			stats.total_chunks += chunks.length;
			if (outcome === "new") {
				stats.new += 1;
			} else {
				stats.updated += 1;
			}
		}

		const processedCount = index + 1;
		if (processedCount % PROGRESS_INTERVAL === 0) {
			console.log(
				JSON.stringify({
					progress_documents: processedCount,
					total_documents: stats.total_documents,
					total_chunks: stats.total_chunks,
					dry_run: options.dryRun,
				}),
			);
		}
	}

	console.log(JSON.stringify(stats, null, 2));
}

function requireEnv(env: RuntimeEnv) {
	const missing = [
		["SUPABASE_URL", env.supabaseUrl],
		["SUPABASE_SERVICE_KEY", env.supabaseServiceKey],
		["EMBEDDING_API_BASE_URL", env.embeddingApiBaseUrl],
		["EMBEDDING_API_KEY", env.embeddingApiKey],
	]
		.filter((entry) => !entry[1])
		.map((entry) => entry[0]);

	if (missing.length > 0) {
		throw new Error(`Missing required env vars: ${missing.join(", ")}`);
	}
}

function prepareDocument(sourceDocument: SourceDocument) {
	const cleanedTitle = cleanText(sourceDocument.title);
	const cleanedContent = cleanText(sourceDocument.content);

	if (!sourceDocument.url || !cleanedContent) {
		return null;
	}

	const chunks = chunkText(cleanedContent);
	if (chunks.length === 0) {
		return null;
	}

	const document: DocumentPayload = {
		title: cleanedTitle || sourceDocument.url,
		content: cleanedContent,
		url: sourceDocument.url,
		source: sourceDocument.source,
		category: sourceDocument.category,
		embedding: null,
		metadata: sourceDocument.metadata,
		indexed_at: new Date().toISOString(),
	};

	return { document, chunks };
}

async function upsertDocumentGraph(
	supabaseClient: SupabaseRestClient,
	document: DocumentPayload,
	documentEmbedding: number[] | null,
	chunks: string[],
	chunkEmbeddings: number[][],
): Promise<"new" | "updated"> {
	const existing = await supabaseClient.findDocumentByUrl(document.url);
	const payload = {
		...document,
		embedding: documentEmbedding,
	};

	const documentRecord = existing
		? await supabaseClient.updateDocument(existing.id, payload)
		: await supabaseClient.insertDocument(payload);

	await supabaseClient.deleteChunksForDocument(documentRecord.id);

	const chunkPayloads: ChunkPayload[] = chunks.map((content, index) => ({
		document_id: documentRecord.id,
		chunk_index: index,
		content,
		embedding: chunkEmbeddings[index] ?? null,
	}));

	await supabaseClient.insertChunks(chunkPayloads);
	return existing ? "updated" : "new";
}

async function loadSourceDocuments(
	source: string,
	limit?: number,
): Promise<SourceDocument[]> {
	const absoluteSource = path.resolve(source);
	const stats = await fs.stat(absoluteSource);
	const sourceKind = detectSourceKind(absoluteSource, stats.isDirectory());

	let documents: SourceDocument[];

	if (sourceKind === "jsonl") {
		documents = await loadJsonlDocuments(absoluteSource);
	} else if (sourceKind === "markdown") {
		documents = [await loadMarkdownDocument(absoluteSource)];
	} else {
		documents = await loadDirectoryDocuments(absoluteSource);
	}

	return typeof limit === "number" ? documents.slice(0, limit) : documents;
}

async function loadDirectoryDocuments(directoryPath: string) {
	const files = await walkDirectory(directoryPath);
	const jsonlFiles = files.filter((filePath) => filePath.endsWith(".jsonl"));

	if (jsonlFiles.length > 0) {
		const prioritized = jsonlFiles.sort((left, right) => {
			if (path.basename(left) === "raw_crawl.jsonl") {
				return -1;
			}
			if (path.basename(right) === "raw_crawl.jsonl") {
				return 1;
			}
			return left.localeCompare(right);
		});

		return loadJsonlDocuments(prioritized[0]);
	}

	const markdownFiles = files.filter(
		(filePath) => filePath.endsWith(".md") || filePath.endsWith(".markdown"),
	);

	if (markdownFiles.length === 0) {
		throw new Error(`No supported source files found in ${directoryPath}`);
	}

	return Promise.all(
		markdownFiles.map((filePath) => loadMarkdownDocument(filePath)),
	);
}

async function walkDirectory(directoryPath: string): Promise<string[]> {
	const entries = await fs.readdir(directoryPath, { withFileTypes: true });
	const filePaths = await Promise.all(
		entries.map(async (entry) => {
			const resolvedPath = path.join(directoryPath, entry.name);
			if (entry.isDirectory()) {
				return walkDirectory(resolvedPath);
			}
			return [resolvedPath];
		}),
	);

	return filePaths.flat();
}

async function loadJsonlDocuments(filePath: string): Promise<SourceDocument[]> {
	const contents = await fs.readFile(filePath, "utf8");
	const lines = contents
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);

	return lines.map((line, index) => {
		let parsed: Record<string, unknown>;
		try {
			parsed = JSON.parse(line) as Record<string, unknown>;
		} catch (error) {
			throw new Error(
				`Invalid JSONL at ${filePath}:${index + 1}: ${String(error)}`,
			);
		}

		return {
			url: asString(parsed.url),
			title: asString(parsed.title),
			content: asString(parsed.content),
			source: filePath,
			category: nullableString(parsed.category),
			metadata: {
				source_type: "jsonl",
				links: Array.isArray(parsed.links) ? parsed.links : [],
				timestamp: parsed.timestamp ?? null,
			},
		};
	});
}

async function loadMarkdownDocument(filePath: string): Promise<SourceDocument> {
	const contents = await fs.readFile(filePath, "utf8");
	const parsed = parseMarkdown(contents);
	const relativeSource = filePath;

	return {
		url: parsed.frontmatter.url || "",
		title:
			parsed.frontmatter.title ||
			findMarkdownHeading(parsed.body) ||
			path.basename(filePath, path.extname(filePath)),
		content: parsed.body,
		source: relativeSource,
		category: parsed.frontmatter.category || null,
		metadata: {
			source_type: "markdown",
			...parsed.frontmatter,
		},
	};
}

function parseMarkdown(contents: string): ParsedMarkdown {
	if (!contents.startsWith("---\n")) {
		return { frontmatter: {}, body: contents };
	}

	const closingIndex = contents.indexOf("\n---\n", 4);
	if (closingIndex === -1) {
		return { frontmatter: {}, body: contents };
	}

	const frontmatterBlock = contents.slice(4, closingIndex);
	const body = contents.slice(closingIndex + 5);
	const frontmatter: Record<string, string> = {};

	for (const line of frontmatterBlock.split(/\r?\n/)) {
		const separatorIndex = line.indexOf(":");
		if (separatorIndex === -1) {
			continue;
		}

		const key = line.slice(0, separatorIndex).trim();
		const rawValue = line.slice(separatorIndex + 1).trim();
		frontmatter[key] = unquoteYamlValue(rawValue);
	}

	return { frontmatter, body };
}

function unquoteYamlValue(value: string): string {
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}

	return value;
}

function findMarkdownHeading(contents: string): string | null {
	const match = contents.match(/^#\s+(.+)$/m);
	return match?.[1]?.trim() || null;
}

function asString(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function nullableString(value: unknown): string | null {
	return typeof value === "string" && value.trim() ? value : null;
}

class EmbeddingApiClient {
	constructor(private readonly env: RuntimeEnv) {}

	async embedDocuments(texts: string[]): Promise<number[][]> {
		const results: number[][] = [];

		for (let index = 0; index < texts.length; index += EMBEDDING_BATCH_SIZE) {
			const batch = texts.slice(index, index + EMBEDDING_BATCH_SIZE);
			if (batch.length === 0) {
				continue;
			}

			const response = await fetch(
				`${this.env.embeddingApiBaseUrl?.replace(/\/+$/, "")}/v1/embeddings`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${this.env.embeddingApiKey}`,
					},
					body: JSON.stringify({
						model: this.env.embeddingModel,
						input: batch.map((text) => `passage: ${text}`),
					}),
				},
			);

			if (!response.ok) {
				throw new Error(
					`Embedding API returned ${response.status}: ${await response.text()}`,
				);
			}

			const payload = (await response.json()) as {
				data?: Array<{ embedding?: number[] }>;
			};

			const embeddings = (payload.data || []).map(
				(item) => item.embedding || [],
			);
			if (embeddings.length !== batch.length) {
				throw new Error(
					`Embedding API returned ${embeddings.length} embeddings for ${batch.length} inputs`,
				);
			}

			for (const embedding of embeddings) {
				if (embedding.length !== this.env.embeddingDimensions) {
					throw new Error(
						`Embedding dimensions mismatch: expected ${this.env.embeddingDimensions}, received ${embedding.length}`,
					);
				}
			}

			results.push(...embeddings);
		}

		return results;
	}
}

class SupabaseRestClient {
	constructor(private readonly env: RuntimeEnv) {}

	async findDocumentByUrl(url: string): Promise<DocumentRecord | null> {
		const response = await this.request(
			`/documents?select=id,url&url=eq.${encodeURIComponent(url)}&limit=1`,
		);
		const rows = (await response.json()) as DocumentRecord[];
		return rows[0] ?? null;
	}

	async insertDocument(payload: DocumentPayload): Promise<DocumentRecord> {
		const response = await this.request("/documents", {
			method: "POST",
			headers: {
				Prefer: "return=representation",
			},
			body: JSON.stringify(payload),
		});
		const rows = (await response.json()) as DocumentRecord[];
		if (!rows[0]) {
			throw new Error("Supabase did not return inserted document row");
		}
		return rows[0];
	}

	async updateDocument(
		id: string,
		payload: DocumentPayload,
	): Promise<DocumentRecord> {
		const response = await this.request(`/documents?id=eq.${id}`, {
			method: "PATCH",
			headers: {
				Prefer: "return=representation",
			},
			body: JSON.stringify(payload),
		});
		const rows = (await response.json()) as DocumentRecord[];
		if (!rows[0]) {
			throw new Error(`Supabase did not return updated document row for ${id}`);
		}
		return rows[0];
	}

	async deleteChunksForDocument(documentId: string): Promise<void> {
		await this.request(`/document_chunks?document_id=eq.${documentId}`, {
			method: "DELETE",
		});
	}

	async insertChunks(payload: ChunkPayload[]): Promise<void> {
		if (payload.length === 0) {
			return;
		}

		await this.request("/document_chunks", {
			method: "POST",
			headers: {
				Prefer: "return=minimal",
			},
			body: JSON.stringify(payload),
		});
	}

	private async request(
		relativePath: string,
		init?: RequestInit,
	): Promise<Response> {
		const response = await fetch(
			`${this.env.supabaseUrl?.replace(/\/+$/, "")}/rest/v1${relativePath}`,
			{
				...init,
				headers: {
					apikey: this.env.supabaseServiceKey || "",
					Authorization: `Bearer ${this.env.supabaseServiceKey || ""}`,
					"Content-Type": "application/json",
					...(init?.headers || {}),
				},
			},
		);

		if (!response.ok) {
			throw new Error(
				`Supabase request failed (${response.status}) ${relativePath}: ${await response.text()}`,
			);
		}

		return response;
	}
}

function isExecutedDirectly() {
	const entryPath = process.argv[1];
	if (!entryPath) {
		return false;
	}

	return (
		path.resolve(entryPath) === path.resolve(new URL(import.meta.url).pathname)
	);
}

if (isExecutedDirectly()) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	});
}
