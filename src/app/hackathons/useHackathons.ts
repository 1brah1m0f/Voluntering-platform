import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { backend } from '../backend';
import type { Hackathon, HackathonEntry } from './types';

export function useHackathons() {
  const { userId, profile } = useAuth();
  const admin = !!profile?.is_admin;
  const [data, setData] = useState<{ userId: string; rows: Hackathon[]; entries: HackathonEntry[] } | null>(null);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion(v => v + 1), []);
  useEffect(() => {
    let active = true;
    setError(false);
    if (!admin || !userId) { setData(null); return; }
    Promise.all([backend.listHackathons(), backend.listHackathonEntries()]).then(([rows, entries]) => {
      if (active) setData({ userId, rows, entries });
    }, () => { if (active) setError(true); });
    return () => { active = false; };
  }, [admin, userId, version]);
  const visible = admin && data?.userId === userId ? data : null;
  return { rows: visible?.rows ?? null, entries: visible?.entries ?? [], error, reload };
}
