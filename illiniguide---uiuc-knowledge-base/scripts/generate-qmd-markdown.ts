/**
 * @file scripts/generate-qmd-markdown.ts
 * @description Generates Markdown files for QMD indexing from Supabase dorms + local articles.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx scripts/generate-qmd-markdown.ts
 *
 * Output directories (relative to repo root):
 *   ../qmd-content/dorms/         English dorm files
 *   ../qmd-content/dorms-zh/      Chinese dorm files
 *   ../qmd-content/articles/      English article files
 *   ../qmd-content/articles-zh/   Chinese article files
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// -- articles (local TS files) --
import { ARTICLES } from '../src/data/articles/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_ROOT = path.resolve(__dirname, '../../qmd-content');

// ── Supabase client ──────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ──────────────────────────────────────────────────────

function ensureDir(dir: string) {
    fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath: string, content: string) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✓ ${path.relative(CONTENT_ROOT, filePath)}`);
}

/** Escape YAML string values that may contain special chars. */
function yamlStr(v: unknown): string {
    if (v == null) return '""';
    const s = String(v);
    if (/[:\[\]{}&*?|>!%#@`,]/.test(s) || s.includes('\n')) {
        return JSON.stringify(s);
    }
    return s;
}

function yamlArr(arr: unknown[] | undefined | null): string {
    if (!arr || arr.length === 0) return '[]';
    return `[${arr.map(v => yamlStr(v)).join(', ')}]`;
}

// ── Dorm → Markdown ──────────────────────────────────────────────

interface DormRow {
    id: string;
    name: string;
    name_zh?: string;
    description?: string;
    description_zh?: string;
    price?: number;
    price_range?: string;
    location?: string;
    location_zh?: string;
    housing_type?: string;
    ac?: boolean;
    dining?: string;
    dining_nearby_detail?: string;
    bathroom_type?: string;
    lat?: number;
    lng?: number;
    address?: string;
    address_zh?: string;
    website?: string;
    tags?: string[];
    categorized_tags?: { livingConditions?: string[]; facilities?: string[]; lifestyle?: string[] };
    room_types?: string[];
    room_options?: Array<{ type?: string; bedCount?: number; bathCount?: number; price?: number; sqft?: number }>;
    floor_plans?: Array<{ type?: string; officialName?: string; bedCount?: number; bathroomCount?: number; price?: number; sqft?: number; bedSize?: string; description?: string }>;
    pros?: string[];
    pros_zh?: string[];
    cons?: string[];
    cons_zh?: string[];
    application_fee?: number;
}

function dormToMarkdownEn(d: DormRow): string {
    const fm = [
        '---',
        `id: ${d.id}`,
        `type: dorm`,
        `name: ${yamlStr(d.name)}`,
        `housingType: ${d.housing_type ?? 'URH'}`,
        `location: ${yamlStr(d.location)}`,
        `price: ${d.price ?? 0}`,
        `priceRange: ${yamlStr(d.price_range)}`,
        `ac: ${d.ac ?? false}`,
        `dining: ${d.dining ?? 'none'}`,
        `bathroomType: ${d.bathroom_type ?? 'communal'}`,
        `lat: ${d.lat ?? 0}`,
        `lng: ${d.lng ?? 0}`,
        `tags: ${yamlArr(d.tags)}`,
        '---',
    ].join('\n');

    const sections: string[] = [];

    // Title
    sections.push(`# ${d.name}`);

    // Overview
    if (d.description) {
        sections.push(`## Overview\n\n${d.description}`);
    }

    // Location
    const locParts: string[] = [];
    if (d.location) locParts.push(`Area: ${d.location}`);
    if (d.address) locParts.push(`Address: ${d.address}`);
    if (d.lat && d.lng) locParts.push(`Coordinates: ${d.lat}, ${d.lng}`);
    if (locParts.length) sections.push(`## Location\n\n${locParts.join('\n')}`);

    // Amenities
    const amenities: string[] = [];
    amenities.push(`- Air Conditioning: ${d.ac ? 'Yes' : 'No'}`);
    amenities.push(`- Dining: ${d.dining === 'inside' ? 'On-site dining hall' : d.dining === 'nearby' ? `Nearby${d.dining_nearby_detail ? ` (${d.dining_nearby_detail})` : ''}` : 'None'}`);
    amenities.push(`- Bathroom: ${d.bathroom_type ?? 'communal'}`);
    amenities.push(`- Housing Type: ${d.housing_type ?? 'URH'}`);
    sections.push(`## Amenities\n\n${amenities.join('\n')}`);

    // Tags / Features
    const ct = d.categorized_tags;
    if (ct) {
        const tagLines: string[] = [];
        if (ct.livingConditions?.length) tagLines.push(`- Living Conditions: ${ct.livingConditions.join(', ')}`);
        if (ct.facilities?.length) tagLines.push(`- Facilities: ${ct.facilities.join(', ')}`);
        if (ct.lifestyle?.length) tagLines.push(`- Lifestyle: ${ct.lifestyle.join(', ')}`);
        if (tagLines.length) sections.push(`## Features\n\n${tagLines.join('\n')}`);
    }

    // Room Types & Pricing
    if (d.floor_plans?.length) {
        const rows = d.floor_plans.map(fp => {
            const parts: string[] = [];
            if (fp.officialName || fp.type) parts.push(`**${fp.officialName || fp.type}**`);
            if (fp.bedCount) parts.push(`${fp.bedCount} bed(s)`);
            if (fp.sqft) parts.push(`${fp.sqft} sqft`);
            if (fp.price) parts.push(`$${fp.price.toLocaleString()}/year`);
            if (fp.bedSize) parts.push(`Bed: ${fp.bedSize}`);
            return `- ${parts.join(' | ')}`;
        });
        sections.push(`## Room Types & Pricing\n\n${rows.join('\n')}`);
    } else if (d.room_types?.length) {
        sections.push(`## Room Types\n\n${d.room_types.map(rt => `- ${rt}`).join('\n')}`);
    }

    // Pricing
    if (d.price) {
        const priceSection = [`- Annual Price: $${d.price.toLocaleString()}`];
        if (d.price_range) priceSection.push(`- Price Range: ${d.price_range}`);
        if (d.application_fee) priceSection.push(`- Application Fee: $${d.application_fee}`);
        sections.push(`## Pricing\n\n${priceSection.join('\n')}`);
    }

    // Pros & Cons
    if (d.pros?.length) {
        sections.push(`## Pros\n\n${d.pros.map(p => `- ${p}`).join('\n')}`);
    }
    if (d.cons?.length) {
        sections.push(`## Cons\n\n${d.cons.map(c => `- ${c}`).join('\n')}`);
    }

    // Website
    if (d.website) {
        sections.push(`## More Info\n\n[Official Website](${d.website})`);
    }

    return `${fm}\n\n${sections.join('\n\n')}\n`;
}

function dormToMarkdownZh(d: DormRow): string {
    const fm = [
        '---',
        `id: ${d.id}`,
        `type: dorm`,
        `name: ${yamlStr(d.name_zh || d.name)}`,
        `housingType: ${d.housing_type ?? 'URH'}`,
        `location: ${yamlStr(d.location_zh || d.location)}`,
        `price: ${d.price ?? 0}`,
        `priceRange: ${yamlStr(d.price_range)}`,
        `lang: zh`,
        '---',
    ].join('\n');

    const sections: string[] = [];
    sections.push(`# ${d.name_zh || d.name}`);

    if (d.description_zh || d.description) {
        sections.push(`## 概述\n\n${d.description_zh || d.description}`);
    }

    const locParts: string[] = [];
    if (d.location_zh || d.location) locParts.push(`区域: ${d.location_zh || d.location}`);
    if (d.address_zh || d.address) locParts.push(`地址: ${d.address_zh || d.address}`);
    if (locParts.length) sections.push(`## 位置\n\n${locParts.join('\n')}`);

    const amenities: string[] = [];
    amenities.push(`- 空调: ${d.ac ? '有' : '无'}`);
    amenities.push(`- 餐饮: ${d.dining === 'inside' ? '楼内食堂' : d.dining === 'nearby' ? '附近食堂' : '无'}`);
    amenities.push(`- 卫浴: ${d.bathroom_type ?? '公共'}`);
    sections.push(`## 设施\n\n${amenities.join('\n')}`);

    if (d.floor_plans?.length) {
        const rows = d.floor_plans.map(fp => {
            const parts: string[] = [];
            if (fp.officialName || fp.type) parts.push(`**${fp.officialName || fp.type}**`);
            if (fp.price) parts.push(`$${fp.price.toLocaleString()}/年`);
            if (fp.sqft) parts.push(`${fp.sqft} 平方英尺`);
            return `- ${parts.join(' | ')}`;
        });
        sections.push(`## 房型与价格\n\n${rows.join('\n')}`);
    }

    if (d.pros_zh?.length) {
        sections.push(`## 优点\n\n${d.pros_zh.map(p => `- ${p}`).join('\n')}`);
    }
    if (d.cons_zh?.length) {
        sections.push(`## 缺点\n\n${d.cons_zh.map(c => `- ${c}`).join('\n')}`);
    }

    return `${fm}\n\n${sections.join('\n\n')}\n`;
}

// ── Article → Markdown ───────────────────────────────────────────

function articleToMarkdownEn(a: typeof ARTICLES[number]): string {
    const fm = [
        '---',
        `id: ${a.id}`,
        `type: article`,
        `category: ${a.category}`,
        `tags: ${yamlArr(a.tags)}`,
        `lastUpdated: ${a.lastUpdated}`,
        '---',
    ].join('\n');

    return `${fm}\n\n# ${a.title}\n\n${a.summary}\n\n${a.content.trim()}\n`;
}

function articleToMarkdownZh(a: typeof ARTICLES[number]): string {
    if (!a.title_zh) return ''; // skip if no Chinese version

    const fm = [
        '---',
        `id: ${a.id}`,
        `type: article`,
        `category: ${a.category}`,
        `tags: ${yamlArr(a.tags_zh || a.tags)}`,
        `lang: zh`,
        '---',
    ].join('\n');

    return `${fm}\n\n# ${a.title_zh}\n\n${a.summary_zh || ''}\n\n${(a.content_zh || a.content).trim()}\n`;
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
    console.log('🔄 Fetching dorms from Supabase...');
    const { data: dorms, error } = await supabase.from('dorms').select('*');
    if (error) {
        console.error('Failed to fetch dorms:', error.message);
        process.exit(1);
    }
    console.log(`  Found ${dorms.length} dorms`);

    // Prepare output dirs
    const dirs = ['dorms', 'dorms-zh', 'articles', 'articles-zh'];
    for (const d of dirs) ensureDir(path.join(CONTENT_ROOT, d));

    // Generate dorm markdown
    console.log('\n📝 Generating dorm Markdown files...');
    for (const dorm of dorms as DormRow[]) {
        const enPath = path.join(CONTENT_ROOT, 'dorms', `${dorm.id}.md`);
        writeFile(enPath, dormToMarkdownEn(dorm));

        const zhPath = path.join(CONTENT_ROOT, 'dorms-zh', `${dorm.id}.md`);
        writeFile(zhPath, dormToMarkdownZh(dorm));
    }

    // Generate article markdown
    console.log('\n📝 Generating article Markdown files...');
    for (const article of ARTICLES) {
        const enPath = path.join(CONTENT_ROOT, 'articles', `${article.id}.md`);
        writeFile(enPath, articleToMarkdownEn(article));

        const zhMd = articleToMarkdownZh(article);
        if (zhMd) {
            const zhPath = path.join(CONTENT_ROOT, 'articles-zh', `${article.id}.md`);
            writeFile(zhPath, zhMd);
        }
    }

    console.log(`\n✅ Done! Content generated at: ${CONTENT_ROOT}`);
    console.log(`   dorms:       ${dorms.length} × 2 (en/zh)`);
    console.log(`   articles:    ${ARTICLES.length} (en) + zh variants`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
