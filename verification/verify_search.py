from playwright.sync_api import sync_playwright

def verify_search(page):
    print("Navigating to home...")
    page.goto("http://localhost:4321")

    print("Waiting for search button...")
    page.wait_for_selector("button[aria-label='Buscar']")

    print("Clicking search button...")
    page.click("button[aria-label='Buscar']")

    # Just wait a bit for animation
    page.wait_for_timeout(1000)

    print("Taking screenshot of modal...")
    page.screenshot(path="verification/search_modal_open.png")

    # Try to find the ESC hint
    esc_hint = page.locator("kbd:has-text('ESC')")
    if esc_hint.is_visible():
        print("ESC hint is visible!")
    else:
        print("ESC hint NOT visible (might be mobile view?)")

    print("Filling search input...")
    page.fill("#search-input", "palabra_que_no_existe_xyz")

    page.wait_for_timeout(1000)

    print("Taking screenshot of no results...")
    page.screenshot(path="verification/search_no_results_full.png")

    no_results = page.locator("#search-status")
    if no_results.is_visible():
        print("No results status is visible.")
        print("Content:", no_results.inner_text())

if __name__ == "__main__":
    with sync_playwright() as p:
        # Use a desktop viewport size
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        try:
            verify_search(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
