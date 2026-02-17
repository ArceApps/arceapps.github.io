from playwright.sync_api import sync_playwright

def verify_blog_translation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the blog index (English)
        page.goto("http://localhost:4321/blog")
        page.wait_for_load_state("networkidle")
        page.screenshot(path="verification/blog_index_en.png")
        print("Captured blog_index_en.png")

        # Navigate to a specific article (English)
        page.goto("http://localhost:4321/blog/clean-architecture-android")
        page.wait_for_load_state("networkidle")
        page.screenshot(path="verification/blog_post_en.png")
        print("Captured blog_post_en.png")

        # Switch language to Spanish
        # Simulate click on language toggle or navigate directly
        # Since the toggle is just a link, we can check the href or navigate

        # Check if the translatedPath logic is working (should point to /es/blog/blog-clean-architecture)
        lang_toggle = page.locator("#language-toggle")
        href = lang_toggle.get_attribute("href")
        print(f"Language toggle href: {href}")

        if href == "/es/blog/blog-clean-architecture" or href == "/es/blog/blog-clean-architecture/":
             print("SUCCESS: Language toggle points to correct translated article.")
        else:
             print(f"FAILURE: Language toggle points to {href}, expected /es/blog/blog-clean-architecture")

        # Navigate to Spanish article
        page.goto("http://localhost:4321/es/blog/blog-clean-architecture")
        page.wait_for_load_state("networkidle")
        page.screenshot(path="verification/blog_post_es.png")
        print("Captured blog_post_es.png")

        browser.close()

if __name__ == "__main__":
    verify_blog_translation()
