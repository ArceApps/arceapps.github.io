from playwright.sync_api import sync_playwright

def verify_focus(page):
    # Navigate to Privacy Policy (English)
    page.goto("http://localhost:4321/privacy-policy")

    # Wait for hydration if needed, though this is static mostly.
    page.wait_for_load_state("networkidle")

    # Focus on the language toggle
    # It's inside a flex container. We can try to find the link.
    english_toggle = page.get_by_role("link", name="Español")
    # Wait, on privacy-policy (English), the link is to "Español".

    english_toggle.focus()
    page.screenshot(path="/home/jules/verification/privacy_toggle_focus.png")
    print("Captured toggle focus")

    # Now focus on a link inside the prose.
    # "Google support for the ads" is a link.
    ads_link = page.get_by_role("link", name="Google support for the ads")
    ads_link.scroll_into_view_if_needed()
    ads_link.focus()
    page.screenshot(path="/home/jules/verification/privacy_prose_focus.png")
    print("Captured prose link focus")

    # Check Politica Privacidad (Spanish)
    page.goto("http://localhost:4321/politica-privacidad")
    page.wait_for_load_state("networkidle")

    english_link = page.get_by_role("link", name="English")
    english_link.focus()
    page.screenshot(path="/home/jules/verification/politica_toggle_focus.png")
    print("Captured politica toggle focus")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        verify_focus(page)
        browser.close()
