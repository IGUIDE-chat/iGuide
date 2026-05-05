#!/usr/bin/env npx tsx

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

const EXPECTED_DIMENSION = 384;
let hasErrors = false;

function error(message: string): void {
  console.error(`❌ ERROR: ${message}`);
  hasErrors = true;
}

function success(message: string): void {
  console.log(`✅ ${message}`);
}

function checkWranglerJsonc(): void {
  const path = join(projectRoot, "api/wrangler.jsonc");
  try {
    const content = readFileSync(path, "utf-8");
    const match = content.match(/"EMBEDDING_DIMENSIONS"\s*:\s*"(\d+)"/);
    if (!match) {
      error(`api/wrangler.jsonc: EMBEDDING_DIMENSIONS not found`);
      return;
    }
    const dimensions = parseInt(match[1], 10);
    if (dimensions !== EXPECTED_DIMENSION) {
      error(
        `api/wrangler.jsonc: EMBEDDING_DIMENSIONS=${dimensions}, expected ${EXPECTED_DIMENSION}`
      );
      return;
    }
    success(
      `api/wrangler.jsonc: EMBEDDING_DIMENSIONS=${dimensions}`
    );
  } catch (e) {
    error(`api/wrangler.jsonc: Failed to read - ${e}`);
  }
}

function checkEmbeddingConfig(): void {
  const path = join(projectRoot, "api/src/lib/embedding-config.ts");
  try {
    const content = readFileSync(path, "utf-8");
    const match = content.match(
      /DEFAULT_EMBEDDING_DIMENSIONS\s*=\s*(\d+)/
    );
    if (!match) {
      error(`api/src/lib/embedding-config.ts: DEFAULT_EMBEDDING_DIMENSIONS not found`);
      return;
    }
    const dimensions = parseInt(match[1], 10);
    if (dimensions !== EXPECTED_DIMENSION) {
      error(
        `api/src/lib/embedding-config.ts: DEFAULT_EMBEDDING_DIMENSIONS=${dimensions}, expected ${EXPECTED_DIMENSION}`
      );
      return;
    }
    success(
      `api/src/lib/embedding-config.ts: DEFAULT_EMBEDDING_DIMENSIONS=${dimensions}`
    );
  } catch (e) {
    error(`api/src/lib/embedding-config.ts: Failed to read - ${e}`);
  }
}

function checkMigrationFiles(): void {
  const migrationsDir = join(projectRoot, "supabase/migrations");
  try {
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
    let foundVector = false;

    for (const file of files) {
      const path = join(migrationsDir, file);
      const content = readFileSync(path, "utf-8");

      const vectorRegex = /vector\s*\(\s*(\d+)\s*\)/g;
      let match: RegExpExecArray | null;

      while ((match = vectorRegex.exec(content)) !== null) {
        foundVector = true;
        const dimensions = parseInt(match[1], 10);
        if (dimensions !== EXPECTED_DIMENSION) {
          error(
            `${file}: vector(${dimensions}) found, expected vector(${EXPECTED_DIMENSION})`
          );
        } else {
          success(`${file}: vector(${dimensions})`);
        }
      }
    }

    if (!foundVector) {
      error("No vector columns found in migration files");
    }
  } catch (e) {
    error(`supabase/migrations: Failed to read - ${e}`);
  }
}

function main(): void {
  console.log(
    `🔍 Validating embedding dimensions (expected: ${EXPECTED_DIMENSION})\n`
  );

  checkWranglerJsonc();
  checkEmbeddingConfig();
  checkMigrationFiles();

  console.log("");
  if (hasErrors) {
    console.error(
      "❌ Validation FAILED: Embedding dimensions are not consistent!"
    );
    process.exit(1);
  } else {
    console.log(
      `✅ Validation PASSED: All embedding dimensions are ${EXPECTED_DIMENSION}`
    );
    process.exit(0);
  }
}

main();
