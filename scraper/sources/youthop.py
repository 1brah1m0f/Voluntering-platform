import re
import time
from typing import List
import requests
from bs4 import BeautifulSoup

from ..models import ScrapedRawItem
from .base import BaseSource

class YouthOpportunitiesSource(BaseSource):
    name = "youthop"
    BASE_URL = "https://www.youthop.com"
    EXCHANGE_URL = "https://www.youthop.com/exchange-programs"

    def __init__(self, request_delay: float = 1.0):
        self.request_delay = request_delay
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })

    def fetch_opportunities(self, limit: int = 10) -> List[ScrapedRawItem]:
        """Scrapes the latest exchange programs, workshops, and youth initiatives from Youth Opportunities."""
        print(f"[{self.name}] Fetching listing from: {self.EXCHANGE_URL}")
        try:
            resp = self.session.get(self.EXCHANGE_URL, timeout=15)
            resp.raise_for_status()
        except Exception as e:
            print(f"[{self.name}] Error fetching listing: {e}")
            return []

        soup = BeautifulSoup(resp.text, "html.parser")
        detail_links = []

        for a in soup.find_all("a", href=True):
            href = a["href"].split("?")[0]
            if href.startswith("https://www.youthop.com/") and any(
                sec in href for sec in ("/exchange-programs/", "/conferences/", "/fellowships/")
            ):
                # Ensure it's an actual item and not the index page
                if href.strip("/").count("/") >= 4 and href not in detail_links:
                    detail_links.append(href)

        sorted_links = detail_links[:limit]
        print(f"[{self.name}] Found {len(detail_links)} opportunities, processing {len(sorted_links)} items...")

        items: List[ScrapedRawItem] = []
        for index, link in enumerate(sorted_links, 1):
            time.sleep(self.request_delay)
            print(f"[{self.name}] ({index}/{len(sorted_links)}) Fetching: {link}")
            try:
                item_resp = self.session.get(link, timeout=15)
                item_resp.raise_for_status()
                item_soup = BeautifulSoup(item_resp.text, "html.parser")

                # Extract title
                h1 = item_soup.find("h1")
                title = h1.get_text(strip=True) if h1 else "International Youth Opportunity"

                # Extract main content container
                entry = item_soup.find("div", class_="entry-content") or item_soup.find("article")
                if entry:
                    raw_text = entry.get_text(separator="\n", strip=True)
                    raw_html = str(entry)
                else:
                    raw_text = item_soup.get_text(separator="\n", strip=True)
                    raw_html = item_resp.text

                items.append(
                    ScrapedRawItem(
                        source_name=self.name,
                        source_url=link,
                        raw_title=title,
                        raw_html=raw_html,
                        raw_text=raw_text,
                    )
                )
            except Exception as e:
                print(f"[{self.name}] Failed to fetch detail for {link}: {e}")

        return items
