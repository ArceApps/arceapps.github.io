from playwright.sync_api import sync_playwright

def verify_lazy_loading():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the preview URL (standard Astro preview port is 4321)
        page.goto("http://localhost:4321/apps")

        # Wait for content to load
        page.wait_for_selector('main')

        # Find all ProjectCards (they have the group class and links)
        # We look for the img tags inside the main content area
        images = page.locator('main img')
        count = images.count()
        print(f"Found {count} images in main area")

        # Verify attributes on the first image found in the grid (likely a ProjectCard)
        # In /apps, there are no other images except cards usually

        # Take a screenshot of the top of the page
        page.screenshot(path="verification/apps_page.png")

        # Check for loading="lazy"
        # We need to find the specific images we modified.
        # ProjectCard images have class "w-full h-full object-cover"

        card_images = page.locator('.w-full.h-full.object-cover').all()

        for i, img in enumerate(card_images):
            loading = img.get_attribute("loading")
            decoding = img.get_attribute("decoding")
            print(f"Image {i}: loading={loading}, decoding={decoding}")

            if loading != "lazy":
                print(f"FAILURE: Image {i} is missing loading='lazy'")
            if decoding != "async":
                print(f"FAILURE: Image {i} is missing decoding='async'")

        browser.close()

if __name__ == "__main__":
    try:
        verify_lazy_loading()
        print("Verification script finished.")
    except Exception as e:
        print(f"Error: {e}")
