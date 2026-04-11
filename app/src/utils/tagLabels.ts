/**
 * @file ./src/utils/tagLabels.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [UTILITY] Tag label i18n and hero tag selection utilities.
// [工具] 标签国际化和 Hero 标签选择工具。
import { Language } from "../types";
import {
  DormCategorizedTags,
  DormTag,
} from "../components/housing/types/index";
import {
  getTagDisplay,
  TAG_REGISTRY,
} from "../components/housing/constants/metadata";

// ── Legacy tag map (kept for backward compat during migration) ──────────────

const TAG_ZH_MAP: Record<string, string> = {
  Engineering: "工程学院",
  Renovated: "已翻新",
  Modern: "现代",
  STEM: "STEM",
  Social: "社交活跃",
  Popular: "热门",
  Diverse: "多元",
  Quiet: "安静",
  Historic: "历史建筑",
  Artsy: "艺术氛围",
  Affordable: "经济实惠",
  Freshmen: "新生友好",
  "Late Night Dining": "深夜食堂",
  "Bus Routes": "公交便利",
  "Trellis Dining": "Trellis 餐厅",
  "South Campus": "南校区",
  "No AC": "无空调",
  "Private Bath": "独立卫浴",
  "Communal Single-Use Bath": "公共单人卫浴",
  Singles: "单人间",
  Graduate: "研究生",
  Upperclassmen: "高年级生",
  "Transfer Cluster": "转学生聚集",
  "Ike South": "Ike 南区",
  "Ike North": "Ike 北区",
  "Small Community": "小型社区",
  "Unit One": "Unit One",
  Music: "音乐",
  "Female-Identified": "女性宿舍",
  Elevator: "电梯",
  Laundry: "洗衣房",
  "Study Rooms": "自习室",
  Kitchen: "厨房",
  Parking: "停车位",
  "Gym Nearby": "健身房附近",
  Pool: "泳池",
  "Gender-Inclusive": "性别包容",
  "Computer Lab": "电脑房",
  Library: "图书室",
  "Music Rooms": "音乐房",
  "Quiet Floors": "安静楼层",
  "Substance-Free": "无烟无酒",
  "Near Main Quad": "近 Main Quad",
  "Near Engineering": "近工程学院",
  "Near Business": "近商学院",
  "Near ARC/CRCE": "近 ARC/CRCE",
  "Near Green Street": "近 Green Street",
  "Near Ikenberry Dining": "近 Ike 食堂",
  "Engineering LLC": "工程 LLC",
  "Innovation LLC": "创新 LLC",
  "LEADS LLC": "LEADS LLC",
  "Focus LLC": "Focus LLC",
  "Exploration LLC": "Exploration LLC",
  "Sustainability LLC": "可持续 LLC",
  "Scholars LLC": "Scholars LLC",
  "Wohlers LLC": "Wohlers LLC",
  "Intersections LLC": "Intersections LLC",
  Furnished: "带家具",
  Apartment: "公寓型",
  "Suite Style": "套房型",
  Premium: "高端",
};

export const KNOWN_TAGS: string[] = Object.keys(TAG_ZH_MAP).sort();

/** Legacy: Return the localised label for an old-style string tag. */
export function getTagLabel(tag: string, language: Language): string {
  if (language === "zh") {
    return TAG_ZH_MAP[tag] ?? tag;
  }
  return tag;
}

// ── New categorized tag utilities ───────────────────────────────────────────

/** Collect all tags from categorized tags, sorted by priority (ascending = more important first). */
export function getAllTagsSorted(
  categorizedTags: DormCategorizedTags
): DormTag[] {
  const all: DormTag[] = [
    ...(categorizedTags.livingConditions ?? []),
    ...(categorizedTags.facilities ?? []),
    ...(categorizedTags.lifestyle ?? []),
  ];
  return all
    .filter((tag) => Object.prototype.hasOwnProperty.call(TAG_REGISTRY, tag))
    .sort((a, b) => {
      const pa = TAG_REGISTRY[a]?.priority ?? 99;
      const pb = TAG_REGISTRY[b]?.priority ?? 99;
      return pa - pb;
    });
}

export interface CardTagItem {
  id: string;
  label: string;
  layer: "secondary" | "vibe";
  tone: "positive" | "neutral" | "muted";
}

function getCardTagDisplay(
  tag: DormTag,
  categorizedTags: DormCategorizedTags,
  language: Language
): string {
  if (tag === "llc" && categorizedTags.llcNames?.length) {
    const llcName = categorizedTags.llcNames[0];
    if (language === "en") {
      return llcName.replace(/\s+(LLC|Community)$/i, "");
    }
    return llcName;
  }

  return getTagDisplay(tag, language);
}

export function getDetailTagDisplay(
  tag: DormTag,
  categorizedTags: DormCategorizedTags,
  language: Language
): string {
  if (tag === "llc") {
    const llcNames = categorizedTags.llcNames ?? [];
    if (llcNames.length === 1) {
      return llcNames[0];
    }
    if (llcNames.length > 1) {
      return language === "zh" ? "多个 LLC" : "Multiple LLCs";
    }
  }

  return getTagDisplay(tag, language);
}

export function getCardTagCandidates(
  categorizedTags: DormCategorizedTags,
  language: Language
): CardTagItem[] {
  const rankedTags = getAllTagsSorted(categorizedTags)
    .filter((tag) => TAG_REGISTRY[tag]?.cardLayer !== "hidden")
    .sort((a, b) => {
      const toneWeight = (tag: DormTag) => {
        switch (TAG_REGISTRY[tag]?.cardTone) {
          case "muted":
            return 0;
          case "neutral":
            return 1;
          case "positive":
            return 2;
          default:
            return 3;
        }
      };
      const toneA = toneWeight(a);
      const toneB = toneWeight(b);
      if (toneA !== toneB) {
        return toneA - toneB;
      }

      const layerA = TAG_REGISTRY[a]?.cardLayer === "secondary" ? 0 : 1;
      const layerB = TAG_REGISTRY[b]?.cardLayer === "secondary" ? 0 : 1;
      if (layerA !== layerB) {
        return layerA - layerB;
      }

      const priorityA = TAG_REGISTRY[a]?.cardPriority ?? 99;
      const priorityB = TAG_REGISTRY[b]?.cardPriority ?? 99;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return (
        (TAG_REGISTRY[a]?.priority ?? 99) - (TAG_REGISTRY[b]?.priority ?? 99)
      );
    });

  const seenLabels = new Set<string>();
  const items: CardTagItem[] = [];

  for (const tag of rankedTags) {
    const label = getCardTagDisplay(tag, categorizedTags, language);
    if (seenLabels.has(label)) {
      continue;
    }

    seenLabels.add(label);
    items.push({
      id:
        tag === "llc" && categorizedTags.llcNames?.length
          ? `llc:${categorizedTags.llcNames[0]}`
          : tag,
      label,
      layer:
        TAG_REGISTRY[tag]?.cardLayer === "secondary" ? "secondary" : "vibe",
      tone: TAG_REGISTRY[tag]?.cardTone ?? "neutral",
    });
  }

  return items;
}

export function getCardTagItems(
  categorizedTags: DormCategorizedTags,
  language: Language,
  maxCount = 4
): { items: CardTagItem[]; overflowCount: number } {
  const items = getCardTagCandidates(categorizedTags, language);

  return {
    items: items.slice(0, maxCount),
    overflowCount: Math.max(items.length - maxCount, 0),
  };
}

/**
 * Get hero tags: priority-sorted, capped at maxCount.
 * Tags with priority >= 7 (too common, like Laundry/Kitchen) are excluded.
 */
export function getHeroTags(
  categorizedTags: DormCategorizedTags,
  maxCount = 8
): DormTag[] {
  const HERO_PRIORITY_CUTOFF = 7;
  return getAllTagsSorted(categorizedTags)
    .filter((tag) => (TAG_REGISTRY[tag]?.priority ?? 99) < HERO_PRIORITY_CUTOFF)
    .slice(0, maxCount);
}
