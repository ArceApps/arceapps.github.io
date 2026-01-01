from playwright.sync_api import sync_playwright

def verify_header_navigation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to homepage
        print("Navigating to homepage...")
        page.goto("http://localhost:4321/")

        # Check 'Inicio' is active (aria-current="page")
        print("Checking 'Inicio' active state...")
        inicio_link = page.get_by_role("link", name="Inicio").first

        # Check class for active state styling (text-primary)
        # We can't easily check computed styles in a simple way without more code,
        # but checking the class presence is a good proxy if the class logic is correct.
        # But we added `aria-current="page"`.

        aria_current = inicio_link.get_attribute("aria-current")
        print(f"Inicio aria-current: {aria_current}")

        if aria_current != "page":
             print("ERROR: Inicio link should have aria-current='page'")

        # Screenshot Homepage
        page.screenshot(path="verification_home.png")

        # Navigate to Blog
        print("Navigating to Blog...")
        page.get_by_role("link", name="Blog").first.click()
        page.wait_for_url("**/blog")

        # Check 'Blog' is active
        print("Checking 'Blog' active state...")
        blog_link = page.get_by_role("link", name="Blog").first
        aria_current_blog = blog_link.get_attribute("aria-current")
        print(f"Blog aria-current: {aria_current_blog}")

        if aria_current_blog != "page":
             print("ERROR: Blog link should have aria-current='page'")

        # Check 'Inicio' is NOT active
        inicio_link = page.get_by_role("link", name="Inicio").first
        aria_current_home = inicio_link.get_attribute("aria-current")
        if aria_current_home == "page":
            print("ERROR: Inicio link should NOT be active on Blog page")

        # Screenshot Blog
        page.screenshot(path="verification_blog.png")

        # Mobile Menu Verification
        # Resize viewport to mobile
        page.set_viewport_size({"width": 375, "height": 667})

        # Find menu toggle
        menu_toggle = page.locator("#menu-toggle")

        # Check initial state
        expanded_initial = menu_toggle.get_attribute("aria-expanded")
        print(f"Mobile Menu initial expanded: {expanded_initial}")

        if expanded_initial != "false":
            print("ERROR: Mobile menu should be collapsed initially")

        # Click toggle
        print("Clicking menu toggle...")
        menu_toggle.click()

        # Check expanded state
        expanded_after = menu_toggle.get_attribute("aria-expanded")
        print(f"Mobile Menu after click expanded: {expanded_after}")

        if expanded_after != "true":
            print("ERROR: Mobile menu should be expanded after click")

        # Screenshot Mobile Menu
        page.screenshot(path="verification_mobile.png")

        browser.close()

if __name__ == "__main__":
    verify_header_navigation()
