import json
import os
from datetime import datetime
from typing import List, Optional

from .models import OpportunityModel

class DatabaseClient:
    """Handles connection to Supabase and deduplication checks."""

    def __init__(self, supabase_url: Optional[str] = None, service_role_key: Optional[str] = None):
        self.url = supabase_url or os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
        self.key = service_role_key or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.client = None

        if self.url and self.key:
            try:
                from supabase import create_client
                self.client = create_client(self.url, self.key)
                print("[db] Connected to Supabase successfully.")
            except ImportError:
                print("[db] Warning: 'supabase' package not installed. Run 'pip install supabase'.")
            except Exception as e:
                print(f"[db] Warning: Failed to connect to Supabase: {e}")
        else:
            print("[db] Notice: No Supabase credentials found in environment. Running in mock/local mode.")

    def exists_by_url(self, url: str) -> bool:
        """Checks if an opportunity with this URL already exists in Supabase."""
        if not self.client:
            return False

        try:
            res = self.client.table("opportunities").select("id").eq("url", url).limit(1).execute()
            return len(res.data) > 0
        except Exception as e:
            print(f"[db] Error checking duplicate for {url}: {e}")
            return False

    def insert_opportunity(self, opp: OpportunityModel) -> bool:
        """Inserts an opportunity with published = False (Draft / Pending Review)."""
        if not self.client:
            print(f"[db] [MOCK INSERT] Would insert draft opportunity: '{opp.title}' ({opp.url})")
            return True

        if self.exists_by_url(opp.url):
            print(f"[db] Skipping duplicate opportunity: '{opp.title}'")
            return False

        try:
            payload = opp.to_supabase_dict()
            res = self.client.table("opportunities").insert(payload).execute()
            if res.data:
                print(f"[db] Successfully inserted draft opportunity: '{opp.title}' (ID: {res.data[0].get('id')})")
                return True
            return False
        except Exception as e:
            print(f"[db] Failed to insert '{opp.title}': {e}")
            return False

    def save_to_json_file(self, opportunities: List[OpportunityModel], output_dir: str = "output") -> str:
        """Saves a batch of opportunities to a local JSON file (useful for dry runs and audits)."""
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join(output_dir, f"opportunities_{timestamp}.json")
        data = [o.model_dump() for o in opportunities]
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"[db] Saved {len(opportunities)} items to local file: {filename}")
        return filename
