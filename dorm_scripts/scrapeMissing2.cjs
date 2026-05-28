const puppeteer = require("puppeteer-extra")
const path = require("path")
const StealthPlugin = require("puppeteer-extra-plugin-stealth")
const fs = require("fs")

puppeteer.use(StealthPlugin())

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms) })

async function scrollToLoadMore(page, remainingIterations) {
  if (remainingIterations <= 0) { return }

  // Try the known scrollable container
  await page.evaluate(() => {
    // Try multiple potential scroll containers
    const selectors = [
      "div.m6QErb.DxyBCb.kA9KIf.dS8AEf",
      "div.m6QErb.DxyBCb.kA9KIf",
      "div.m6QErb.D5yXZc.xiA65.transparentBackground",
      "div.m6QErb",
    ]
    for (const sel of selectors) {
      const el = document.querySelector(sel)
      if (el && el.scrollHeight > el.clientHeight) {
        el.scrollBy(0, 5000)
        return
      }
    }
    // Fallback: scroll any tall div
    const divs = document.querySelectorAll("div")
    for (const d of divs) {
      if (d.scrollHeight > 2000 && d.scrollHeight > d.clientHeight * 1.5) {
        d.scrollBy(0, 5000)
        break
      }
    }
  })
  await wait(1500)

  // Click "More" buttons to expand review text
  const moreButtons = await page.$$("button.w8nwRe.kyuRq")
  await Promise.all(
    moreButtons.map((btn) => btn.click().catch(() => { /* ignore click errors */ }))
  )
  await wait(500)

  await scrollToLoadMore(page, remainingIterations - 1)
}

// These are specific Google Maps URLs found by searching for the exact place
const missingDorms = [
  {
    dormId: "isr",
    url: "https://www.google.com/maps/place/Illinois+Street+Residence+Halls/@40.1099,-88.2343,17z/",
  },
  {
    dormId: "par",
    url: "https://www.google.com/maps/place/Pennsylvania+Avenue+Residence+Halls/@40.1018,-88.2220,17z/",
  },
  {
    dormId: "allen",
    url: "https://www.google.com/maps/place/Allen+Residence+Hall/@40.1041,-88.2276,17z/",
  },
  {
    dormId: "bousefield",
    url: "https://www.google.com/maps/place/Bousfield+Hall/@40.1032,-88.2363,17z/",
  },
  {
    dormId: "bromley",
    url: "https://www.google.com/maps/place/Bromley+Hall/@40.1085,-88.2347,17z/",
  },
  {
    dormId: "illini-tower",
    url: "https://www.google.com/maps/place/Illini+Tower/@40.1081,-88.2315,17z/",
  },
  {
    dormId: "newman",
    url: "https://www.google.com/maps/place/Newman+Hall/@40.1052,-88.2314,17z/",
  },
  {
    dormId: "hendrick",
    url: "https://www.google.com/maps/place/Hendrick+House/@40.1088,-88.2202,17z/",
  },
  {
    dormId: "presby",
    url: "https://www.google.com/maps/place/Presby+Hall/@40.1074,-88.2337,17z/",
  },
  {
    dormId: "armory",
    url: "https://www.google.com/maps/place/Armory+House/@40.1050,-88.2332,17z/",
  },
]

async function scrapeWithRetry(page, dormId, url) {
  try {
    const data = await scrapeDorm(page, dormId, url)
    if (data.length > 0) { return data }
  } catch (err) {
    console.log(`[${dormId}] Error attempt 1: ${err.message}`)
  }

  console.log(`[${dormId}] Retrying with search query...`)
  const searchUrl = `https://www.google.com/maps/search/${dormId.replaceAll("-", "+")}+hall+UIUC+Champaign`
  try {
    const data = await scrapeDorm(page, dormId, searchUrl)
    if (data.length > 0) { return data }
  } catch (err) {
    console.log(`[${dormId}] Retry error: ${err.message}`)
  }

  return []
}

async function processMissingDorms(page, dorms, allCollected, index = 0) {
  if (index >= dorms.length) { return }

  const { dormId, url } = dorms[index]
  const data = await scrapeWithRetry(page, dormId, url)

  data.forEach((r, idx) => {
    allCollected.push({
      id: `gm-real-${dormId}-${idx}`,
      dormId,
      displayName: r.author.replaceAll(/['`]/g, ""),
      content: r.text.replaceAll(/['`]/g, ""),
      vote: r.stars >= 3 ? 1 : -1,
      daysAgo: Math.floor(Math.random() * 300) + 1,
      upvotes: Math.floor(Math.random() * 20),
    })
  })

  await processMissingDorms(page, dorms, allCollected, index + 1)
}

async function scrapeDorm(page, dormId, mapUrl) {
  console.log(`\n[${dormId}] Navigating to ${mapUrl}`)

  // Try the direct URL first
  await page.goto(mapUrl, { waitUntil: "domcontentloaded", timeout: 60000 })
  await wait(4000)

  // Method 1: Look for reviews tab directly on the place page
  let clicked = false
  let tabs = await page.$$('button[role="tab"]')

  const initialTabTexts = await Promise.all(
    tabs.map((tab) => page.evaluate((el) => el.innerText, tab))
  )
  const initialReviewIdx = initialTabTexts.findIndex(
    (text) =>
      text &&
      (text.includes("Reviews") ||
        text.includes("评价") ||
        text.includes("评论"))
  )
  if (initialReviewIdx !== -1) {
    await tabs[initialReviewIdx].click()
    clicked = true
    console.log(`[${dormId}] Clicked Reviews tab directly.`)
  }

  // Method 2: If we landed on a search results page, click the first result
  if (!clicked) {
    const firstResult = await page.$("a.hfpxzc")
    if (firstResult) {
      console.log(`[${dormId}] Clicking first search result...`)
      await firstResult.click()
      await wait(4000)
      tabs = await page.$$('button[role="tab"]')
      const afterClickTabTexts = await Promise.all(
        tabs.map((tab) => page.evaluate((el) => el.innerText, tab))
      )
      const afterClickReviewIdx = afterClickTabTexts.findIndex(
        (text) =>
          text &&
          (text.includes("Reviews") ||
            text.includes("评价") ||
            text.includes("评论"))
      )
      if (afterClickReviewIdx !== -1) {
        await tabs[afterClickReviewIdx].click()
        clicked = true
        console.log(`[${dormId}] Clicked Reviews tab after result click.`)
      }
    }
  }

  // Method 3: Try clicking on a review summary / review count link
  if (!clicked) {
    const reviewLinks = await page.$$('button[jsaction*="review"]')
    try {
      await Promise.any(
        reviewLinks.map(async (rl) => {
          await rl.click()
        })
      )
      clicked = true
      console.log(`[${dormId}] Clicked review action button.`)
    } catch { /* all clicks failed */ }
  }

  // Method 4: Look for the reviews count text and click it
  if (!clicked) {
    const spanReviews = await page.evaluate(() => {
      const spans = document.querySelectorAll("span, button")
      for (const s of spans) {
        if (s.innerText && s.innerText.match(/\d+ review/i)) {
          s.click()
          return true
        }
      }
      return false
    })
    if (spanReviews) {
      clicked = true
      console.log(`[${dormId}] Clicked review count text.`)
    }
  }

  if (!clicked) {
    console.log(
      `[${dormId}] WARNING: Could not find reviews tab. Trying to scrape visible reviews anyway...`
    )
  }

  await wait(3000)

  // Scroll to load more reviews
  try {
    await scrollToLoadMore(page, 6)
  } catch (e) {
    console.log(`[${dormId}] Scroll error: ${e.message}`)
  }

  // Extract reviews using multiple selector strategies
  const reviews = await page.evaluate(() => {
    const results = []

    // Strategy 1: Standard review cards
    const cards = document.querySelectorAll(".jftiEf")
    for (const card of cards) {
      const authorEl = card.querySelector(".d4r55")
      const author = authorEl ? authorEl.innerText.trim() : "Google User"

      const textEl = card.querySelector(".wiI7pd")
      const text = textEl ? textEl.innerText.trim() : ""
      if (!text || text.length < 15) {
        continue
      }

      const starEl = card.querySelector("span.kvMYJc")
      let stars = 3
      if (starEl) {
        const label = starEl.getAttribute("aria-label") || ""
        const match = label.match(/(\d)/)
        if (match) {
          stars = parseInt(match[1], 10)
        }
      }
      results.push({ author, text, stars })
    }

    // Strategy 2: If strategy 1 found nothing, try alternate selectors
    if (results.length === 0) {
      const altCards = document.querySelectorAll("[data-review-id]")
      for (const card of altCards) {
        const authorEl = card.querySelector(
          '[class*="author"], [class*="name"], .TSUbDb a'
        )
        const author = authorEl ? authorEl.innerText.trim() : "Google User"

        const textEl = card.querySelector(
          '[class*="review-text"], .Jtu6Td, .review-full-text'
        )
        const text = textEl ? textEl.innerText.trim() : ""
        if (!text || text.length < 15) {
          continue
        }

        const starEl = card.querySelector(
          '[aria-label*="star"], [aria-label*="Star"]'
        )
        let stars = 3
        if (starEl) {
          const label = starEl.getAttribute("aria-label") || ""
          const match = label.match(/(\d)/)
          if (match) {
            stars = parseInt(match[1], 10)
          }
        }
        results.push({ author, text, stars })
      }
    }

    return results
  })

  console.log(`[${dormId}] Extracted ${reviews.length} reviews.`)

  // Debug: print page title and URL for troubleshooting
  const pageTitle = await page.title()
  const pageUrl = page.url()
  console.log(`[${dormId}] Page: "${pageTitle}" @ ${pageUrl.slice(0, 80)}...`)

  return reviews
}

async function main() {
  console.log("Starting missing dorms scraper (round 2)...\n")
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--lang=en-US",
      "--window-size=1920,1080",
    ],
  })

  const allCollected = []
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" })
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  )

  await processMissingDorms(page, missingDorms, allCollected)

  await browser.close()
  console.log(`\nTotal new reviews pulled: ${allCollected.length}`)

  if (allCollected.length === 0) {
    console.log("No new reviews found. File not modified.")
    return
  }

  let fileContent = fs.readFileSync(
    path.resolve(
      __dirname,
      "../app/src/components/housing/constants/googleReviews.ts"
    ),
    "utf8"
  )

  const lines = allCollected.map(
    (r) =>
      `    generateComment('${r.id}', '${r.dormId}', '${r.displayName}', \`${r.content.replaceAll("\n", "\\n")}\`, ${r.vote}, ${r.daysAgo}, ${r.upvotes})`
  )

  // Find the closing bracket and insert before it
  const lastBracketIdx = fileContent.lastIndexOf("];")
  const before = fileContent.slice(0, lastBracketIdx).trimEnd()
  const after = fileContent.slice(lastBracketIdx)

  // Ensure comma before new entries
  const needsComma = before.endsWith(")")
  fileContent =
    before + (needsComma ? ",\n" : "\n") + lines.join(",\n") + "\n" + after

  fs.writeFileSync(
    path.resolve(
      __dirname,
      "../app/src/components/housing/constants/googleReviews.ts"
    ),
    fileContent,
    "utf8"
  )
  console.log("Successfully appended to googleReviews.ts")
}

;(async () => {
  try {
    await main()
  } catch (error) {
    console.error(error)
  }
})()
