"""Separate, token-free hackathon collection and draft import."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path

from ..db import DatabaseClient
from ..eligibility import azerbaijan_eligibility
from .source import HackathonSource
from .normalize import normalize_hackathon
from .model import HackathonDraft
from .store import HackathonStore

CATALOG = json.loads(Path(__file__).with_name('catalog.json').read_text())
OUTPUT = Path(__file__).parents[1] / 'output' / 'hackathons'


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', choices=['all'] + [s['id'] for s in CATALOG], default='all')
    parser.add_argument('--scope', choices=['all', 'global', 'local'], default='all')
    parser.add_argument('--list-sources', action='store_true')
    parser.add_argument('--limit', type=int, default=3)
    parser.add_argument('--pages', type=int, default=1)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--save-json', action='store_true', help='JSON reports are always saved')
    parser.add_argument('--import-reviewed', type=Path, help='Import a manually checked JSON array of complete hackathon drafts')
    args = parser.parse_args(argv)
    if not 1 <= args.limit <= 50 or not 1 <= args.pages <= 5:
        parser.error('--limit must be 1–50 and --pages must be 1–5')
    sources = [s for s in CATALOG if (args.source == 'all' or s['id'] == args.source) and (args.scope == 'all' or s['scope'] == args.scope)]
    if not sources:
        parser.error('Source does not match selected scope')
    if args.list_sources:
        for source in sources:
            print(f"{source['id']:15} {source['scope']:6} {source['mode']:8} {source['url']}")
        return
    db = DatabaseClient()
    store = HackathonStore(db.client)
    if not args.dry_run and db.client is None:
        parser.error('Configure Supabase or pass --dry-run')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    def save(name, value):
        (OUTPUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    drafts, review, statuses = [], [], []
    seen = set()
    today = datetime.now(timezone.utc).date()
    excluded = expired = duplicates = inserted = 0
    if args.import_reviewed:
        # Validate the complete input before performing any database mutation.
        data = json.loads(args.import_reviewed.read_text())
        if not isinstance(data, list):
            parser.error('Reviewed input must be a JSON array')
        drafts = [HackathonDraft.model_validate(item) for item in data]
        if any(d.deadline < today for d in drafts):
            parser.error('Reviewed input contains an expired registration deadline')
    else:
        for source in sources:
            if source['mode'] == 'manual':
                statuses.append(dict(id=source['id'], status='manual', reason=source['note']))
                continue
            try:
                collector = HackathonSource(source)
                collector.pages = args.pages
                items = collector.fetch_opportunities(limit=args.limit)
                statuses.append(dict(id=source['id'], status='collected' if items else 'no_matches', count=len(items)))
            except Exception as error:
                statuses.append(dict(id=source['id'], status='unavailable', reason=str(error)))
                continue
            for raw in items:
                reason = None
                if raw.source_url in seen:
                    duplicates += 1
                    continue
                seen.add(raw.source_url)
                if source['mode'] == 'program':
                    reason = 'General programme information, not a confirmed hackathon call'
                status, eligibility_reason = azerbaijan_eligibility(raw.raw_text)
                if status == 'excluded':
                    excluded += 1
                    continue
                if status != 'eligible':
                    reason = reason or eligibility_reason
                if reason:
                    review.append({**raw.model_dump(), 'review_reason': reason})
                    continue
                if store.exists(raw.source_url):
                    duplicates += 1
                    continue
                try:
                    draft = normalize_hackathon(raw)
                    if draft.deadline < today:
                        expired += 1
                    else:
                        drafts.append(draft)
                except Exception as error:
                    review.append({**raw.model_dump(), 'review_reason': str(error)})
    unique = []
    for draft in drafts:
        if str(draft.url) in {str(d.url) for d in unique}:
            duplicates += 1
        else:
            unique.append(draft)
    drafts = unique
    if not args.dry_run:
        for draft in drafts:
            if store.insert(draft):
                inserted += 1
    save('drafts.json', [draft.to_supabase_dict() for draft in drafts])
    save('review.json', review)
    save('source-status.json', statuses)
    summary = dict(category='hackathons', ai_tokens=0, drafts=len(drafts), review=len(review), excluded=excluded, expired=expired, duplicates=duplicates, inserted=inserted)
    save('summary.json', summary)
    print(json.dumps(summary))
    print(f'Reports: {OUTPUT}')
