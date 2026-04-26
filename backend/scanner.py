from collections import deque
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

AXE_CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js"
PLAYWRIGHT_TIMEOUT_MS = 60000
AXE_FETCH_TIMEOUT_SECONDS = 20
_AXE_SOURCE_CACHE: str | None = None


def _validate_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Invalid URL. Use a full http/https URL.")


def _same_origin(candidate: str, origin: str) -> bool:
    parsed = urlparse(candidate)
    return f"{parsed.scheme}://{parsed.netloc}" == origin


def _get_axe_source() -> str:
    global _AXE_SOURCE_CACHE
    if _AXE_SOURCE_CACHE is not None:
        return _AXE_SOURCE_CACHE

    response = requests.get(AXE_CDN_URL, timeout=AXE_FETCH_TIMEOUT_SECONDS)
    response.raise_for_status()
    _AXE_SOURCE_CACHE = response.text
    return _AXE_SOURCE_CACHE


def _collect_internal_links(page: Any, current_url: str) -> list[str]:
    origin = f"{urlparse(current_url).scheme}://{urlparse(current_url).netloc}"
    hrefs = page.eval_on_selector_all(
        "a[href]",
        """(nodes) => nodes.map((node) => node.getAttribute('href')).filter(Boolean)""",
    )

    links: list[str] = []
    for href in hrefs:
        resolved = urljoin(current_url, str(href))
        parsed = urlparse(resolved)
        if parsed.scheme not in {"http", "https"}:
            continue
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path or '/'}"
        if _same_origin(normalized, origin):
            links.append(normalized)
    return links


def _scan_single_page(page: Any, url: str) -> dict[str, Any]:
    try:
        page.goto(url, wait_until="load", timeout=PLAYWRIGHT_TIMEOUT_MS)
    except PlaywrightTimeoutError as exc:
        raise RuntimeError(f"Timed out while opening URL: {url}") from exc
    except Exception as exc:
        print(f"Skipping {url} due to error: {exc}")
        return {
            "url": url,
            "title": "Failed to load",
            "violations": [],
            "internal_links": [],
        }

    # Evaluate axe directly in the page context so we avoid both TrustedScriptURL
    # and TrustedScript restrictions on dynamic script elements.
    page.evaluate(
        """source => {
            if (!window.axe) {
                globalThis.eval(source);
            }
        }""",
        _get_axe_source(),
    )
    axe_result = page.evaluate("""async () => await axe.run()""")

    title = page.title()
    violations = []
    for violation in axe_result.get("violations", []):
        if not isinstance(violation, dict):
            continue
        violation["page_url"] = url
        violation["page_title"] = title
        violations.append(violation)

    return {
        "url": url,
        "title": title,
        "violations": violations,
        "internal_links": _collect_internal_links(page, url),
    }


def scan_website(url: str, max_pages: int = 3) -> dict[str, Any]:
    """Scan one or more same-origin pages with axe-core and aggregate violations."""
    _validate_url(url)

    visited: set[str] = set()
    queue: deque[str] = deque([url])
    scanned_pages: list[dict[str, Any]] = []
    all_violations: list[dict[str, Any]] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            page.set_default_timeout(PLAYWRIGHT_TIMEOUT_MS)
            page.set_default_navigation_timeout(PLAYWRIGHT_TIMEOUT_MS)

            while queue and len(scanned_pages) < max_pages:
                current_url = queue.popleft()
                if current_url in visited:
                    continue
                visited.add(current_url)

                page_result = _scan_single_page(page, current_url)
                scanned_pages.append(
                    {
                        "url": page_result["url"],
                        "title": page_result["title"],
                    }
                )
                all_violations.extend(page_result["violations"])

                for link in page_result["internal_links"]:
                    if link not in visited and link not in queue and len(queue) + len(scanned_pages) < max_pages + 5:
                        queue.append(link)

            return {
                "violations": all_violations,
                "scanned_pages": scanned_pages,
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
            page.set_default_timeout(PLAYWRIGHT_TIMEOUT_MS)
            page.set_default_navigation_timeout(PLAYWRIGHT_TIMEOUT_MS)
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=PLAYWRIGHT_TIMEOUT_MS)
            except PlaywrightTimeoutError as exc:
                raise RuntimeError("Timed out while opening URL") from exc
            return page.title()
        finally:
            browser.close()
