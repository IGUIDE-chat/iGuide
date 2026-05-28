const puppeteer = require("puppeteer-extra")
const StealthPlugin = require("puppeteer-extra-plugin-stealth")
const fs = require("fs")
const path = require("path")

puppeteer.use(StealthPlugin())

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

async function scrollToLoadMore(page, remainingIterations) {
  if (remainingIterations <= 0) {
    return
  }

  const scrollableSelector = "div.m6QErb.D5yXZc.xiA65.transparentBackground"
  const element = await page.$(scrollableSelector)
  if (element) {
    await page.evaluate((el) => {
      el.scrollBy(0, 10000)
    }, element)
  } else {
    await page.evaluate(() => {
      const divs = document.querySelectorAll("div")
      divs.forEach((d) => {
        if (d.scrollHeight > 1000) {
          d.scrollBy(0, 10000)
        }
      })
    })
  }
  await wait(1000)

  const moreButtons = await page.$$("button.w8nwRe.kyuRq")
  await Promise.all(
    moreButtons.map((btn) =>
      btn.click().catch(() => {
        /* ignore click errors */
      })
    )
  )
  await wait(500)

  await scrollToLoadMore(page, remainingIterations - 1)
}

const pchDorms = {
  bromley: "Bromley+Hall+910+S+Third+St+Champaign",
  "illini-tower": "Illini+Tower+409+E+Chalmers+St+Champaign",
  newman: "Newman+Hall+604+E+Armory+Ave+Champaign",
  hendrick: "Hendrick+House+904+W+Green+St+Urbana",
  presby: "Presby+Hall+805+S+Fifth+St+Champaign",
  armory: "Armory+House+1010+S+Second+St+Champaign",
}

async function scrapeWithRetry(page, dormId, query) {
  try {
    const data = await scrapeDorm(page, dormId, query)
    if (data.length > 0) {
      return data
    }
  } catch (err) {
    console.log(`[${dormId}] Error: ${err.message}`)
  }

  try {
    const data = await scrapeDorm(page, dormId, query)
    if (data.length > 0) {
      return data
    }
  } catch (err) {
    console.log(`[${dormId}] Retry error: ${err.message}`)
  }

  return []
}

async function processDormEntries(page, entries, allCollected, index = 0) {
  if (index >= entries.length) {
    return
  }

  const [dormId, query] = entries[index]
  const data = await scrapeWithRetry(page, dormId, query)

  data.forEach((r, idx) => {
    allCollected.push({
      id: `gm-real-${dormId}-${idx}`,
      dormId: dormId,
      displayName: r.author.replaceAll(/['`]/g, ""),
      content: r.text.replaceAll(/['`]/g, ""),
      vote: r.stars >= 3 ? 1 : -1,
      daysAgo: Math.floor(Math.random() * 300) + 1,
      upvotes: Math.floor(Math.random() * 20),
    })
  })

  await processDormEntries(page, entries, allCollected, index + 1)
}

async function scrapeDorm(page, dormId, query) {
  console.log(`[${dormId}] Scraping ${query}...`)
  const url = `https://www.google.com/maps/search/${query}`
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 })

  await wait(3000)

  const tabs = await page.$$('button[role="tab"]')
  let clicked = false

  const tabTexts = await Promise.all(
    tabs.map((tab) => page.evaluate((el) => el.innerText, tab))
  )
  const reviewTabIndex = tabTexts.findIndex(
    (text) =>
      text &&
      (text.includes("Reviews") ||
        text.includes("评价") ||
        text.includes("评论") ||
        text.includes("Review"))
  )
  if (reviewTabIndex !== -1) {
    await tabs[reviewTabIndex].click()
    clicked = true
  }

  if (!clicked) {
    const firstResult = await page.$("a.hfpxzc")
    if (firstResult) {
      await firstResult.click()
      await wait(3000)
      const internalTabs = await page.$$('button[role="tab"]')
      const internalTabTexts = await Promise.all(
        internalTabs.map((tab) => page.evaluate((el) => el.innerText, tab))
      )
      const internalReviewIndex = internalTabTexts.findIndex(
        (text) =>
          text &&
          (text.includes("Reviews") ||
            text.includes("评价") ||
            text.includes("评论") ||
            text.includes("Review"))
      )
      if (internalReviewIndex !== -1) {
        await internalTabs[internalReviewIndex].click()
        clicked = true
      }
    }
  }

  if (!clicked) {
    console.log(`[${dormId}] Could not find reviews tab.`)
    return []
  }

  console.log(`[${dormId}] Entered Reviews Tab. Waiting...`)
  await wait(2000)

  try {
    await scrollToLoadMore(page, 5)
  } catch {}

  const reviews = await page.evaluate(() => {
    const results = []
    const cards = document.querySelectorAll(".jftiEf")
    for (const card of cards) {
      const authorEl = card.querySelector(".d4r55")
      const author = authorEl ? authorEl.innerText : "Google User"

      const textEl = card.querySelector(".wiI7pd")
      const text = textEl ? textEl.innerText : ""
      if (!text || text.length < 15) {
        continue
      }

      const starEl = card.querySelector("span.kvMYJc")
      let stars = 3
      if (starEl) {
        const parts = starEl.getAttribute("aria-label") || ""
        const match = parts.match(/\d/)
        if (match) {
          stars = parseInt(match[0], 10)
        }
      }
      results.push({ author, text, stars })
    }
    return results
  })

  console.log(`[${dormId}] Extracted ${reviews.length} reviews.`)
  return reviews
}

async function main() {
  console.log("Starting PCH dorms scraper...")
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=en-US"],
  })

  const allCollected = []
  const page = await browser.newPage()
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  })

  await processDormEntries(page, Object.entries(pchDorms), allCollected)

  await browser.close()

  console.log(`Total PCH reviews pulled: ${allCollected.length}`)

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

  // Insert before the last array bracket
  fileContent = fileContent.replace("];", lines.join(",\n") + "\n];")

  if (lines.length > 0) {
    fileContent = fileContent.replace(
      ")\n    generateComment",
      "),\n    generateComment"
    )
  }

  fs.writeFileSync(
    path.resolve(
      __dirname,
      "../app/src/components/housing/constants/googleReviews.ts"
    ),
    fileContent,
    "utf8"
  )
  console.log("Successfully appended PCH to googleReviews.ts")
}

;(async () => {
  try {
    await main()
  } catch (error) {
    console.error(error)
  }
})()
