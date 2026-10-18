from urllib.parse import urlsplit
from bs4 import BeautifulSoup
from ..sources.html import HtmlSource


class HackathonSource(HtmlSource):
    def _same_site(self, url):
        parsed = urlsplit(url)
        host = (parsed.hostname or '').removeprefix('www.')
        allowed = host == self.host or host in self.spec.get('allowed_hosts', [])
        if self.spec.get('subdomain_events'):
            allowed = allowed or (host.endswith('.' + self.host) and host.split('.')[0] not in ['assets', 'api', 'secure', 'info', 'blog', 'help'])
        return parsed.scheme == 'https' and allowed

    def detail_links(self, html):
        links = super().detail_links(html)
        if self.spec.get('subdomain_events'):
            links = [url for url in links if urlsplit(url).hostname != self.host]
        return links

    def parse_detail(self, html, url):
        item = super().parse_detail(html, url)
        if item is None:
            return None
        # Retain public structured event metadata; it is parsed as JSON, never executed.
        soup = BeautifulSoup(html, 'html.parser')
        metadata = ''.join(str(script) for script in soup.select('script[type="application/ld+json"]'))
        item.raw_html += metadata
        return item
