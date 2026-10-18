import json
import re
from bs4 import BeautifulSoup
from ..dates import stated_deadline
from .model import HackathonDraft


def events(data):
    if isinstance(data, list):
        for item in data:
            yield from events(item)
    elif isinstance(data, dict):
        types = data.get('@type', [])
        if isinstance(types, str):
            types = [types]
        if any(t in ['Event', 'Hackathon', 'EducationEvent'] for t in types):
            yield data
        yield from events(data.get('@graph', []))


def normalize_hackathon(raw):
    event = None
    for script in BeautifulSoup(raw.raw_html, 'html.parser').select('script[type="application/ld+json"]'):
        try:
            candidates = list(events(json.loads(script.string or script.get_text())))
        except (TypeError, ValueError):
            continue
        if len(candidates) == 1:
            event = candidates[0]
            break
    if not event:
        raise ValueError('No unambiguous structured event data; fill dates/organizer/team details in review')
    text = raw.raw_text
    deadline = stated_deadline(text)
    if not deadline:
        raise ValueError('No stated registration deadline')
    team = re.search(r'team(?: size|s)?\s*[:\-]?\s*(\d+)\s*(?:-|–|to)\s*(\d+)', text, re.I)
    if not team:
        raise ValueError('No explicit minimum/maximum team size')
    organizer = event.get('organizer', {})
    if not isinstance(organizer, dict) or not organizer.get('name'):
        raise ValueError('Organizer not stated in event metadata')
    attendance = str(event.get('eventAttendanceMode', '')).split('/')[-1]
    formats = {'OnlineEventAttendanceMode':'online', 'OfflineEventAttendanceMode':'onsite', 'MixedEventAttendanceMode':'hybrid'}
    if attendance not in formats:
        raise ValueError('Event format not explicitly stated')
    location = event.get('location', {})
    if isinstance(location, list):
        location = next((item for item in location if isinstance(item, dict) and item.get('@type') == 'Place'), {})
    venue = location.get('name', '') if isinstance(location, dict) else ''
    return HackathonDraft(title=event.get('name') or raw.raw_title, organizer=organizer['name'],
        format=formats[attendance], location=venue, deadline=deadline,
        start_date=str(event.get('startDate', ''))[:10], end_date=str(event.get('endDate', ''))[:10],
        team_min=int(team[1]), team_max=int(team[2]), eligibility=text[:3000],
        description=BeautifulSoup(str(event.get('description') or text), 'html.parser').get_text(' ', strip=True)[:12000],
        url=raw.source_url, published=False)
