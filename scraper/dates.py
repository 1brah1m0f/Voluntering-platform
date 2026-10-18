"""Extract stated application deadlines without inventing dates."""
import re
from datetime import datetime

MONTHS = {
    'yanvar': 'January', 'fevral': 'February', 'mart': 'March', 'aprel': 'April',
    'may': 'May', 'iyun': 'June', 'iyul': 'July', 'avqust': 'August',
    'sentyabr': 'September', 'oktyabr': 'October', 'noyabr': 'November', 'dekabr': 'December',
}
LABEL = re.compile(r'(?:application\s+deadline|deadline(?:\s+(?:for applications|to apply))?|son\s+(?:müraciət\s+)?tarix|müraciət(?:lərin)?\s+(?:son\s+)?(?:tarixi|müddəti)|qeydiyyat(?:ın)?\s+son\s+tarixi)\s*[:\-]?\s*', re.I)


def stated_deadline(text):
    for match in LABEL.finditer(text):
        value = text[match.end():match.end() + 140].strip()
        value = re.sub(r'^\(24h UTC\)\s*:?\s*', '', value, flags=re.I)
        value = re.sub(r'(\d)(?:st|nd|rd|th)\b', r'\1', value, flags=re.I)
        for az, en in MONTHS.items():
            value = re.sub(r'\b' + az + r'\b', en, value, flags=re.I)
        for pattern, formats in [
            (r'^\d{4}-\d{2}-\d{2}', ['%Y-%m-%d']),
            (r'^\d{1,2}[./]\d{1,2}[./]\d{4}', ['%d.%m.%Y', '%d/%m/%Y']),
            (r'^\d{1,2}\s+[A-Za-z]+\s+\d{4}', ['%d %B %Y', '%d %b %Y']),
            (r'^[A-Za-z]+\s+\d{1,2},?\s+\d{4}', ['%B %d, %Y', '%B %d %Y', '%b %d, %Y', '%b %d %Y']),
        ]:
            found = re.search(pattern, value)
            if found:
                for fmt in formats:
                    try:
                        return datetime.strptime(found.group(), fmt).date().isoformat()
                    except ValueError:
                        pass
    return None
