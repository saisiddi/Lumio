from typing import Any
from urllib.parse import urlparse

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

AXE_CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js"


def _validate_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Invalid URL. Use a full http/https URL.")


def scan_website(url: str) -> dict[str, list[dict[str, Any]]]:
    """Scan a website with axe-core and return accessibility result buckets."""
    _validate_url(url)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            try:
                page.goto(url, wait_until="load", timeout=60000)
            except PlaywrightTimeoutError as exc:
                raise RuntimeError("Timed out while opening URL") from exc

            page.add_script_tag(url=AXE_CDN_URL)
            axe_result = page.evaluate("""async () => await axe.run()""")

            return {
                "violations": axe_result.get("violations", []),
                "passes": axe_result.get("passes", []),
                "incomplete": axe_result.get("incomplete", []),
                "inapplicable": axe_result.get("inapplicable", []),
            }
        finally:
            browser.close()


def scan_page_title(url: str) -> str:
    """Backward-compatible helper retained for existing API routes."""
    _validate_url(url)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
            except PlaywrightTimeoutError as exc:
                raise RuntimeError("Timed out while opening URL") from exc
            return page.title()
        finally:
            browser.close()
