"""Editable source registry. Add providers in catalog.json, not the CLI."""
import json
from pathlib import Path

CATALOG = json.loads(Path(__file__).with_name('catalog.json').read_text(encoding='utf-8'))
BY_ID = {entry['id']: entry for entry in CATALOG}
if len(BY_ID) != len(CATALOG):
    raise ValueError('Duplicate source ids in catalog.json')


def source_catalog(scope='all'):
    return [dict(entry) for entry in CATALOG if scope == 'all' or entry['scope'] == scope]
