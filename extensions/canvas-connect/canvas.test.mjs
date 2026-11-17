// node --test extensions/canvas-connect/canvas.test.mjs
import assert from "node:assert/strict"
import test from "node:test"

import {
  CanvasSignInRequired,
  buildDigest,
  currentTermCourses,
  htmlToText,
  parseCanvasJson,
  readCurrentTerm,
} from "./canvas.js"

const NOW = new Date("2026-10-14T17:00:00Z")

test("parseCanvasJson strips the anti-XSSI prefix", () => {
  assert.deepEqual(parseCanvasJson('while(1);{"id":1}'), { id: 1 })
  assert.deepEqual(parseCanvasJson('{"id":2}'), { id: 2 })
})

test("htmlToText keeps line breaks and decodes entities once", () => {
  assert.equal(
    htmlToText("<p>Week&nbsp;8</p><p>Q &amp;amp; A &lt;3</p><script>x()</script>"),
    "Week 8\nQ &amp; A <3",
  )
})

test("currentTermCourses keeps only the most recently started term", () => {
  const courses = currentTermCourses([
    {
      id: 1,
      name: "MATH 444",
      course_code: "MATH 444",
      term: { start_at: "2026-08-24T00:00:00Z" },
    },
    { id: 2, name: "Old", term: { start_at: "2026-01-20T00:00:00Z" } },
    { id: 3, name: "Sandbox", term: null },
    {
      id: 4,
      name: "Locked",
      access_restricted_by_date: true,
      term: { start_at: "2026-08-24T00:00:00Z" },
    },
  ])
  assert.deepEqual(courses, [{ courseId: 1, name: "MATH 444", courseCode: "MATH 444" }])
})

test("buildDigest puts upcoming exams first and leaves out far-off work", () => {
  const digest = buildDigest({
    course: { courseId: 1, name: "Probability", courseCode: "STAT 410" },
    now: NOW,
    syllabus: "<p>Week 8: moment generating functions</p>",
    assignments: [
      { name: "Midterm 2", due_at: "2026-10-20T15:00:00Z", submission_types: ["online_quiz"] },
      { name: "HW 7", due_at: "2026-10-10T15:00:00Z", description: "<p>MGFs</p>" },
      { name: "Final", due_at: "2026-12-15T15:00:00Z" },
    ],
    announcements: [
      { title: "Exam scope", posted_at: "2026-10-12T00:00:00Z", message: "Chapters 4-5" },
    ],
    events: [],
    modules: [{ name: "Week 8", items: [{ title: "Lecture 15" }] }],
    pages: [{ title: "Lecture 15", body: "<h2>MGF</h2><p>M(t) = E[e^{tX}]</p>" }],
  })
  assert.match(digest, /2026-10-20 Midterm 2 \[quiz\/exam\]/)
  assert.match(digest, /Recently due[\s\S]*HW 7: MGFs/)
  assert.doesNotMatch(digest, /Final/)
  assert.match(digest, /Exam scope: Chapters 4-5/)
  assert.match(digest, /Lecture page: Lecture 15\nMGF\nM\(t\)/)
})

test("readCurrentTerm reads course by course and skips sections Canvas refuses", async () => {
  const seen = []
  const fetchJson = async (path) => {
    seen.push(path)
    if (path === "/api/v1/users/self")
      return { ok: true, status: 200, data: { short_name: "Michael" } }
    if (path.startsWith("/api/v1/courses?")) {
      return {
        ok: true,
        status: 200,
        data: [
          { id: 9, name: "FSHN 220", course_code: "FSHN 220", term: { start_at: "2026-08-24" } },
        ],
      }
    }
    if (path.includes("/modules")) return { ok: false, status: 403 }
    if (path.includes("/assignments")) return { ok: true, status: 200, data: [] }
    if (path.startsWith("/api/v1/courses/9?"))
      return { ok: true, status: 200, data: { syllabus_body: "<p>Nutrition</p>" } }
    return { ok: true, status: 200, data: [] }
  }
  const term = await readCurrentTerm(fetchJson, { now: NOW })
  assert.equal(term.canvasUser, "Michael")
  assert.equal(term.courses.length, 1)
  assert.equal(term.courses[0].courseId, 9)
  assert.match(term.courses[0].digest, /Syllabus \(excerpt\)\nNutrition/)
  assert.ok(seen.every((path) => path.startsWith("/api/v1/")))
})

test("readCurrentTerm reports a signed-out browser as CanvasSignInRequired", async () => {
  await assert.rejects(
    readCurrentTerm(async () => ({ ok: false, status: 401 }), { now: NOW }),
    CanvasSignInRequired,
  )
})
