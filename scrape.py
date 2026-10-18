#!/usr/bin/env python3
"""Openly veb-scraping skriptinin əsas giriş nöqtəsi.

Layihənin əsas qovluğundan işə sal:
    python3 scrape.py --help
    python3 scrape.py --list-sources
    python3 scrape.py --scope local --dry-run --limit 3
    python3 scrape.py --source all --dry-run --limit 3

Elanların toplanması: scraper/sources/
Məlumatın emalı: scraper/normalizer.py
Bazaya yazılması: scraper/db.py
Əsas axın və CLI parametrləri: scraper/run.py
Mənbə siyahısı: scraper/SOURCES.md
Mənbə ayarları: scraper/sources/catalog.json
Ətraflı təlimat: scraper/README.md
"""

if __name__ == "__main__":
    from scraper.run import main

    main()
