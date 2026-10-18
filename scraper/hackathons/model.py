from datetime import date
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator


class HackathonDraft(BaseModel):
    """Matches public.hackathons without introducing schema changes."""
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    title: str = Field(min_length=1, max_length=160)
    organizer: str = Field(min_length=1, max_length=160)
    format: Literal['online', 'onsite', 'hybrid']
    location: str = Field(default='', max_length=200)
    deadline: date
    start_date: date
    end_date: date
    team_min: int = Field(ge=1, le=100)
    team_max: int = Field(ge=1, le=100)
    prize: str = Field(default='', max_length=200)
    technologies: list[str] = Field(default_factory=list, max_length=30)
    themes: list[str] = Field(default_factory=list, max_length=20)
    level: Literal['all', 'beginner', 'experienced'] = 'all'
    eligibility: str = Field(min_length=1, max_length=3000)
    description: str = Field(min_length=1, max_length=12000)
    url: HttpUrl
    published: Literal[False] = False

    @model_validator(mode='after')
    def validate_constraints(self):
        if not self.deadline <= self.start_date <= self.end_date:
            raise ValueError('Existing app requires deadline <= start_date <= end_date; review the source dates')
        if self.team_max < self.team_min:
            raise ValueError('team_max must be at least team_min')
        if self.format != 'online' and not self.location:
            raise ValueError('Onsite/hybrid events require a stated location')
        return self

    def to_supabase_dict(self):
        return self.model_dump(mode='json')
