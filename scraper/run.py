#!/usr/bin/env python3
"""
Openly Opportunity Pipeline CLI Runner.
Usage:
  python run.py --dry-run --limit 3
  python run.py --source salto --limit 10
"""

import argparse
import os
import sys

# Try loading .env from current dir or parent
try:
    from dotenv import load_dotenv
    load_dotenv()
    # also try scraper/.env
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
    # also try root .env
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass

# Ensure parent directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, ".."))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from scraper.db import DatabaseClient
from scraper.normalizer import OpportunityNormalizer
from scraper.sources.salto import SaltoYouthSource
from scraper.sources.youthop import YouthOpportunitiesSource

SOURCES = {
    "salto": SaltoYouthSource,
    "youthop": YouthOpportunitiesSource,
}

def main():
    parser = argparse.ArgumentParser(description="Openly Scraper & AI Ingestion Pipeline")
    parser.add_argument(
        "--source",
        choices=list(SOURCES.keys()) + ["all"],
        default="all",
        help="Target opportunity provider (salto, youthop, or all; default: all)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=5,
        help="Maximum opportunities to fetch per source (default: 5)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run scraping and parsing without writing to Supabase database",
    )
    parser.add_argument(
        "--save-json",
        action="store_true",
        help="Export parsed opportunities to local JSON file for inspection",
    )

    args = parser.parse_args()

    active_sources = list(SOURCES.keys()) if args.source == "all" else [args.source]

    print(f"==================================================")
    print(f"  Openly Ingestion Pipeline Starting")
    print(f"  Sources: {', '.join(active_sources)} | Limit: {args.limit} per source | Dry run: {args.dry_run}")
    print(f"==================================================")

    # 1. Initialize Components
    normalizer = OpportunityNormalizer()
    db = DatabaseClient()

    # 2. Fetch raw items from selected sources
    raw_items = []
    for src_name in active_sources:
        collector = SOURCES[src_name]()
        raw_items.extend(collector.fetch_opportunities(limit=args.limit))
    if not raw_items:
        print("[pipeline] No opportunities found.")
        return

    print(f"[pipeline] Successfully crawled {len(raw_items)} raw items. Normalizing...")

    # 3. Normalize items
    parsed_items = []
    for idx, raw in enumerate(raw_items, 1):
        print(f"[pipeline] ({idx}/{len(raw_items)}) Normalizing: {raw.raw_title}")
        try:
            opp = normalizer.normalize(raw)
            parsed_items.append(opp)
        except Exception as e:
            print(f"[pipeline] Failed to normalize '{raw.raw_title}': {e}")

    # 4. Save to JSON if requested or in dry-run mode
    if args.save_json or args.dry_run:
        out_dir = os.path.join(current_dir, "output")
        db.save_to_json_file(parsed_items, output_dir=out_dir)

    # 5. Ingest into Database (if not dry run)
    inserted_count = 0
    duplicate_count = 0

    if not args.dry_run:
        print("[pipeline] Ingesting items into database as drafts...")
        for opp in parsed_items:
            if db.exists_by_url(opp.url):
                duplicate_count += 1
            else:
                success = db.insert_opportunity(opp)
                if success:
                    inserted_count += 1
    else:
        print("[pipeline] Dry run complete. Database write skipped.")

    print(f"==================================================")
    print(f"  Summary:")
    print(f"  Crawled: {len(raw_items)}")
    print(f"  Parsed: {len(parsed_items)}")
    if not args.dry_run:
        print(f"  New Drafts Inserted: {inserted_count}")
        print(f"  Duplicates Skipped: {duplicate_count}")
    print(f"==================================================")

if __name__ == "__main__":
    main()
