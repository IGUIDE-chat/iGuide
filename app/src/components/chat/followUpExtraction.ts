/**
 * @file ./src/components/chat/followUpExtraction.ts
 * @description Extracts follow-up questions from AI chat responses.
 * Ported verbatim from useChatSession.ts lines 298-325.
 */

/**
 * Extracts follow-up questions from a chat response text.
 *
 * Looks for a Chinese "💡 你可能还想了解：" header followed by bullet-point
 * questions. Returns the extracted questions or null if no header is found.
 */
export function extractFollowUps(text: string): string[] | null {
  const followUpHeaderMatch = text.match(/\n+.*💡.*[你您]可能还想.*[:：\n]/)

  if (!followUpHeaderMatch) {
    return null
  }

  const splitIndex = followUpHeaderMatch.index ?? 0
  const followUpText = text.slice(splitIndex + followUpHeaderMatch[0].length)

  const questions = followUpText
    .split("\n")
    .map((line) =>
      line
        .replace(/^[>\s\d.*[\]-]+/, "")
        .replace(/\]?$/, "")
        .trim()
    )
    .filter((line) => line.length > 0 && line.length < 150)

  return questions.length > 0 ? questions : null
}
