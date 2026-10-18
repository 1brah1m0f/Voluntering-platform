"""Conservative, token-free country eligibility checks before normalization."""
import re
from typing import Literal

Status = Literal['eligible', 'excluded', 'review']
AZ = r'\b(?:azerbaijan|azerbaijani|azerbaycan|azərbaycan)\b'
HEAD = re.compile(r'^(?:eligible (?:countries|regions)|eligibilit(?:y|ies)|eligible participants|participants? (?:from|countries)|target (?:countries|group)|this activity is for participants from|who can apply)\s*[:?]?', re.I)
STOP = re.compile(r'^(?:costs?|funding|benefits|description|application|deadline|dates?|venue|location|organis[ez]er|contact|how to apply|learning objectives|working language|team|accommodation)\b', re.I)
GLOBAL = re.compile(r'\b(?:all countries|any country|all nationalities|any nationality|worldwide|globally|all over the world|around the world)\b', re.I)


def azerbaijan_eligibility(text: str) -> tuple[Status, str]:
    """Only explicit participation rules qualify; a venue/country mention does not."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    sections = []
    # SALTO separates ‘for’, participant count and ‘from’ into individual DOM lines.
    salto_participants = re.search(r'\bfor\s+\d+\s+participants\s+from\s+(.+?)(?=and recommended for|Working language|Organiser|Accessibility|$)', text, re.I | re.S)
    if salto_participants:
        sections.append(salto_participants.group(1))
    for i, line in enumerate(lines):
        if HEAD.match(line):
            block = [line]
            for following in lines[i + 1:i + 31]:
                if STOP.match(following) or HEAD.match(following):
                    break
                block.append(following)
            sections.append(' '.join(block))
        elif re.search(r'\b(?:open to|applications? (?:are )?(?:accepted|welcome) from|applicants? from|citizens? of|citizen and current resident of|nationals? of)\b', line, re.I):
            sections.append(line)
    if not sections:
        return 'review', 'No explicit participant-country requirements found'
    for section in sections:
        # Reject exclusions before considering inclusive wording in the same section.
        if re.search(r'(?:except|excluding|not open to|not eligible[^.;]*|ineligible[^.;]*)\s*[^.;]{0,60}' + AZ, section, re.I) or re.search(AZ + r'[^.;]{0,60}\b(?:not eligible|ineligible|excluded)\b', section, re.I):
            return 'excluded', 'Azerbaijan explicitly excluded'
    # Azerbaijan is an Eastern Partnership country (Council of the EU):
    # https://www.consilium.europa.eu/en/policies/eastern-partnership/
    if any(re.search(r'\bEastern Partnership countries\b', section, re.I)
           and not re.search(r'(?:except|excluding|not open to)\s+Eastern Partnership', section, re.I)
           for section in sections):
        return 'eligible', 'Participation open to Eastern Partnership countries, including Azerbaijan'
    if any(re.search(AZ, section, re.I) for section in sections):
        return 'eligible', 'Azerbaijan explicitly included in participation requirements'
    # A global statement with exceptions needs manual inspection rather than guessing.
    if any(GLOBAL.search(section) and not re.search(r'\b(?:except|excluding|only|restrictions?)\b', section, re.I) for section in sections):
        return 'eligible', 'Participation explicitly open worldwide'
    # Broad regional/programme groups need interpretation; do not infer membership.
    if any(re.search(r'\b(?:countries|citizens|nationals|participants from)\b', section, re.I) for section in sections):
        return 'review', 'Country restrictions do not explicitly confirm Azerbaijan'
    return 'review', 'Eligibility unclear; manual review required'
