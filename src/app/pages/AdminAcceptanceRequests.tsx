import { useCallback, useEffect, useState } from 'react';
import { backend } from '../backend';
import { useAppText } from '../text';
import type { AcceptanceRequest } from '../types';
import { ErrorState, Spinner } from '../ui';

export default function AdminAcceptanceRequests() {
  const { tx } = useAppText();
  const [rows, setRows] = useState<AcceptanceRequest[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    setFailed(false);
    try { setRows(await backend.listAcceptanceRequests()); }
    catch { setFailed(true); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const toggle = async (row: AcceptanceRequest) => {
    if (!confirm(tx.acceptance.confirm)) return;
    const key = `${row.user_id}/${row.opportunity_id}`;
    setBusy(key);
    try {
      await backend.setAcceptanceVerified(row.user_id, row.opportunity_id, !row.verified);
      await load();
    } catch { alert(tx.saveError); }
    finally { setBusy(null); }
  };

  return (
    <section className="mt-8 rounded-3xl border border-line bg-white p-5 shadow-card">
      <h2 className="text-xl font-bold">{tx.acceptance.title}</h2>
      <p className="mt-1 text-sm text-slate-600">{tx.acceptance.sub}</p>
      {failed ? <ErrorState onRetry={load} /> : rows === null ? <Spinner /> : rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{tx.acceptance.empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {rows.map((row) => (
            <li key={`${row.user_id}/${row.opportunity_id}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold">{row.full_name || row.email}</p>
                <p className="break-all text-sm text-slate-500">{row.email}</p>
                <p className="text-sm text-slate-700">{row.title}</p>
              </div>
              <button type="button" disabled={busy !== null} onClick={() => void toggle(row)} className="btn-secondary px-4! py-2! text-sm">
                {row.verified ? tx.acceptance.revoke : tx.acceptance.verify}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
