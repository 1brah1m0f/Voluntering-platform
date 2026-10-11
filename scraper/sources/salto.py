import re
import time
from typing import List
import requests
from bs4 import BeautifulSoup

from ..models import ScrapedRawItem
from .base import BaseSource

class SaltoYouthSource(BaseSource):
    name = "salto"
    BASE_URL = "https://www.salto-youth.net"
    CALENDAR_URL = "https://www.salto-youth.net/tools/european-training-calendar/browse/"

    def __init__(self, request_delay: float = 1.0):
        self.request_delay = request_delay
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "OpenlyOpportunityCrawler/1.0 (+https://openlyapply.com)"
        })

    def fetch_opportunities(self, limit: int = 10) -> List[ScrapedRawItem]:
        """Scrapes the latest open training calls from SALTO-Youth European Training Calendar."""
        print(f"[{self.name}] Fetching listing from: {self.CALENDAR_URL}")
        try:
            resp = self.session.get(self.CALENDAR_URL, timeout=15)
            resp.raise_for_status()
        except Exception as e:
            print(f"[{self.name}] Error fetching listing: {e}")
            return []

        # Find all training opportunity detail links
        # Matches: /tools/european-training-calendar/training/<name>.<id>/
        soup = BeautifulSoup(resp.text, "html.parser")
        detail_links = set()

        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "/tools/european-training-calendar/training/" in href:
                if href.startswith("/"):
                    href = self.BASE_URL + href
                elif not href.startswith("http"):
                    href = f"{self.BASE_URL}/{href}"
                detail_links.add(href)

        sorted_links = list(detail_links)[:limit]
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
                title = h1.get_text(strip=True) if h1 else "Untitled Opportunity"

                # Extract main content container (usually inside main or article or content div)
                main_elem = item_soup.find("main") or item_soup.find("article") or item_soup.find("div", class_="content")
                if main_elem:
                    raw_text = main_elem.get_text(separator="\n", strip=True)
                    raw_html = str(main_elem)
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
