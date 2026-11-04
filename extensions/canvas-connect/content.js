// Bridge between the iGuide page and the extension. Runs only on iguide.chat
// (and the local dev server). The page posts a sync request; this relays it to
// the service worker and posts the course digests back to the same page.

const VERSION = chrome.runtime.getManifest().version
document.documentElement.dataset.iguideCanvasConnect = VERSION

window.addEventListener("message", (event) => {
  if (event.source !== window || event.origin !== window.location.origin) return
  const data = event.data
  if (data?.type !== "IGUIDE_CANVAS_SYNC_REQUEST" || typeof data.requestId !== "string") return

  chrome.runtime.sendMessage(
    { type: "sync", interactive: Boolean(data.interactive) },
    (response) => {
      const result = chrome.runtime.lastError
        ? { status: "ERROR", message: chrome.runtime.lastError.message }
        : response
      window.postMessage(
        { type: "IGUIDE_CANVAS_SYNC_RESULT", requestId: data.requestId, result },
        window.location.origin,
      )
    },
  )
})
