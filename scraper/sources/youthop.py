"""Compatibility adapter; provider rules live in catalog.json."""
from .catalog import BY_ID
from .html import HtmlSource


class YouthOpportunitiesSource(HtmlSource):
    name = 'youthop'

    def __init__(self, request_delay=1.0):
        super().__init__(BY_ID['youthop'], request_delay=request_delay)
