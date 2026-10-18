import tempfile
import unittest
from unittest.mock import MagicMock, patch
from scraper.eligibility import azerbaijan_eligibility
from scraper.models import ScrapedRawItem
from scraper.normalizer import OpportunityNormalizer
from scraper import run


class EligibilityTests(unittest.TestCase):
    def test_explicit_participation(self):
        for text in ['Eligible countries: Azerbaijan, Georgia', 'Participants from\nAzerbaijan\nGeorgia\nCosts\nNone', 'Eligibility: Open to all nationalities']:
            self.assertEqual(azerbaijan_eligibility(text)[0], 'eligible', text)

    def test_country_mention_or_missing_rules_is_not_enough(self):
        for text in ['Venue: Azerbaijan', 'Azerbaijan hosted the last event.', 'Eligible countries: Germany, France', 'Eligibility: EU countries only', 'Open to all countries except selected countries']:
            self.assertEqual(azerbaijan_eligibility(text)[0], 'review', text)

    def test_exclusions_override_inclusion(self):
        for text in ['Eligibility: All countries except Azerbaijan', 'Eligible countries: Azerbaijan is not eligible']:
            self.assertEqual(azerbaijan_eligibility(text)[0], 'excluded')

    def test_key_alone_does_not_enable_ai(self):
        with patch.dict('os.environ', {'GEMINI_API_KEY': 'test-only'}):
            self.assertIsNone(OpportunityNormalizer().api_key)
            self.assertEqual(OpportunityNormalizer(use_ai=True).api_key, 'test-only')

    def test_pipeline_filters_before_normalization(self):
        def raw(title, text):
            return ScrapedRawItem(source_name='salto', source_url='https://example.test/' + title, raw_title=title, raw_text=text + '\nApplication deadline: 2099-12-31', raw_html='')
        source = MagicMock()
        source.fetch_opportunities.return_value = [raw('yes', 'Eligible countries: Azerbaijan'), raw('no', 'Eligibility: All countries except Azerbaijan'), raw('unknown', 'Venue: Azerbaijan')]
        normalizer = MagicMock()
        normalizer.api_key = None
        normalizer.normalize.return_value = MagicMock()
        with tempfile.TemporaryDirectory() as output, patch.dict(run.SOURCES, {'salto': lambda: source}), patch.object(run, 'current_dir', output), patch.object(run, 'OpportunityNormalizer', return_value=normalizer), patch.object(run, 'DatabaseClient', return_value=MagicMock(exists_by_url=MagicMock(return_value=False))), patch('sys.argv', ['scrape.py', '--source', 'salto', '--dry-run']):
            run.main()
        self.assertEqual(normalizer.normalize.call_count, 1)
        self.assertEqual(normalizer.normalize.call_args.args[0].raw_title, 'yes')


if __name__ == '__main__':
    unittest.main()
