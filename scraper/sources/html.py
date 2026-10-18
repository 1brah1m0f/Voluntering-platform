"""Bounded, robots-aware collection of public listing and programme pages."""
import re
import time
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup
from .base import BaseSource
from ..models import ScrapedRawItem

USER_AGENT = 'OpenlyOpportunityCrawler/1.0 (+https://openlyapply.com)'
VOLUNTEER = re.compile(r'volunt|könüll|konull|koenuell|solidarity|workcamp', re.I)
RECRUITMENT = re.compile(r'qəbul.{0,30}(?:elan|başla)|qeydiyyat.{0,30}(?:başla|elan|açıq)|könüllü.{0,30}(?:ol|axtar|qoşul)|call for|applications? (?:are )?open|apply now|recruit', re.I)


class SourceUnavailable(RuntimeError):
    pass


class HtmlSource(BaseSource):
    def __init__(self, spec, request_delay=1.0):
        self.spec = spec
        self.name = spec['id']
        self.request_delay = request_delay
        self.session = requests.Session()
        self.session.headers['User-Agent'] = USER_AGENT
        self.pages = 1
        self._robots = {}
        self._last_request = 0.0
        self.host = urlsplit(spec['url']).hostname.removeprefix('www.')

    def _same_site(self, url):
        parsed = urlsplit(url)
        return parsed.scheme == 'https' and (parsed.hostname or '').removeprefix('www.') == self.host

    def _get(self, url):
        if not self._same_site(url):
            raise SourceUnavailable('Refusing an off-site or non-HTTPS URL')
        origin = f'https://{urlsplit(url).netloc}'
        if origin not in self._robots:
            robots_url = origin + '/robots.txt'
            for _ in range(4):
                response = self.session.get(robots_url, timeout=15, allow_redirects=False)
                if not response.is_redirect:
                    break
                target = urljoin(robots_url, response.headers.get('Location', ''))
                if not self._same_site(target) or urlsplit(target).netloc != urlsplit(url).netloc:
                    raise SourceUnavailable('Off-site robots.txt redirect')
                robots_url = target
            if response.status_code == 404:
                rules = RobotFileParser()
                rules.parse(['User-agent: *', 'Allow: /'])
            elif response.status_code == 200 and 'text/html' not in response.headers.get('Content-Type', ''):
                rules = RobotFileParser()
                rules.parse(response.text.splitlines())
            else:
                raise SourceUnavailable(f'Cannot verify robots.txt (HTTP {response.status_code})')
            self._robots[origin] = rules
        rules = self._robots[origin]
        if not rules.can_fetch(USER_AGENT, url):
            raise SourceUnavailable('Disallowed by robots.txt')
        delay = max(self.request_delay, rules.crawl_delay(USER_AGENT) or rules.crawl_delay('*') or 0)
        if delay > 30:
            raise SourceUnavailable('Requested crawl delay exceeds this job’s time budget')
        time.sleep(max(0, delay - (time.monotonic() - self._last_request)))
        self._last_request = time.monotonic()
        # Follow only a small number of same-provider redirects, never to login/external sites.
        for _ in range(4):
            response = self.session.get(url, timeout=15, allow_redirects=False)
            if response.is_redirect:
                target = urljoin(url, response.headers['Location'])
                if not self._same_site(target) or urlsplit(target).netloc != urlsplit(url).netloc or not rules.can_fetch(USER_AGENT, target):
                    raise SourceUnavailable('Redirect requires a different host or disallowed path')
                url = target
                continue
            response.raise_for_status()
            if 'html' not in response.headers.get('Content-Type', '').lower():
                raise SourceUnavailable('Expected HTML')
            if len(response.content) > 5_000_000:
                raise SourceUnavailable('HTML response exceeds 5 MB')
            return response
        raise SourceUnavailable('Too many redirects')

    def detail_links(self, html):
        soup = BeautifulSoup(html, 'html.parser')
        links = []
        pattern = re.compile(self.spec['link_pattern'])
        base = soup.select_one('base[href]')
        base_url = urljoin(self.spec['url'], base['href']) if base else self.spec.get('link_base', self.spec['url'])
        for anchor in soup.select('a[href]'):
            url = urljoin(base_url, anchor['href'])
            parsed = urlsplit(url)
            url = urlunsplit((parsed.scheme, parsed.netloc, parsed.path, '', ''))
            if not self._same_site(url) or not pattern.search(parsed.path) or url in links:
                continue
            label = anchor.get_text(' ', strip=True) + ' ' + parsed.path
            if self.spec.get('volunteer_only') and not VOLUNTEER.search(label):
                continue
            links.append(url)
        return links

    def parse_detail(self, html, url):
        soup = BeautifulSoup(html, 'html.parser')
        container = soup.select_one('.entry-content, .field--name-body, article, main, .content-detail, .news-detail') or soup.body
        if container is None:
            raise SourceUnavailable('No content container')
        title = soup.select_one('h1')
        heading = title.get_text(' ', strip=True) if title else self.spec['name']
        for element in container.select('script, style, nav, footer, header, form, aside'):
            element.decompose()
        text = container.get_text('\n', strip=True)
        if len(text) < 60:
            raise SourceUnavailable('No usable article text; may require JavaScript')
        if self.spec.get('recruitment_only') and not RECRUITMENT.search(heading + '\n' + text[:2000]):
            return None
        return ScrapedRawItem(source_name=self.name, source_url=url, raw_title=heading,
                              raw_html=str(container), raw_text=text,
                              source_scope=self.spec['scope'], source_program=self.spec.get('program', self.spec['name']),
                              source_mode=self.spec['mode'])

    def fetch_opportunities(self, limit=10):
        if self.spec['mode'] == 'manual':
            return []
        response = self._get(self.spec['url'])
        if self.spec['mode'] == 'program':
            item = self.parse_detail(response.text, response.url)
            return [item] if item else []
        links = self.detail_links(response.text)
        visited = {response.url}
        for _ in range(self.pages - 1):
            soup = BeautifulSoup(response.text, 'html.parser')
            next_link = soup.select_one('a[rel~=next], li.pager__item--next a, .pagination .next a, a.next.page-numbers')
            if not next_link:
                break
            next_url = urljoin(response.url, next_link['href'])
            if next_url in visited:
                break
            visited.add(next_url)
            response = self._get(next_url)
            links.extend(link for link in self.detail_links(response.text) if link not in links)
        links = links[:limit]
        if not links:
            print(f'[{self.name}] No matching calls on scanned pages (possibly empty or changed layout)')
            return []
        items = []
        failures = []
        for link in links:
            try:
                response = self._get(link)
                item = self.parse_detail(response.text, response.url)
                if item:
                    items.append(item)
            except (requests.RequestException, SourceUnavailable) as error:
                failures.append(f'{link}: {error}')
        if failures:
            print(f'[{self.name}] {len(failures)} detail page(s) unavailable: ' + '; '.join(failures))
        if not items and failures:
            raise SourceUnavailable('All detail pages failed')
        return items
