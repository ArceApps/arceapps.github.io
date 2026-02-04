from playwright.sync_api import sync_playwright

def verify_apps(page):
    page.goto("http://localhost:4321/apps")
    page.wait_for_load_state("networkidle")

    # Check if header exists
    header = page.get_by_role("heading", name="Portfolio Indie")
    if header.count() > 0:
        print("Header found")
    else:
        print("Header not found")

    # Check if blur/gradient elements exist (by class or style)
    # Since we used style attribute, we can check for that
    # But it's easier to just screenshot and visually inspect

    page.screenshot(path="verification/apps_page.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_apps(page)
        finally:
            browser.close()
