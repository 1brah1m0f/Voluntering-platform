import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { backend } from './backend';
import { FreeLimitError, type Opportunity, type SavedItem, type Status } from './types';
import { useAppText } from './text';
import { useAuth } from './AuthContext';

interface DataState {
  opportunities: Opportunity[] | null;
  saved: Map<string, SavedItem>;
  error: boolean;
  reload: () => Promise<void>;
  /** Returns false when blocked by the free-plan limit (a dialog is shown). */
  save: (id: string) => Promise<boolean>;
  unsave: (id: string) => Promise<void>;
  setStatus: (id: string, status: Status) => Promise<void>;
  setShareContact: (id: string, share: boolean) => Promise<void>;
  updateTracking: (id: string, patch: { checklist?: string[]; note?: string }) => Promise<void>;
  /** Keep the cache in sync after admin edits. */
  upsertOpportunity: (o: Opportunity) => void;
  removeOpportunity: (id: string) => void;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { tx } = useAppText();
  const [opportunities, setOpportunities] = useState<Opportunity[] | null>(null);
  const [saved, setSaved] = useState<Map<string, SavedItem>>(new Map());
  const [error, setError] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);

  const { userId } = useAuth();

  // Guests browse the public list; saved items exist only for signed-in users.
  const reload = useCallback(async () => {
    setError(false);
    try {
      const [opps, items] = await Promise.all([backend.listOpportunities(), userId ? backend.listSaved() : Promise.resolve([])]);
      setOpportunities(opps);
      setSaved(new Map(items.map((s) => [s.opportunity_id, s])));
    } catch (err) {
      console.error('[data] load failed', err);
      setError(true);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(async (id: string) => {
    try {
      const item = await backend.save(id);
      setSaved((m) => new Map(m).set(id, item));
      return true;
    } catch (err) {
      if (err instanceof FreeLimitError) {
        setLimitOpen(true);
        return false;
      }
      throw err;
    }
  }, []);

  const unsave = useCallback(async (id: string) => {
    await backend.unsave(id);
    setSaved((m) => {
      const next = new Map(m);
      next.delete(id);
      return next;
    });
  }, []);

  const setStatus = useCallback(async (id: string, status: Status) => {
    await backend.setStatus(id, status);
    setSaved((m) => {
      const cur = m.get(id);
      return cur ? new Map(m).set(id, { ...cur, status, updated_at: new Date().toISOString() }) : m;
    });
  }, []);

  const setShareContact = useCallback(async (id: string, share: boolean) => {
    await backend.setShareContact(id, share);
    setSaved((m) => {
      const cur = m.get(id);
      return cur ? new Map(m).set(id, { ...cur, share_contact: share }) : m;
    });
  }, []);

  const updateTracking = useCallback(async (id: string, patch: { checklist?: string[]; note?: string }) => {
    // Optimistic: checkboxes should respond instantly; roll back if the save fails.
    let before: SavedItem | undefined;
    setSaved((m) => {
      before = m.get(id);
      return before ? new Map(m).set(id, { ...before, ...patch }) : m;
    });
    try {
      await backend.updateTracking(id, patch);
    } catch (err) {
      setSaved((m) => (before ? new Map(m).set(id, before) : m));
      throw err;
    }
  }, []);

  const upsertOpportunity = useCallback((o: Opportunity) => {
    setOpportunities((list) => {
      const rest = (list ?? []).filter((x) => x.id !== o.id);
      return [...rest, o].sort((a, b) => a.deadline.localeCompare(b.deadline));
    });
  }, []);

  const removeOpportunity = useCallback((id: string) => {
    setOpportunities((list) => (list ?? []).filter((x) => x.id !== id));
    setSaved((m) => {
      const next = new Map(m);
      next.delete(id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ opportunities, saved, error, reload, save, unsave, setStatus, setShareContact, updateTracking, upsertOpportunity, removeOpportunity }),
    [opportunities, saved, error, reload, save, unsave, setStatus, setShareContact, updateTracking, upsertOpportunity, removeOpportunity],
  );

  return (
    <DataContext.Provider value={value}>
      {children}
      {limitOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="limit-title">
          <div className="w-full max-w-sm animate-[row-in_0.25s_ease] rounded-3xl bg-white p-6 text-center shadow-2xl">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-coral-400 to-coral-600 text-white">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 id="limit-title" className="mt-4 text-xl font-extrabold">
              {tx.limit.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{tx.limit.text}</p>
            <div className="mt-6 flex flex-col gap-2">
              <Link to="/app/tracker" onClick={() => setLimitOpen(false)} className="btn-primary w-full">
                {tx.limit.manage}
              </Link>
              <button type="button" onClick={() => setLimitOpen(false)} className="btn-secondary w-full">
                {tx.limit.ok}
              </button>
            </div>
          </div>
        </div>
      )}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}
