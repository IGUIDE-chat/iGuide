/**
 * @file ./src/utils/housingUtils.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { Dorm } from "../components/housing/types/index";

/**
 * Checks if a given text fragment is a dorm name or a significant part of one.
 * Used for selective highlighting in chat.
 */
export const isDormMention = (text: string, dorms: Dorm[] = []): boolean => {
  if (!text || text.length < 2) return false;

  const lowerText = text.toLowerCase().trim();

  return dorms.some((dorm) => {
    const dormName = dorm.name.toLowerCase();
    // Check for full name match (e.g., "Allen Hall")
    if (dormName.includes(lowerText)) return true;

    // Check for ID match (e.g., "isr", "par")
    if (dorm.id.toLowerCase() === lowerText) return true;

    // Check for known abbreviations or variations if they exist in name
    // e.g. "ISR" is in "Illinois Street Residence (ISR)"
    if (lowerText.length > 2 && dormName.includes(`(${lowerText})`))
      return true;

    return false;
  });
};

/**
 * Helper to find dorms mentioned in a longer text block.
 * Used for showing dorm cards.
 */
export const findMentionedDorms = (text: string, dorms: Dorm[] = []) => {
  const lowerText = text.toLowerCase();
  return dorms.filter(
    (dorm) =>
      lowerText.includes(dorm.name.toLowerCase()) ||
      dorm.name
        .toLowerCase()
        .split(" ")
        .some((part) => part.length > 3 && lowerText.includes(part))
  );
};
