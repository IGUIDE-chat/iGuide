const CONVERSATIONAL_PATTERNS = [
  /^(?:hi|hello|hey|yo|sup|howdy)$/,
  /^(?:hi|hello|hey)\s+(?:there|illiniguid[e]?|assistant|bot)$/,
  /^(?:good\s+)?(?:morning|afternoon|evening)$/,
  /^(?:thanks|thank\s+you|thx|ty|appreciate\s+it)$/,
  /^(?:ok|okay|k|cool|great|nice|got\s+it|sounds\s+good)$/,
  /^(?:bye|goodbye|see\s+you|see\s+ya)$/,
  /^(?:how\s+are\s+you|how'?s\s+it\s+going|what'?s\s+up)$/,
  /^(?:你好|您好|嗨|哈喽|谢谢|谢了|好的|好|嗯|哦|再见)$/,
]

function normalizeTurn(message: string): string {
  return message
    .normalize('NFKC')
    .toLowerCase()
    .replaceAll(/[\s\u3000]+/g, ' ')
    .trim()
    .replaceAll(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, '')
    .trim()
}

export function shouldEnableRetrievalTools(message: string): boolean {
  const normalized = normalizeTurn(message)
  if (!normalized) {
    return false
  }

  if (CONVERSATIONAL_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return false
  }

  return true
}
