"""Compatibility adapter; provider rules live in catalog.json."""
from .catalog import BY_ID
from .html import HtmlSource


class SaltoYouthSource(HtmlSource):
    name = 'salto'

    def __init__(self, request_delay=1.0):
        super().__init__(BY_ID['salto'], request_delay=request_delay)
