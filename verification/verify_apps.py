from playwright.sync_api import sync_playwright

def verify_apps_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to /apps...")
            page.goto("http://localhost:4321/apps")

            # Wait for content to ensure page is loaded
            page.wait_for_selector("h1")

            # Take screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/apps_page.png")
            print("Screenshot saved to verification/apps_page.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_apps_page()
