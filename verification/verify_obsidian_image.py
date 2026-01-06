from playwright.sync_api import sync_playwright, expect
import re

def test_obsidian_image():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto("http://localhost:4321/blog/obsidian-para-desarrolladores")

            # Use regex for title or check inclusion
            expect(page).to_have_title(re.compile(r"Obsidian para Desarrolladores: Construyendo tu Segundo Cerebro"))

            # Wait for the image to be visible
            hero_image = page.locator("img[src*='obsidian-dev-hero.svg']")
            expect(hero_image).to_be_visible()

            # Take screenshot
            page.screenshot(path="verification/obsidian_post.png", full_page=True)
            print("Verification successful: Image found and screenshot taken.")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error_state.png")
        finally:
            browser.close()

if __name__ == "__main__":
    test_obsidian_image()
