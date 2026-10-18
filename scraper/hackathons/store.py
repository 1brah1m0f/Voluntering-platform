"""Use the existing hackathons table; never send hackathons to opportunities."""
from .model import HackathonDraft


class HackathonStore:
    def __init__(self, client):
        self.client = client

    def exists(self, url):
        if self.client is None:
            return False
        response = self.client.table('hackathons').select('id').eq('url', str(url)).limit(1).execute()
        return bool(response.data)

    def insert(self, draft: HackathonDraft):
        if self.client is None:
            raise RuntimeError('No database connection')
        if self.exists(draft.url):
            return False
        payload = draft.to_supabase_dict()
        payload['published'] = False
        response = self.client.table('hackathons').insert(payload).execute()
        return bool(response.data)
