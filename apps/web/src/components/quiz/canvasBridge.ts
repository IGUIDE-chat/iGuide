import type { CourseDigestUpload } from "../../services/quizApi"

/**
 * Talks to the iGuide Canvas Connect extension (`extensions/canvas-connect`).
 * The extension reads Canvas with the browser's own Canvas session and answers
 * with plain-text course digests; no Canvas credential ever reaches this page.
 */

export type CanvasSyncResult =
  | { status: "OK"; canvasUser: string; courses: CourseDigestUpload[]; syncedAt: string }
  | { status: "NEEDS_SIGN_IN" | "CANCELLED" | "TIMEOUT" }
  | { status: "ERROR"; message: string }

/** The installed extension version, or null when it is not installed. */
export function canvasExtensionVersion(): string | null {
  return document.documentElement.dataset.iguideCanvasConnect ?? null
}

/**
 * Asks the extension for a sync. `interactive` lets it open a Canvas tab for
 * the student to sign in; a background refresh passes false and gets
 * `NEEDS_SIGN_IN` instead.
 */
export function syncCanvas(interactive: boolean): Promise<CanvasSyncResult> {
  const requestId = crypto.randomUUID()
  return new Promise((resolve) => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return
      const data = event.data as { type?: string; requestId?: string; result?: CanvasSyncResult }
      if (data?.type !== "IGUIDE_CANVAS_SYNC_RESULT" || data.requestId !== requestId) return
      window.removeEventListener("message", onMessage)
      resolve(data.result ?? { status: "ERROR", message: "Empty response from the extension" })
    }
    window.addEventListener("message", onMessage)
    window.postMessage(
      { type: "IGUIDE_CANVAS_SYNC_REQUEST", requestId, interactive },
      window.location.origin,
    )
  })
}
