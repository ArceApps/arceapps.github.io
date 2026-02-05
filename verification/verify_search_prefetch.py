from playwright.sync_api import sync_playwright, expect
import time

def verify_search(page):
    page.goto("http://localhost:4321")

    # Wait for hydration/load
    page.wait_for_load_state("networkidle")

    # Find search button
    search_btn = page.locator("#search-button")
    expect(search_btn).to_be_visible()

    # Hover (should trigger prefetch, but we can't see it visually)
    search_btn.hover()
    time.sleep(0.5) # Wait for potential prefetch

    # Click to open
    search_btn.click()

    # Wait for modal
    modal = page.locator("#search-modal")
    expect(modal).to_be_visible()

    # Type query
    search_input = page.locator("#search-input")
    search_input.fill("app")

    # Wait for results
    results = page.locator("#search-results")
    expect(results).to_be_visible()

    # Take screenshot of results
    page.screenshot(path="verification/search_results.png")
    print("Screenshot saved to verification/search_results.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_search(page)
        finally:
            browser.close()
