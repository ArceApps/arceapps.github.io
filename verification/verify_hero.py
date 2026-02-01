from playwright.sync_api import sync_playwright

def verify_hero(page):
    page.goto("http://localhost:4321/")
    page.wait_for_selector("h1")
    page.screenshot(path="verification/hero_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_hero(page)
        finally:
            browser.close()
