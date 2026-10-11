from abc import ABC, abstractmethod
from typing import List
from ..models import ScrapedRawItem

class BaseSource(ABC):
    """Abstract base class for all opportunity scrapers."""

    name: str = "base"

    @abstractmethod
    def fetch_opportunities(self, limit: int = 10) -> List[ScrapedRawItem]:
        """Fetch latest raw opportunity items from the source."""
        pass
