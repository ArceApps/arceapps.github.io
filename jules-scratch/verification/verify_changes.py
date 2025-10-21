from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Verify index.html
    page.goto(f'file:///app/index.html')
    page.screenshot(path='jules-scratch/verification/index.png')

    # Verify blog.html
    page.goto(f'file:///app/blog.html')
    page.screenshot(path='jules-scratch/verification/blog.png')

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
