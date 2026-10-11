from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, HttpUrl

# Valid Openly taxonomy kinds
OpportunityKind = Literal[
    "youth_exchange",
    "training",
    "volunteering",
    "seminar",
    "online",
    "other",
]

# Valid cost funding types
CostCoverage = Literal["full", "partial", "none", "unknown"]

# Valid system interest IDs (see src/app/taxonomy.ts)
VALID_INTERESTS = [
    "environment",
    "education",
    "human_rights",
    "culture_arts",
    "sports",
    "digital",
    "inclusion",
    "health",
    "entrepreneurship",
    "peace",
]

class ScrapedRawItem(BaseModel):
    """Raw data crawled directly from external source."""
    source_name: str
    source_url: str
    raw_title: str
    raw_html: str
    raw_text: str

class OpportunityModel(BaseModel):
    """Standardized Opportunity matching Openly DB schema."""
    title: str = Field(..., min_length=3, max_length=160)
    program: str = Field(default="SALTO-Youth", max_length=60)
    organizer: str = Field(default="", max_length=120)
    kind: OpportunityKind = "training"
    country: str = Field(default="", max_length=60)
    city: str = Field(default="", max_length=60)
    is_online: bool = False
    interests: List[str] = Field(default_factory=list)
    deadline: str = Field(..., description="ISO Date string YYYY-MM-DD")
    start_date: Optional[str] = Field(default=None, description="ISO Date string YYYY-MM-DD")
    end_date: Optional[str] = Field(default=None, description="ISO Date string YYYY-MM-DD")
    costs: CostCoverage = "unknown"
    url: str = Field(..., description="Original application / info-pack link")
    description: str = Field(default="", max_length=5000)
    published: bool = Field(default=False, description="Always draft/pending review initially")
    sending_org: Optional[str] = Field(default="", max_length=120)
    sending_org_contact: Optional[str] = Field(default="", max_length=200)

    def to_supabase_dict(self) -> dict:
        """Converts model to dictionary for Supabase insert."""
        data = self.model_dump()
        return data
