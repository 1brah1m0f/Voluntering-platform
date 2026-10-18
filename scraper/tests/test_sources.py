from datetime import date
from pathlib import Path
import re
import tempfile
import unittest
from unittest.mock import MagicMock, patch
from urllib.robotparser import RobotFileParser

from scraper.dates import stated_deadline
from scraper.models import ScrapedRawItem
from scraper.normalizer import OpportunityNormalizer
from scraper.sources.catalog import CATALOG, BY_ID
from scraper.sources.html import HtmlSource, SourceUnavailable
from scraper import run


def raw(url='https://example.test/call', text='Eligible countries: Azerbaijan\nApplication deadline: 2099-12-31', **kwargs):
    return ScrapedRawItem(source_name='salto', source_url=url, raw_title='Volunteer call', raw_text=text, raw_html='', **kwargs)


class SourceTests(unittest.TestCase):
    def test_registry_is_complete_and_well_formed(self):
        self.assertGreaterEqual(len(CATALOG), 40)
        self.assertEqual(len(CATALOG), len(BY_ID))
        self.assertEqual({e['scope'] for e in CATALOG}, {'local', 'global'})
        for entry in CATALOG:
            self.assertTrue(entry['url'].startswith('https://'))
            self.assertIn(entry['mode'], ['listing', 'program', 'manual'])
            if entry['mode'] == 'listing':
                self.assertTrue(entry['link_pattern'])
                re.compile(entry['link_pattern'])

    def test_links_are_deduplicated_and_confined_to_provider(self):
        source = HtmlSource(BY_ID['opportunitydesk'], request_delay=0)
        html = '''<a href="/2026/10/18/call/?utm_source=test">Call</a>
          <a href="/2026/10/18/call/">Again</a>
          <a href="https://other.example/2026/10/18/call/">External</a>
          <a href="javascript:alert(1)">Script</a><a href="/category/volunteering/">Category</a>'''
        self.assertEqual(source.detail_links(html), ['https://opportunitydesk.org/2026/10/18/call/'])

    def test_detail_excludes_navigation_and_retains_provider_metadata(self):
        source = HtmlSource(BY_ID['family'], request_delay=0)
        item = source.parse_detail('''<h1>Könüllü qəbulu elan edilir</h1><main>
          <nav>Ignore this navigation</nav><p>Könüllü qəbulu elan edilir. Azərbaycan vətəndaşları üçün yerli proqram.</p>
          <p>Son tarix: 31 dekabr 2099</p><form>Private form fields</form></main>''', 'https://family.gov.az/az/news/call')
        self.assertEqual(item.source_scope, 'local')
        self.assertEqual(item.source_program, 'Ailəm Könüllüləri')
        self.assertNotIn('Private form', item.raw_text)
        self.assertNotIn('navigation', item.raw_text)

    def test_news_about_finished_volunteering_is_not_a_recruitment_call(self):
        source = HtmlSource(BY_ID['family'], request_delay=0)
        self.assertIsNone(source.parse_detail('<h1>Könüllülər təltif edilib</h1><main><p>Könüllülər bu gün görüşdə iştirak ediblər. Onlara sertifikatlar təqdim olunub.</p></main>', 'https://family.gov.az/az/news/old'))

    def test_robots_denial_prevents_fetching_page(self):
        source = HtmlSource(BY_ID['salto'], request_delay=0)
        response = MagicMock(status_code=200, is_redirect=False, headers={'Content-Type': 'text/plain'}, text='User-agent: *\nDisallow: /')
        source.session.get = MagicMock(return_value=response)
        with self.assertRaisesRegex(SourceUnavailable, 'robots'):
            source._get(source.spec['url'])
        self.assertEqual(source.session.get.call_count, 1)

    def test_offsite_redirect_is_not_followed(self):
        source = HtmlSource(BY_ID['salto'], request_delay=0)
        rules = RobotFileParser()
        rules.parse(['User-agent: *', 'Allow: /'])
        source._robots['https://www.salto-youth.net'] = rules
        response = MagicMock(is_redirect=True, headers={'Location': 'https://other.example/path'})
        source.session.get = MagicMock(return_value=response)
        with self.assertRaisesRegex(SourceUnavailable, 'Redirect'):
            source._get(source.spec['url'])
        self.assertEqual(source.session.get.call_count, 1)

    def test_stated_deadlines_support_english_and_azerbaijani(self):
        for text in ['Deadline: 2099-12-31', 'Application deadline:\n31 December 2099', 'Deadline: December 31, 2099', 'Son tarix: 31 dekabr 2099', 'Müraciətlərin son tarixi: 31.12.2099', 'Application deadline\n(24h UTC)\n: 31 December 2099']:
            self.assertEqual(stated_deadline(text), '2099-12-31', text)
        for text in ['Deadline: rolling', 'Deadline: 31 February 2099', 'Published: 2099-12-31', 'No dates']:
            self.assertIsNone(stated_deadline(text), text)

    def test_country_groups_in_real_salto_markup(self):
        from scraper.eligibility import azerbaijan_eligibility
        text = 'Training overview\nThis Activity is\nfor\n25 participants\nfrom\nEastern Partnership countries\n, Erasmus+ Youth Programme countries\nand recommended for\nYouth workers'
        self.assertEqual(azerbaijan_eligibility(text)[0], 'eligible')
        self.assertEqual(azerbaijan_eligibility('Eligible countries: Eastern Partnership countries except Azerbaijan')[0], 'excluded')
        self.assertEqual(azerbaijan_eligibility('Open to EU countries only')[0], 'review')

    def test_normalizer_never_invents_deadlines_or_salto_attribution(self):
        normalizer = OpportunityNormalizer()
        with self.assertRaisesRegex(ValueError, 'deadline'):
            normalizer.normalize(raw(text='No deadline is stated here'))
        item = raw(source_scope='local', source_program='Könüllü DOST')
        result = normalizer.normalize(item)
        self.assertEqual(result.program, 'Könüllü DOST')
        self.assertEqual(result.country, 'Azərbaycan')
        self.assertEqual(result.kind, 'volunteering')
        self.assertFalse(result.published)

    def run_pipeline(self, items, exists=False, factory_error=None):
        source = MagicMock()
        source.fetch_opportunities.return_value = items
        if factory_error:
            source.fetch_opportunities.side_effect = factory_error
        normalizer = MagicMock(api_key=None)
        normalizer.normalize.return_value = OpportunityNormalizer().normalize(raw())
        db = MagicMock()
        db.exists_by_url.return_value = exists
        with tempfile.TemporaryDirectory() as directory, patch.object(run, 'current_dir', directory), patch.dict(run.SOURCES, {'salto': lambda: source}), patch.object(run, 'OpportunityNormalizer', return_value=normalizer), patch.object(run, 'DatabaseClient', return_value=db), patch('sys.argv', ['scrape.py', '--source', 'salto', '--dry-run']):
            run.main()
            reports = {name: (Path(directory) / 'output' / name).read_text() for name in ['summary.json', 'source-status.json', 'eligibility-review.json', 'programs-review.json']}
        return normalizer, db, reports

    def test_unknown_or_expired_dates_never_reach_ai(self):
        normalizer, db, reports = self.run_pipeline([raw(text='Eligible countries: Azerbaijan'), raw(url='https://example.test/expired', text='Eligible countries: Azerbaijan\nDeadline: 2000-01-01')])
        normalizer.normalize.assert_not_called()
        db.insert_opportunity.assert_not_called()
        self.assertIn('No stated application deadline', reports['eligibility-review.json'])
        self.assertIn('"expired": 1', reports['summary.json'])

    def test_duplicate_checks_precede_ai_and_dry_run_never_inserts(self):
        normalizer, db, _ = self.run_pipeline([raw()], exists=True)
        normalizer.normalize.assert_not_called()
        db.insert_opportunity.assert_not_called()
        normalizer, db, _ = self.run_pipeline([raw(), raw()])
        self.assertEqual(normalizer.normalize.call_count, 1)
        db.insert_opportunity.assert_not_called()

    def test_programme_pages_are_exported_without_ai(self):
        normalizer, db, reports = self.run_pipeline([raw(source_mode='program')])
        normalizer.normalize.assert_not_called()
        self.assertIn('Programme information', reports['programs-review.json'])

    def test_unavailable_source_is_reported_without_aborting_job(self):
        normalizer, db, reports = self.run_pipeline([], factory_error=SourceUnavailable('blocked'))
        normalizer.normalize.assert_not_called()
        self.assertIn('unavailable', reports['source-status.json'])
        self.assertIn('blocked', reports['source-status.json'])

    def test_list_sources_has_no_network_or_database_calls(self):
        with patch('sys.argv', ['scrape.py', '--list-sources', '--scope', 'local']), patch.object(run, 'DatabaseClient') as db, patch.object(run, 'OpportunityNormalizer') as normalizer:
            run.main()
        db.assert_not_called()
        normalizer.assert_not_called()


if __name__ == '__main__':
    unittest.main()
