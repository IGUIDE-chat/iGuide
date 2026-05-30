const DOMAIN_KEYWORDS = {
  course: [
    "course",
    "class",
    "prerequisite",
    "syllabus",
    "cs ",
    "ece ",
    "math ",
    "credit",
    "professor",
    "instructor",
    "enrollment",
    "registration",
    "curriculum",
    "major",
    "minor",
    "degree",
    "elective",
  ],
  housing: [
    "dorm",
    "housing",
    "residence hall",
    "room",
    "amenit",
    "lease",
    "dining hall",
    "meal plan",
    "cafeteria",
    "residential",
  ],
  location: [
    "map",
    "location",
    "where is",
    "directions",
    "building",
    "office",
    "address",
    "open",
    "hours",
    "close",
    "parking",
    "transportation",
  ],
  calendar: [
    "calendar",
    "deadline",
    "semester",
    "fall 2025",
    "spring",
    "add drop",
    "registration date",
    "holiday",
    "exam schedule",
    "break",
    "tuition due",
  ],
  student_life: [
    "orientation",
    "student org",
    "club",
    "dining",
    "food",
    "cpt",
    "opt",
    "international student",
    "health service",
    "counseling",
    "career fair",
    "tutoring",
    "wellness",
    "gym",
    "recreation",
  ],
}

interface Source {
  source_key: string
  name: string
  content_domain: string
  default_retrieval_policy: string
  freshness_class: string
}

function detectDomain(message: string): string | null {
  const normalized = message.toLowerCase()
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return domain
    }
  }
  return null
}

function buildGuidance(sources: Source[]): string {
  if (sources.length === 0) {
    return ""
  }

  const lines: string[] = []
  for (const source of sources) {
    const policyDesc = getPolicyDescription(source.default_retrieval_policy)
    lines.push(
      `The ${source.name} source (${source.source_key}) has policy: ${source.default_retrieval_policy} and freshness: ${source.freshness_class}. ${policyDesc}`
    )
  }
  return lines.join("\n")
}

function getPolicyDescription(policy: string): string {
  switch (policy) {
    case "local_first": {
      return "Prefer the knowledge base (search_knowledge_base) for this domain; only use web search as fallback."
    }
    case "live_first": {
      return "Prefer live web search (web_search) for this domain; local knowledge base may be stale."
    }
    case "local_with_live_verify": {
      return "Use the knowledge base first, then verify with web search."
    }
    case "archive_only": {
      return "Use only the knowledge base (search_knowledge_base); do NOT use web search for this domain."
    }
    default: {
      return ""
    }
  }
}

export async function analyzeFreshness(
  message: string,
  env: Record<string, string>
): Promise<string> {
  const domain = detectDomain(message)
  if (!domain) {
    return ""
  }

  const supabaseUrl = env.SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("Supabase credentials not configured for freshness routing")
    return ""
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/sources?content_domain=eq.${domain}&is_active=eq.true&school_id=eq.uiuc&select=*`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    )

    if (!response.ok) {
      console.warn(`Supabase sources query failed: ${response.status}`)
      return ""
    }

    const sources = (await response.json()) as Source[]
    return buildGuidance(sources)
  } catch (error) {
    console.warn("Freshness routing query failed:", error)
    return ""
  }
}
