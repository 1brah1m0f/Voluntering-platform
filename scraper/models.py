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
        """Converts model to dictionary for Supabase insert with strict sanitization."""
        data = self.model_dump()
        # Ensure optional dates are null in Postgres rather than empty strings
        if not data.get("start_date"):
            data["start_date"] = None
        if not data.get("end_date"):
            data["end_date"] = None

        # Guarantee DB schema column length constraints
        data["title"] = data["title"][:160]
        data["program"] = data["program"][:60]
        data["organizer"] = data["organizer"][:120]
        data["country"] = data["country"][:60]
        data["city"] = data["city"][:60]
        data["description"] = data["description"][:5000]
        data["sending_org"] = (data.get("sending_org") or "")[:120]
        data["sending_org_contact"] = (data.get("sending_org_contact") or "")[:200]
        return data
