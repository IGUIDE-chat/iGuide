/**
 * @file ./src/components/chat/memoryTagExtraction.ts
 * @description Pure utility for extracting memory tags from LLM response text.
 * No service calls — callers are responsible for persisting extracted values.
 */

export interface MemoryTags {
  userSoul?: string
  userMemory?: string
  convMemory?: string
}

export function extractMemoryTags(
  text: string
): MemoryTags & { cleaned: string } {
  let userSoul: string | undefined
  let userMemory: string | undefined
  let convMemory: string | undefined
  let cleaned = text

  try {
    const userSoulMatch = text.match(/<user_soul>([\s\S]*?)<\/user_soul>/)
    const userMemoryMatch = text.match(/<user_memory>([\s\S]*?)<\/user_memory>/)
    const convMemoryMatch = text.match(/<conv_memory>([\s\S]*?)<\/conv_memory>/)

    if (userSoulMatch) {
      userSoul = userSoulMatch[1].trim()
    }
    if (userMemoryMatch) {
      userMemory = userMemoryMatch[1].trim()
    }
    if (convMemoryMatch) {
      convMemory = convMemoryMatch[1].trim()
    }

    cleaned = cleaned
      .replaceAll(/<user_soul>[\s\S]*?<\/user_soul>/g, "")
      .replaceAll(/<user_memory>[\s\S]*?<\/user_memory>/g, "")
      .replaceAll(/<conv_memory>[\s\S]*?<\/conv_memory>/g, "")
      .trim()
  } catch {
    // Regex failed — return original text uncleaned
    cleaned = text
  }

  // Clean up unclosed/partial tags that would leak into visible text
  cleaned = cleaned
    .replaceAll(/<user_soul>[\s\S]*/g, "")
    .replaceAll(/<user_memory>[\s\S]*/g, "")
    .replaceAll(/<conv_memory>[\s\S]*/g, "")
    .trim()

  return { userSoul, userMemory, convMemory, cleaned }
}
