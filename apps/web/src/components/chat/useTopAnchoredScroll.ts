import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

/** Gap kept above an anchored question when it is scrolled to the top. */
const TOP_GAP = 24
/** How far above the end of the messages the scroll button appears. */
const SCROLL_BUTTON_THRESHOLD = 80

interface UseTopAnchoredScrollOptions {
  /** Id of the newest user message. A new value starts a new turn. */
  anchorId: string | undefined
  /**
   * Whether a change of `anchorId` was a question sent just now. If so it is
   * scrolled to the top and the reply grows below it without being followed;
   * otherwise (a conversation loaded from history) the view jumps to the end.
   */
  anchorOnChange: boolean
}

/**
 * Scroll behaviour for the chat thread: a sent question moves to the top of
 * the viewport and the reply streams in below it, without auto-following.
 *
 * To make that position reachable while the reply is still short, a spacer
 * after the messages is sized to fill the rest of the viewport (the "slack").
 * The footer is sticky inside the viewport, so its height is subtracted.
 *
 * Expects `viewportRef` on the scroll container (positioned, so offsets are
 * relative to it), `contentRef` on the message list, `spacerRef` right after
 * the list, `footerRef` on the sticky footer, and `data-message-id` on each
 * message element.
 */
export function useTopAnchoredScroll({ anchorId, anchorOnChange }: UseTopAnchoredScrollOptions) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  // The question currently held at the top; null when nothing is anchored.
  const anchoredIdRef = useRef<string | null>(null)
  const previousAnchorIdRef = useRef<string | undefined>(undefined)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const visibleHeight = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return 0
    return viewport.clientHeight - (footerRef.current?.offsetHeight ?? 0)
  }, [])

  const contentEnd = useCallback(() => {
    const content = contentRef.current
    return content ? content.offsetTop + content.offsetHeight : 0
  }, [])

  const updateSlack = useCallback(() => {
    const content = contentRef.current
    const spacer = spacerRef.current
    if (!content || !spacer) return

    const anchoredId = anchoredIdRef.current
    const anchor = anchoredId
      ? content.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(anchoredId)}"]`)
      : null
    if (!anchor) {
      spacer.style.height = "0px"
      return
    }

    const turnHeight = content.offsetHeight - anchor.offsetTop
    spacer.style.height = `${Math.max(0, visibleHeight() - TOP_GAP - turnHeight)}px`
  }, [visibleHeight])

  const updateScrollButton = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const hiddenBelow = contentEnd() - (viewport.scrollTop + visibleHeight())
    setShowScrollButton(hiddenBelow > SCROLL_BUTTON_THRESHOLD)
  }, [contentEnd, visibleHeight])

  const scrollToEnd = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const viewport = viewportRef.current
      if (!viewport) return
      viewport.scrollTo({ top: contentEnd() - visibleHeight() + TOP_GAP, behavior })
    },
    [contentEnd, visibleHeight],
  )

  // React to a new turn before paint, so the slack exists when we scroll.
  useLayoutEffect(() => {
    if (anchorId === previousAnchorIdRef.current) return
    previousAnchorIdRef.current = anchorId

    const viewport = viewportRef.current
    const content = contentRef.current
    if (!anchorId || !viewport || !content) {
      anchoredIdRef.current = null
      updateSlack()
      return
    }

    if (!anchorOnChange) {
      anchoredIdRef.current = null
      updateSlack()
      viewport.scrollTop = viewport.scrollHeight
      return
    }

    anchoredIdRef.current = anchorId
    updateSlack()
    const anchor = content.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(anchorId)}"]`)
    if (anchor) {
      viewport.scrollTo({
        top: content.offsetTop + anchor.offsetTop - TOP_GAP,
        behavior: "smooth",
      })
    }
  }, [anchorId, anchorOnChange, updateSlack])

  // Streaming text, window resizes, and the composer growing all change the
  // geometry; keep the slack and the scroll button in step with them.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const update = () => {
      updateSlack()
      updateScrollButton()
    }
    const observer = new ResizeObserver(update)
    for (const element of [viewport, contentRef.current, footerRef.current]) {
      if (element) observer.observe(element)
    }
    viewport.addEventListener("scroll", updateScrollButton, { passive: true })
    update()

    return () => {
      observer.disconnect()
      viewport.removeEventListener("scroll", updateScrollButton)
    }
  }, [updateScrollButton, updateSlack])

  return {
    viewportRef,
    contentRef,
    spacerRef,
    footerRef,
    showScrollButton,
    scrollToEnd,
  }
}
