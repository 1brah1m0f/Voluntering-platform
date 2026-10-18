import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import MagicMock, patch
from pydantic import ValidationError

from scraper.models import ScrapedRawItem
from scraper.hackathons.model import HackathonDraft
from scraper.hackathons.normalize import normalize_hackathon
from scraper.hackathons.source import HackathonSource
from scraper.hackathons.store import HackathonStore
from scraper.hackathons import run


def payload(**overrides):
    return dict(title='Future hackathon', organizer='Example organiser', format='online', location='',
        deadline='2099-01-01', start_date='2099-01-02', end_date='2099-01-04', team_min=1, team_max=4,
        eligibility='Open to all countries', description='Build a useful application', url='https://example.test/hack', published=False, **overrides)


def raw(metadata=True):
    data={'@type':'Event','name':'Future hackathon','organizer':{'name':'Example organiser'},
          'eventAttendanceMode':'https://schema.org/OnlineEventAttendanceMode','startDate':'2099-01-02T09:00:00Z','endDate':'2099-01-04T19:00:00Z'}
    return ScrapedRawItem(source_name='lablab',source_url='https://lablab.ai/ai-hackathons/example',raw_title='Future hackathon',
        raw_text='Eligible countries: All countries\nDeadline: 2099-01-01\nTeam size: 1-4\nBuild a useful application.',
        raw_html='<script type="application/ld+json">'+json.dumps(data)+'</script>' if metadata else '')


class HackathonTests(unittest.TestCase):
    def test_schema_matches_dates_location_team_and_draft_constraints(self):
        self.assertFalse(HackathonDraft(**payload()).published)
        for field,value in [('published',True),('team_max',0),('deadline','2099-02-01'),('format','onsite')]:
            data=payload();data[field]=value
            with self.assertRaises(ValidationError):HackathonDraft(**data)

    def test_complete_structured_event_parses_without_ai(self):
        draft=normalize_hackathon(raw())
        self.assertEqual(draft.team_max,4)
        self.assertEqual(draft.format,'online')
        self.assertEqual(draft.to_supabase_dict()['deadline'],'2099-01-01')

    def test_missing_event_data_is_not_invented(self):
        with self.assertRaisesRegex(ValueError,'structured event'):normalize_hackathon(raw(metadata=False))
        item=raw();item.raw_text=item.raw_text.replace('Team size: 1-4','')
        with self.assertRaisesRegex(ValueError,'team size'):normalize_hackathon(item)

    def test_known_provider_subdomains_only(self):
        spec=next(e for e in run.CATALOG if e['id']=='devfolio')
        source=HackathonSource(spec,request_delay=0)
        self.assertTrue(source._same_site('https://event.devfolio.co/'))
        self.assertFalse(source._same_site('https://event.devfolio.co.evil.test/'))
        self.assertFalse(source._same_site('https://api.devfolio.co/'))
        self.assertEqual(source.detail_links('<a href="https://event.devfolio.co/">Event</a><a href="https://devfolio.co/">Home</a>'),['https://event.devfolio.co/'])

    def test_store_only_writes_hackathon_drafts(self):
        client=MagicMock();client.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data=[]
        client.table.return_value.insert.return_value.execute.return_value.data=[{'id':'example'}]
        self.assertTrue(HackathonStore(client).insert(HackathonDraft(**payload())))
        for call in client.table.call_args_list:self.assertEqual(call.args,('hackathons',))
        self.assertFalse(client.table.return_value.insert.call_args.args[0]['published'])

    def test_existing_url_is_not_inserted(self):
        client=MagicMock();client.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data=[{'id':'existing'}]
        self.assertFalse(HackathonStore(client).insert(HackathonDraft(**payload())))
        client.table.return_value.insert.assert_not_called()

    def test_dry_run_saves_hackathon_files_without_inserting(self):
        source=MagicMock();source.fetch_opportunities.return_value=[raw()]
        with tempfile.TemporaryDirectory() as directory,patch.object(run,'OUTPUT',Path(directory)),patch.object(run,'HackathonSource',return_value=source),patch.object(run,'DatabaseClient',return_value=MagicMock(client=None)),patch.object(run.HackathonStore,'insert') as insert:
            run.main(['--source','lablab','--dry-run'])
            self.assertEqual(len(json.loads((Path(directory)/'drafts.json').read_text())),1)
            self.assertEqual(json.loads((Path(directory)/'summary.json').read_text())['ai_tokens'],0)
            insert.assert_not_called()

    def test_unclear_eligibility_is_reviewed_even_when_online(self):
        item=raw();item.raw_text='Online hackathon\nDeadline: 2099-01-01\nTeam size: 1-4'
        source=MagicMock();source.fetch_opportunities.return_value=[item]
        with tempfile.TemporaryDirectory() as directory,patch.object(run,'OUTPUT',Path(directory)),patch.object(run,'HackathonSource',return_value=source),patch.object(run,'DatabaseClient',return_value=MagicMock(client=None)):
            run.main(['--source','lablab','--dry-run'])
            self.assertEqual(len(json.loads((Path(directory)/'review.json').read_text())),1)
            self.assertEqual(json.loads((Path(directory)/'drafts.json').read_text()),[])

    def test_reviewed_import_validates_entire_file_before_mutation(self):
        with tempfile.TemporaryDirectory() as directory,patch.object(run,'OUTPUT',Path(directory)/'output'),patch.object(run,'DatabaseClient',return_value=MagicMock()),patch.object(run.HackathonStore,'insert') as insert:
            file=Path(directory)/'input.json'
            invalid=payload();invalid['published']=True
            file.write_text(json.dumps([payload(),invalid]))
            with self.assertRaises(ValidationError):run.main(['--import-reviewed',str(file)])
            insert.assert_not_called()

    def test_source_list_does_not_connect_database(self):
        with patch.object(run,'DatabaseClient') as db:
            run.main(['--list-sources'])
            db.assert_not_called()


if __name__=='__main__':unittest.main()
