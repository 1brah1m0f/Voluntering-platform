import json
import os
import re
from datetime import datetime
from typing import Optional

from .models import OpportunityModel, ScrapedRawItem, VALID_INTERESTS
from .dates import stated_deadline

class OpportunityNormalizer:
    """Transforms raw scraped text/HTML into a standardized Openly OpportunityModel."""

    def __init__(self, gemini_api_key: Optional[str] = None, model_name: Optional[str] = None, use_ai: bool = False):
        self.api_key = (gemini_api_key or os.getenv("GEMINI_API_KEY")) if use_ai else None
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

    def normalize(self, raw: ScrapedRawItem) -> OpportunityModel:
        """Uses local rules by default; Gemini requires explicit use_ai=True."""
        if self.api_key:
            try:
                result = self._gemini_extract(raw)
                if result:
                    return result
            except Exception as e:
                print(f"[normalizer] Gemini extraction failed for '{raw.raw_title}': {e}. Falling back to heuristics.")

        return self._heuristic_extract(raw)

    def _gemini_extract(self, raw: ScrapedRawItem) -> Optional[OpportunityModel]:
        """Uses Google Gemini API to extract structured fields."""
        import importlib
        try:
            genai_mod = importlib.import_module("google.genai")
            client = genai_mod.Client(api_key=self.api_key)
            use_new_sdk = True
        except ImportError:
            try:
                genai_legacy = importlib.import_module("google.generativeai")
                genai_legacy.configure(api_key=self.api_key)
                client = genai_legacy.GenerativeModel(self.model_name)
                use_new_sdk = False
            except ImportError:
                print("[normalizer] Neither 'google-genai' nor 'google-generativeai' installed.")
                return None

        prompt = f"""
You are an expert parser for Openly (a volunteering and youth exchange platform).
Extract structured opportunity details from this raw webpage text into a valid JSON object.

Allowed 'kind': ["youth_exchange", "training", "volunteering", "seminar", "online", "other"]
Allowed 'costs': ["full", "partial", "none", "unknown"]
Allowed 'interests' (subset of): {VALID_INTERESTS}
Format for dates: YYYY-MM-DD.

Input URL: {raw.source_url}
Raw Title: {raw.raw_title}

Raw Content Snippet:
{raw.raw_text[:4000]}

Respond ONLY with a JSON object in this exact schema:
{{
  "title": "Clean, concise title (max 160 chars)",
  "program": "e.g. SALTO-Youth, Erasmus+, or European Solidarity Corps",
  "organizer": "Organizing entity",
  "kind": "training",
  "country": "Country name in English or Azerbaijani",
  "city": "City name if known",
  "is_online": false,
  "interests": ["selected", "interests"],
  "deadline": "YYYY-MM-DD",
  "start_date": "YYYY-MM-DD or null",
  "end_date": "YYYY-MM-DD or null",
  "costs": "full",
  "url": "{raw.source_url}",
  "description": "Clear 2-3 sentence overview of this opportunity."
}}
"""
        raw_json_str = ""
        if use_new_sdk:
            resp = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            raw_json_str = resp.text
        else:
            resp = client.generate_content(prompt)
            raw_json_str = resp.text

        # Extract JSON from markdown fences if any
        json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_json_str, re.DOTALL)
        if json_match:
            clean_json = json_match.group(1)
        else:
            clean_json = raw_json_str.strip()

        data = json.loads(clean_json)
        data["published"] = False  # Always draft
        return OpportunityModel(**data)

    def _heuristic_extract(self, raw: ScrapedRawItem) -> OpportunityModel:
        """Regex and rule-based heuristic extraction when AI is unavailable."""
        text = raw.raw_text

        # Detect deadline (e.g. "Application deadline: 25 October 2026" or "Deadline: 2026-10-25")
        deadline = stated_deadline(text)
        if not deadline:
            raise ValueError("No stated application deadline; manual review required")

        # Detect country / venue
        country_match = re.search(r"(?:Venue|Location|Country)[\s:]+([A-Za-z\s]+)", text, re.IGNORECASE)
        country = country_match.group(1).strip() if country_match else ""

        # Online detection
        is_online = False
        lower_country = country.lower()
        lower_title = raw.raw_title.lower()
        if any(w in lower_country for w in ("online", "zoom", "virtual", "internet")) or any(w in lower_title for w in ("webinar", "online course", "virtual")):
            is_online = True
            country = ""
        elif not country:
            if "online" in text[:600].lower() or "zoom" in text[:600].lower():
                is_online = True
            else:
                country = "Azərbaycan" if raw.source_scope == "local" else "Beynəlxalq"

        # Provider metadata must not label every new source as SALTO.
        program = raw.source_program or ("Youth Opportunities" if raw.source_name == "youthop" else "SALTO-Youth")
        organizer = ""  # An aggregator is not necessarily the organising institution.
        if "Erasmus+" in text:
            program = "Erasmus+"
        elif "European Solidarity Corps" in text:
            program = "European Solidarity Corps"
        if raw.source_scope == 'local' and not country and not is_online:
            country = 'Azərbaycan'

        # Detect kind
        kind = "training" if raw.source_name in ("salto", "youthop") else "volunteering"
        if is_online and ("webinar" in lower_title or "online" in lower_title):
            kind = "online"
        elif "youth exchange" in lower_title or "mübadilə" in lower_title:
            kind = "youth_exchange"
        elif "volunteer" in lower_title or "volunteering" in lower_title:
            kind = "volunteering"
        elif "fellowship" in lower_title or "fellow" in lower_title:
            kind = "youth_exchange"
        elif "seminar" in lower_title or "conference" in lower_title:
            kind = "seminar"

        # Detect costs
        costs = "unknown"
        if re.search(r"(100%|fully funded|travel costs are covered|accommodation and food|tam qarşılanır)", text, re.IGNORECASE):
            costs = "full"
        elif re.search(r"(participation fee|partially funded|qismən)", text, re.IGNORECASE):
            costs = "partial"

        # Detect relevant interests
        interests = []
        interest_keywords = {
            "environment": ["climate", "green", "environment", "ecology", "nature", "sustainability"],
            "digital": ["digital", "ai", "media", "tech", "coding", "online tools", "cyber"],
            "inclusion": ["inclusion", "disability", "deaf", "diversity", "minorities", "special needs"],
            "education": ["education", "learning", "pedagogy", "training", "youth work", "fellowship", "school"],
            "human_rights": ["human rights", "equality", "democracy", "justice", "activism", "civic"],
            "sports": ["sport", "healthy", "outdoor", "fitness"],
            "entrepreneurship": ["business", "finance", "entrepreneur", "startup", "economic autonomy"],
        }
        lower_text = text.lower()
        for cat, keywords in interest_keywords.items():
            if any(kw in lower_text for kw in keywords):
                interests.append(cat)
        if not interests:
            interests = ["education"]

        # Clean title to fit within 160 characters
        clean_title = re.sub(r"\s+", " ", raw.raw_title).strip()
        if len(clean_title) > 160:
            clean_title = clean_title[:157] + "..."

        # Description cleanup: remove common breadcrumbs and navigation text
        clean_body = re.sub(r"(SALTO-YOUTH\s*-\s*European Training Calendar.*?(?:newsletter|priorities)|About SALTO.*?Humans of SALTO)", "", text, flags=re.IGNORECASE | re.DOTALL)
        clean_desc = re.sub(r"\s+", " ", clean_body).strip()
        if not clean_desc or len(clean_desc) < 30:
            clean_desc = f"{clean_title} - {program} çərçivəsində beynəlxalq gənclər imkanı."
        else:
            clean_desc = clean_desc[:800]

        return OpportunityModel(
            title=clean_title,
            program=program,
            organizer=organizer,
            kind=kind,
            country=country[:60],
            city="",
            is_online=is_online,
            interests=interests[:4],
            deadline=deadline,
            costs=costs,
            url=raw.source_url,
            description=clean_desc,
            published=False,
        )

    def _find_date(self, text: str, pattern: str) -> Optional[str]:
        match = re.search(pattern, text, re.IGNORECASE)
        if not match:
            return None
        date_str = match.group(1).strip()
        # Try various date formats
        for fmt in ("%d %B %Y", "%d %b %Y", "%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y"):
            try:
                # Remove ordinal suffixes like 15th, 1st
                clean_date = re.sub(r"(\d+)(?:st|nd|rd|th)", r"\1", date_str)
                # Take first 3-4 words max
                snippet = " ".join(clean_date.split()[:3])
                dt = datetime.strptime(snippet, fmt)
                return dt.strftime("%Y-%m-%d")
            except Exception:
                continue
        return None
