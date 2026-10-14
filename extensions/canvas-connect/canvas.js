// Reads the student's current Canvas term and turns each course into a short
// plain-text digest for the daily quiz. Read-only: it only ever sends GET
// requests, one at a time with a short pause, the same rules canvas-sync keeps.
//
// `fetchJson(path)` is supplied by the caller and runs with the browser's own
// Canvas session; nothing here sees or handles a cookie.

export const CANVAS_ORIGIN = "https://canvas.illinois.edu"

const PAUSE_MS = 150
const MAX_DIGEST_CHARS = 12000
const DAY = 24 * 60 * 60 * 1000

export class CanvasSignInRequired extends Error {
  constructor() {
    super("Canvas sign-in required")
    this.name = "CanvasSignInRequired"
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Strips Canvas's anti-XSSI prefix. */
export function parseCanvasJson(text) {
  return JSON.parse(text.replace(/^while\(1\);/, ""))
}

export function htmlToText(html) {
  if (!html) return ""
  return String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim()
}

function clip(text, max) {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`
}

const dateOnly = (value) => (value ? String(value).slice(0, 10) : "no date")

/**
 * Courses of the most recently started term the student is active in, the
 * same "current term" rule canvas-sync uses. Courses without a term start
 * (sandboxes, org sites) are kept only when no term has a start date.
 */
export function currentTermCourses(courses) {
  const usable = courses.filter((course) => course.name && !course.access_restricted_by_date)
  const starts = usable
    .map((course) => course.term?.start_at)
    .filter(Boolean)
    .sort()
  const latest = starts.at(-1)
  const picked = latest ? usable.filter((course) => course.term?.start_at === latest) : usable
  return picked.map((course) => ({
    courseId: course.id,
    name: course.name,
    courseCode: course.course_code || null,
  }))
}

/** The open modules closest to now: unlocked ones, last three in course order. */
export function pickCurrentModules(modules, now) {
  const horizon = now.getTime() + 3 * DAY
  return modules
    .filter((module) => !module.unlock_at || new Date(module.unlock_at).getTime() <= horizon)
    .slice(-3)
}

export function buildDigest({
  course,
  now,
  syllabus,
  assignments,
  announcements,
  events,
  modules,
  pages,
}) {
  const dueWithin = (assignment, fromDays, toDays) => {
    if (!assignment.due_at) return false
    const offset = (new Date(assignment.due_at).getTime() - now.getTime()) / DAY
    return offset >= fromDays && offset <= toDays
  }
  const describe = (assignment) => {
    const kind =
      assignment.is_quiz_assignment || assignment.submission_types?.includes("online_quiz")
        ? " [quiz/exam]"
        : ""
    const detail = clip(htmlToText(assignment.description), 400)
    return `- ${dateOnly(assignment.due_at)} ${assignment.name || "Untitled"}${kind}${detail ? `: ${detail}` : ""}`
  }

  const sections = [
    `Course: ${course.courseCode ? `${course.courseCode} — ` : ""}${course.name}`,
    `Synced: ${now.toISOString().slice(0, 10)}`,
  ]

  const upcoming = assignments.filter((a) => dueWithin(a, 0, 21)).slice(0, 12)
  if (upcoming.length)
    sections.push("## Upcoming assignments and exams (next 3 weeks)", ...upcoming.map(describe))

  const recent = assignments.filter((a) => dueWithin(a, -7, 0)).slice(-8)
  if (recent.length) sections.push("## Recently due (last 7 days)", ...recent.map(describe))

  if (announcements.length) {
    sections.push(
      "## Recent announcements",
      ...announcements
        .slice(0, 6)
        .map(
          (item) =>
            `- ${dateOnly(item.posted_at)} ${item.title || ""}: ${clip(htmlToText(item.message), 600)}`,
        ),
    )
  }

  if (events.length) {
    sections.push(
      "## Calendar (this week and next)",
      ...events.slice(0, 12).map((event) => {
        const detail = event.description ? `: ${clip(htmlToText(event.description), 200)}` : ""
        return `- ${dateOnly(event.start_at)} ${event.title || ""}${detail}`
      }),
    )
  }

  if (modules.length) {
    sections.push(
      "## Current modules",
      ...modules.map((module) => {
        const items = (module.items || [])
          .map((item) => item.title)
          .filter(Boolean)
          .slice(0, 15)
          .join("; ")
        return `- ${module.name || "Module"}${items ? `: ${items}` : ""}`
      }),
    )
  }

  for (const page of pages) {
    const text = clip(htmlToText(page.body), 2500)
    if (text) sections.push(`## Lecture page: ${page.title || "Untitled"}`, text)
  }

  const syllabusText = clip(htmlToText(syllabus), 3500)
  if (syllabusText) sections.push("## Syllabus (excerpt)", syllabusText)

  return clip(sections.join("\n"), MAX_DIGEST_CHARS)
}

/**
 * Reads the current term and returns `{ canvasUser, courses, syncedAt }`.
 * `fetchJson(path)` resolves `{ ok, status, data }`. A 401 anywhere means the
 * browser is not signed in to Canvas; any other refusal skips that section,
 * since courses may hide modules or pages from students.
 */
export async function readCurrentTerm(fetchJson, { now = new Date(), onProgress = () => {} } = {}) {
  const get = async (path, { optional = true } = {}) => {
    await sleep(PAUSE_MS)
    const result = await fetchJson(path)
    if (result.status === 401) throw new CanvasSignInRequired()
    if (!result.ok) {
      if (optional) return null
      throw new Error(`Canvas ${path.split("?")[0]} answered ${result.status}`)
    }
    return result.data
  }
  const iso = (offsetDays) => new Date(now.getTime() + offsetDays * DAY).toISOString()

  const me = await get("/api/v1/users/self", { optional: false })
  const courses = currentTermCourses(
    await get("/api/v1/courses?enrollment_state=active&include[]=term&per_page=50", {
      optional: false,
    }),
  )

  const results = []
  for (const [index, course] of courses.entries()) {
    onProgress({ done: index, total: courses.length, course: course.courseCode || course.name })
    const id = course.courseId
    const detail = await get(`/api/v1/courses/${id}?include[]=syllabus_body`)
    const assignments = await get(`/api/v1/courses/${id}/assignments?order_by=due_at&per_page=100`)
    const announcements = await get(
      `/api/v1/announcements?context_codes[]=course_${id}&start_date=${iso(-14)}&end_date=${iso(1)}&per_page=10`,
    )
    const events = await get(
      `/api/v1/calendar_events?type=event&context_codes[]=course_${id}&start_date=${iso(-3)}&end_date=${iso(10)}&per_page=30`,
    )
    const modules = pickCurrentModules(
      (await get(`/api/v1/courses/${id}/modules?include[]=items&per_page=50`)) || [],
      now,
    )

    const pageUrls = modules
      .flatMap((module) => module.items || [])
      .filter((item) => item.type === "Page" && item.page_url)
      .map((item) => item.page_url)
      .slice(-2)
    const pages = []
    for (const url of pageUrls) {
      const page = await get(`/api/v1/courses/${id}/pages/${encodeURIComponent(url)}`)
      if (page) pages.push(page)
    }

    results.push({
      courseId: id,
      name: course.name,
      courseCode: course.courseCode,
      digest: buildDigest({
        course,
        now,
        syllabus: detail?.syllabus_body,
        assignments: assignments || [],
        announcements: announcements || [],
        events: events || [],
        modules,
        pages,
      }),
    })
  }
  onProgress({ done: courses.length, total: courses.length })

  return {
    canvasUser: me.short_name || me.name || "",
    courses: results,
    syncedAt: now.toISOString(),
  }
}
