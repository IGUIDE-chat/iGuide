import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        print("Navigating to Google Maps...")
        await page.goto("https://www.google.com/maps/search/Illinois+Street+Residence+Halls+UIUC", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        
        # Click reviews tab if it exists
        buttons = await page.locator("button[role='tab']", has_text="Reviews").all()
        if not buttons:
             buttons = await page.locator("button[role='tab']", has_text="评价").all()
             
        if buttons:
            await buttons[0].click()
            await page.wait_for_timeout(3000)
            
            # Extract reviews
            reviews = await page.locator("span.wiI7pd").all_text_contents()
            print("Extracted reviews:", len(reviews))
            for i, r in enumerate(reviews):
                print(f"{i}: {r[:100]}...")
        else:
            print("No reviews tab found.")
            html = await page.content()
            print("Snippet:", html[:500])
        await browser.close()

asyncio.run(run())
