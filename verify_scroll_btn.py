from playwright.sync_api import sync_playwright, expect
import time
import re
import os

def verify_scroll_btn():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to home
        print("Navigating to home...")
        # Wait for server to start if needed
        for i in range(10):
            try:
                page.goto("http://localhost:4321/")
                break
            except:
                time.sleep(1)

        page.wait_for_load_state("networkidle")

        # Check initially hidden
        scroll_btn = page.locator("#scroll-to-top")
        print("Checking initially hidden...")
        expect(scroll_btn).to_have_class(re.compile(r"opacity-0"))

        # Scroll down 500px
        print("Scrolling down...")
        page.evaluate("window.scrollTo(0, 500)")
        time.sleep(1) # Wait for animation/event

        # Check visible
        print("Checking visible...")
        expect(scroll_btn).to_have_class(re.compile(r"opacity-100"))

        # Take screenshot of visible button
        os.makedirs("/home/jules/verification", exist_ok=True)
        page.screenshot(path="/home/jules/verification/verification.png")

        # Scroll up
        print("Scrolling up...")
        page.evaluate("window.scrollTo(0, 0)")
        time.sleep(1)

        # Check hidden again
        print("Checking hidden again...")
        expect(scroll_btn).to_have_class(re.compile(r"opacity-0"))

        print("Verification passed!")
        browser.close()

if __name__ == "__main__":
    verify_scroll_btn()
