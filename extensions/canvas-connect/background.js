// Service worker for iGuide Canvas Connect.
//
// The iGuide /quiz page asks (through content.js) for a sync. This worker reads
// the student's current Canvas term with the browser's own Canvas session and
// hands back plain-text course digests; the page uploads them with its own
// iGuide sign-in. No cookie or password is read, stored, or sent anywhere: the
// extension never touches the cookies API, and Canvas sign-in happens on
// Canvas's own pages in a normal tab.

import { CANVAS_ORIGIN, CanvasSignInRequired, parseCanvasJson, readCurrentTerm } from "./canvas.js"

const ALLOWED_PAGE_ORIGINS = new Set(["https://iguide.chat", "http://localhost:5173"])
const SIGN_IN_TIMEOUT_MS = 10 * 60 * 1000

async function backgroundFetch(path) {
  try {
    const response = await fetch(CANVAS_ORIGIN + path, {
      credentials: "include",
      headers: { Accept: "application/json" },
    })
    const text = await response.text()
    if (!response.ok) return { ok: false, status: response.status }
    try {
      return { ok: true, status: response.status, data: parseCanvasJson(text) }
    } catch {
      // An HTML page instead of JSON means Canvas bounced us to its sign-in page.
      return { ok: false, status: 401 }
    }
  } catch {
    return { ok: false, status: 0 }
  }
}

/** Runs the request inside a Canvas tab, so it is exactly what Canvas's own web app sends. */
function tabFetcher(tabId) {
  return async (path) => {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      args: [path],
      func: async (relativePath) => {
        try {
          const response = await fetch(relativePath, {
            credentials: "include",
            headers: { Accept: "application/json" },
          })
          return { ok: response.ok, status: response.status, text: await response.text() }
        } catch {
          return { ok: false, status: 0, text: "" }
        }
      },
    })
    const result = injection?.result
    if (!result?.ok) return { ok: false, status: result?.status ?? 0 }
    try {
      return { ok: true, status: result.status, data: parseCanvasJson(result.text) }
    } catch {
      return { ok: false, status: 401 }
    }
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function isSignedInUrl(url) {
  try {
    const parsed = new URL(url)
    return parsed.origin === CANVAS_ORIGIN && !parsed.pathname.startsWith("/login")
  } catch {
    return false
  }
}

/**
 * Opens Canvas in a normal tab so the student signs in on Canvas's and the
 * university's own pages (NetID + Duo), then waits until Canvas answers as them.
 */
async function signInThroughTab() {
  const tab = await chrome.tabs.create({ url: `${CANVAS_ORIGIN}/`, active: true })
  const deadline = Date.now() + SIGN_IN_TIMEOUT_MS
  while (Date.now() < deadline) {
    await sleep(2000)
    let current
    try {
      current = await chrome.tabs.get(tab.id)
    } catch {
      throw new Error("CANCELLED")
    }
    if (current.status === "complete" && isSignedInUrl(current.url)) {
      const probe = await tabFetcher(tab.id)("/api/v1/users/self")
      if (probe.ok) return tab.id
    }
  }
  throw new Error("TIMEOUT")
}

async function sync({ interactive }) {
  // Each extension API call resets the service worker's idle timer, so a long
  // sync is not cut off halfway.
  const keepAlive = setInterval(() => chrome.runtime.getPlatformInfo(), 20000)
  let openedTabId = null
  try {
    let fetchJson = backgroundFetch
    const probe = await backgroundFetch("/api/v1/users/self")
    if (!probe.ok) {
      if (!interactive) return { status: "NEEDS_SIGN_IN" }
      openedTabId = await signInThroughTab()
      const retry = await backgroundFetch("/api/v1/users/self")
      if (!retry.ok) fetchJson = tabFetcher(openedTabId)
    }
    const term = await readCurrentTerm(fetchJson)
    return { status: "OK", ...term }
  } catch (error) {
    if (error instanceof CanvasSignInRequired) return { status: "NEEDS_SIGN_IN" }
    if (error?.message === "CANCELLED" || error?.message === "TIMEOUT") {
      return { status: error.message }
    }
    return { status: "ERROR", message: String(error?.message || error) }
  } finally {
    clearInterval(keepAlive)
    if (openedTabId !== null) chrome.tabs.remove(openedTabId).catch(() => {})
  }
}

let inFlight = null

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !ALLOWED_PAGE_ORIGINS.has(sender.origin)) return false
  if (message?.type !== "sync") return false
  inFlight ??= sync({ interactive: Boolean(message.interactive) }).finally(() => {
    inFlight = null
  })
  inFlight.then(sendResponse)
  return true
})
