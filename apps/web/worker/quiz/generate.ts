/**
 * Question generation on DeepSeek. One call per daily quiz covers every course
 * that has a digest, so a quiz costs one inference request however many courses
 * the student takes.
 */

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions"
const GENERATION_TIMEOUT_MS = 120_000

export interface CourseContext {
  courseId: number
  courseName: string
  digest: string
  questionCount: number
}

export interface GeneratedQuestion {
  courseId: number
  courseName: string
  topic: string
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

export type QuizLanguage = "en" | "zh"

export class GenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GenerationError"
  }
}

export function buildPrompt(input: {
  courses: CourseContext[]
  today: string
  language: QuizLanguage
  recentQuestions: string[]
}): { system: string; user: string } {
  const explanationLanguage = input.language === "zh" ? "Simplified Chinese" : "English"
  const system = [
    "You write daily practice quizzes for a University of Illinois Urbana-Champaign student.",
    "Each course below comes with a digest of its Canvas site: upcoming assignments and exams, announcements, the modules that are open now, lecture page excerpts and the syllabus.",
    "First work out where each course is right now: what was taught this week, and what the next exam or quiz will cover. Then write questions on exactly that material, leaning toward content the next exam will test.",
    "Rules:",
    "- Multiple choice, exactly 4 options, exactly one correct.",
    "- Test understanding (apply, compare, compute, predict), not trivia about the course logistics, due dates or grading.",
    "- Distractors must be plausible mistakes a student would make.",
    "- Write the question and options in the course's own language (normally English), so they match the real exam.",
    `- Write the explanation in ${explanationLanguage}: why the answer is right and why the most tempting wrong option is wrong, in 1-3 sentences.`,
    "- topic is a short label (2-6 words) for the concept tested.",
    "- Do not repeat or lightly reword any of the recent questions listed.",
    'Answer with JSON only: {"questions":[{"course_id":number,"topic":string,"question":string,"options":[string,string,string,string],"answer_index":0-3,"explanation":string}]}',
  ].join("\n")

  const courses = input.courses
    .map(
      (course) =>
        `### course_id ${course.courseId} — write ${course.questionCount} questions\n${course.digest}`,
    )
    .join("\n\n")
  const recent = input.recentQuestions.length
    ? `\n\nRecent questions (do not repeat):\n${input.recentQuestions.map((q) => `- ${q}`).join("\n")}`
    : ""

  return { system, user: `Today is ${input.today}.\n\n${courses}${recent}` }
}

/**
 * Keeps only well-formed questions for known courses, and shuffles each
 * question's options so the correct answer's position carries no signal.
 */
export function normalizeQuestions(
  raw: unknown,
  courses: CourseContext[],
  random: () => number = Math.random,
): GeneratedQuestion[] {
  const list = (raw as { questions?: unknown } | null)?.questions
  if (!Array.isArray(list)) return []
  const names = new Map(courses.map((course) => [course.courseId, course.courseName]))

  const questions: GeneratedQuestion[] = []
  for (const item of list) {
    const candidate = item as Record<string, unknown>
    const courseId = Number(candidate.course_id)
    const options = candidate.options
    const answerIndex = Number(candidate.answer_index)
    if (!names.has(courseId)) continue
    if (typeof candidate.question !== "string" || !candidate.question.trim()) continue
    if (!Array.isArray(options) || options.length !== 4) continue
    if (!options.every((option) => typeof option === "string" && option.trim())) continue
    if (new Set(options.map((option) => (option as string).trim())).size !== 4) continue
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) continue

    const order = shuffle([0, 1, 2, 3], random)
    questions.push({
      courseId,
      courseName: names.get(courseId) as string,
      topic:
        typeof candidate.topic === "string" && candidate.topic.trim()
          ? candidate.topic.trim()
          : "General",
      question: candidate.question.trim(),
      options: order.map((index) => (options[index] as string).trim()),
      answerIndex: order.indexOf(answerIndex),
      explanation: typeof candidate.explanation === "string" ? candidate.explanation.trim() : "",
    })
  }
  return questions
}

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

export async function generateQuestions(input: {
  apiKey: string | undefined
  courses: CourseContext[]
  today: string
  language: QuizLanguage
  recentQuestions: string[]
  fetch?: FetchLike
}): Promise<GeneratedQuestion[]> {
  if (!input.apiKey) throw new GenerationError("DEEPSEEK_API_KEY is not configured")
  const fetchImpl = input.fetch ?? ((url, init) => fetch(url, init))
  const prompt = buildPrompt(input)

  const response = await fetchImpl(DEEPSEEK_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${input.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.7,
      max_tokens: 6000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
    }),
    signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
  })
  if (!response.ok) throw new GenerationError(`DeepSeek answered ${response.status}`)

  const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const content = body.choices?.[0]?.message?.content
  if (!content) throw new GenerationError("DeepSeek returned no content")

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new GenerationError("DeepSeek returned invalid JSON")
  }
  const questions = normalizeQuestions(parsed, input.courses)
  if (!questions.length) throw new GenerationError("DeepSeek returned no usable questions")
  return questions
}
