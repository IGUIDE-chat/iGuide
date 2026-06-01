import { fillPromptTemplate, joinPromptSections } from "./promptComposition.ts"
import languageDefaultInstruction from "./prompts/language-default.md"
import languageEnInstruction from "./prompts/language-en.md"
import languageZhInstruction from "./prompts/language-zh.md"
import memoryExtractionInstructions from "./prompts/memory-extraction.md"
import systemPromptTemplate from "./prompts/system.md"

const MEMORY_EXTRACTION_INSTRUCTIONS = memoryExtractionInstructions.trim()
const SYSTEM_PROMPT_TEMPLATE = systemPromptTemplate.trim()

// Default to configured website language. Do not auto-switch based on input language.
// Only switch on explicit user request.
function buildLanguageInstruction(lang?: string): string {
  if (lang === "zh") {
    return languageZhInstruction.trim()
  }

  if (lang === "en") {
    return languageEnInstruction.trim()
  }

  return languageDefaultInstruction.trim()
}

export function buildSystemPrompt(options: {
  userMemory?: string
  lang?: string
}): string {
  const userContext = options.userMemory?.trim()

  return joinPromptSections([
    fillPromptTemplate(SYSTEM_PROMPT_TEMPLATE, {
      languageInstruction: buildLanguageInstruction(options.lang),
    }),
    userContext ? `## User Context\n${userContext}` : "",
    MEMORY_EXTRACTION_INSTRUCTIONS,
  ])
}
