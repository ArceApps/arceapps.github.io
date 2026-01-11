
from playwright.sync_api import sync_playwright

def verify_search_force(page):
    page.goto("http://localhost:4321")

    # Force open the modal
    page.evaluate("document.getElementById('search-modal').classList.remove('hidden')")

    # Wait a bit for render
    page.wait_for_timeout(500)

    # Screenshot header
    page.locator("#search-modal .bg-surface > div:first-child").screenshot(path="verification/search_header_forced.png")

    # Verify ESC text
    esc_text = page.locator("kbd").inner_text()
    print(f"KBD Text: {esc_text}")

    # Force show no results status
    js_inject = """
    const status = document.getElementById('search-status');
    status.innerHTML = '<div class="flex flex-col items-center justify-center py-8 gap-3 text-gray-500 dark:text-gray-400"><span class="material-icons text-5xl opacity-50">search_off</span><p class="font-medium">No encontramos resultados para "test"</p><p class="text-sm">Intenta con otras palabras clave o revisa la ortografía.</p></div>';
    status.classList.remove('hidden');
    """
    page.evaluate(js_inject)

    page.wait_for_timeout(500)
    page.locator("#search-status").screenshot(path="verification/search_status_forced.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        try:
            verify_search_force(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
