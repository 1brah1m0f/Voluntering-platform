#!/usr/bin/env python3
"""Public volunteering sources → Azerbaijan eligibility → dated drafts. AI is opt-in."""
import argparse
from datetime import datetime, timezone
from functools import partial
import json
import os
from pathlib import Path
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(os.path.join(current_dir, '.env'))
    load_dotenv(os.path.join(parent_dir, '.env'))
except ImportError:
    pass

from scraper.db import DatabaseClient
from scraper.dates import stated_deadline
from scraper.eligibility import azerbaijan_eligibility
from scraper.normalizer import OpportunityNormalizer
from scraper.sources.catalog import CATALOG, BY_ID, source_catalog
from scraper.sources.html import HtmlSource

SOURCES = {entry['id']: partial(HtmlSource, entry) for entry in CATALOG}


def save_report(name, value):
    output = Path(current_dir) / 'output'
    output.mkdir(parents=True, exist_ok=True)
    (output / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__, epilog='For hackathons: python3 scrape.py --category hackathons --help')
    parser.add_argument('--source', choices=list(SOURCES) + ['all'], default='all', help='Provider id; see --list-sources')
    parser.add_argument('--scope', choices=['all', 'local', 'global'], default='all', help='Only Azerbaijani providers or international providers')
    parser.add_argument('--list-sources', action='store_true', help='Show providers and collection modes without crawling')
    parser.add_argument('--limit', type=int, default=5, help='Maximum detail pages fetched per listing provider (1–50)')
    parser.add_argument('--pages', type=int, default=1, help='Maximum listing pages per source, following next-page links (1–5)')
    parser.add_argument('--dry-run', action='store_true', help='Do not write to Supabase')
    parser.add_argument('--save-json', action='store_true', help='Also export parsed drafts to JSON')
    parser.add_argument('--use-ai', action='store_true', help='Explicitly enable Gemini normalization (uses tokens)')
    args = parser.parse_args()
    if not 1 <= args.limit <= 50:
        parser.error('--limit must be between 1 and 50')
    if not 1 <= args.pages <= 5:
        parser.error('--pages must be between 1 and 5')
    entries = source_catalog(args.scope)
    if args.source != 'all':
        entries = [entry for entry in entries if entry['id'] == args.source]
        if not entries:
            parser.error('--source is outside the selected --scope')
    if args.list_sources:
        for entry in entries:
            print(f"{entry['id']:20} {entry['scope']:6} {entry['mode']:8} {entry['name']} — {entry['url']}")
        print(f'{len(entries)} source(s). listing = dated calls; program = programme information; manual = browser/API integration needed.')
        return
    normalizer = OpportunityNormalizer(use_ai=args.use_ai)
    print(f"[pipeline] {'Gemini enabled' if normalizer.api_key else 'Local rules only — no AI tokens'}")
    db = DatabaseClient()
    if not args.dry_run and db.client is None:
        parser.error('No database connection. Configure Supabase or run with --dry-run; no drafts were inserted.')
    save_report('source-catalog.json', entries)
    raw_items, source_results = [], []
    for entry in entries:
        if entry['mode'] == 'manual':
            source_results.append({'id': entry['id'], 'status': 'manual', 'reason': entry['note'], 'items': 0})
            continue
        try:
            collector = SOURCES[entry['id']]()
            collector.pages = args.pages
            items = collector.fetch_opportunities(limit=args.limit)
            raw_items.extend(items)
            source_results.append({'id': entry['id'], 'status': 'collected' if items else 'no_calls', 'items': len(items)})
            print(f"[{entry['id']}] {len(items)} page(s) collected")
        except Exception as error:
            # One unavailable provider must not abort every other source.
            source_results.append({'id': entry['id'], 'status': 'unavailable', 'reason': str(error), 'items': 0})
            print(f"[{entry['id']}] unavailable: {error}")
    save_report('source-status.json', source_results)

    review_items, program_items, parsed_items = [], [], []
    seen = set()
    counts = dict(excluded=0, duplicate=0, expired=0, eligible=0, inserted=0)
    today = datetime.now(timezone.utc).date().isoformat()
    for raw in raw_items:
        if raw.source_url in seen:
            counts['duplicate'] += 1
            continue
        seen.add(raw.source_url)
        if raw.source_mode == 'program':
            program_items.append({**raw.model_dump(), 'review_reason': 'Programme information; current recruitment and deadline must be checked'})
            continue
        status, reason = azerbaijan_eligibility(raw.raw_text)
        # Verified local providers serve local applicants; still respect explicit exclusions.
        if (raw.source_scope == 'local' and status == 'review'
                and reason == 'No explicit participant-country requirements found'
                and BY_ID.get(raw.source_name, {}).get('scope') == 'local'):
            status, reason = 'eligible', 'Local Azerbaijani provider; individual eligibility still needs review'
        if status == 'excluded':
            counts['excluded'] += 1
            continue
        deadline = stated_deadline(raw.raw_text)
        if status != 'eligible' or not deadline:
            review_items.append({**raw.model_dump(), 'review_reason': reason if status != 'eligible' else 'No stated application deadline'})
            continue
        if deadline < today:
            counts['expired'] += 1
            continue
        # Avoid spending tokens on already imported opportunities.
        if db.exists_by_url(raw.source_url):
            counts['duplicate'] += 1
            continue
        counts['eligible'] += 1
        try:
            opportunity = normalizer.normalize(raw)
            opportunity.deadline = deadline  # Preserve the source's stated deadline, including with AI enabled.
            opportunity.published = False
            parsed_items.append(opportunity)
        except Exception as error:
            review_items.append({**raw.model_dump(), 'review_reason': f'Normalization failed: {error}'})
    # Always overwrite reports so old unclear calls cannot look like today's results.
    save_report('eligibility-review.json', review_items)
    save_report('programs-review.json', program_items)
    if args.save_json or args.dry_run:
        db.save_to_json_file(parsed_items, output_dir=os.path.join(current_dir, 'output'))
    if not args.dry_run:
        for opportunity in parsed_items:
            if db.insert_opportunity(opportunity):
                counts['inserted'] += 1
    summary = {'crawled': len(raw_items), 'parsed': len(parsed_items), 'needs_review': len(review_items), 'program_pages': len(program_items), **counts}
    save_report('summary.json', summary)
    print('[summary] ' + json.dumps(summary))
    print('[reports] scraper/output/: source-status.json, programs-review.json, eligibility-review.json, summary.json')


if __name__ == '__main__':
    main()
