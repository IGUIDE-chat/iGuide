import type { MessageSource } from "../../../types"

/** `housing.illinois.edu` for `https://www.housing.illinois.edu/x`; the raw string if unparsable. */
export const hostnameOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

/**
 * Comparable form of a URL: host without `www.`, path without a trailing
 * slash, query kept, scheme and fragment dropped. The model often rewrites a
 * source URL slightly (http vs https, a trailing slash, an anchor).
 */
export const normalizeUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/+$/, "")
    return `${parsed.hostname.replace(/^www\./, "").toLowerCase()}${path}${parsed.search}`
  } catch {
    return url.trim()
  }
}

/** Position of the source a link points to, or -1 when it is not one of them. */
export const findSourceIndex = (sources: readonly MessageSource[], href: string) => {
  const target = normalizeUrl(href)
  return sources.findIndex((source) => normalizeUrl(source.url) === target)
}

const BADGE_COLORS = ["bg-sky-600", "bg-teal-600", "bg-orange-500", "bg-indigo-500", "bg-rose-500"]

/** A stable colour per site, so the same site keeps its colour across replies. */
export const siteColor = (url: string) => {
  const host = hostnameOf(url)
  let hash = 0
  for (const char of host) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return BADGE_COLORS[hash % BADGE_COLORS.length]
}

/** First letter of the site name, e.g. `H` for housing.illinois.edu. */
export const siteInitial = (url: string) => hostnameOf(url).charAt(0).toUpperCase() || "?"
