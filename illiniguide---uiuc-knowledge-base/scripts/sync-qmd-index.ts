/**
 * @file scripts/sync-qmd-index.ts
 * @description Syncs QMD index when Supabase dorm data changes.
 *
 * 1. Runs generate-qmd-markdown.ts to regenerate .md files from Supabase
 * 2. Calls `qmd update` to re-index changed files
 * 3. Calls `qmd embed` to update vector embeddings for new/changed docs
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx scripts/sync-qmd-index.ts
 *
 * Can be triggered by:
 *   - Supabase webhook (POST to a small endpoint that runs this script)
 *   - Cron job on VPS
 *   - Manual after admin edits
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const QMD_CONTENT = path.resolve(PROJECT_ROOT, '../qmd-content');

function run(cmd: string, cwd?: string) {
    console.log(`\n$ ${cmd}`);
    execSync(cmd, { stdio: 'inherit', cwd: cwd ?? PROJECT_ROOT });
}

async function main() {
    console.log('🔄 Step 1: Regenerate Markdown from Supabase...');
    run('npx tsx scripts/generate-qmd-markdown.ts');

    console.log('\n🔄 Step 2: Re-index changed files...');
    run('npx @tobilu/qmd update', QMD_CONTENT);

    console.log('\n🔄 Step 3: Update vector embeddings...');
    run('npx @tobilu/qmd embed', QMD_CONTENT);

    console.log('\n✅ QMD index sync complete!');
}

main().catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
});
