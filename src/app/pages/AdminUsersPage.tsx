import { useCallback, useEffect, useState } from 'react';
import { Crown, Search, Shield } from 'lucide-react';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { useAppText } from '../text';
import type { Plan, UserRow } from '../types';
import { ErrorState, Spinner, inputClass } from '../ui';
import { formatDate } from '../util';
import { AdminTabs } from './AdminPages';

export default function AdminUsersPage() {
  const { tx, lang } = useAppText();
  const u = tx.users;
  const { profile, refresh } = useAuth();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      setUsers(await backend.listUsers());
    } catch (err) {
      console.error('[admin] users load failed', err);
      setError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState onRetry={load} />;
  if (!users) return <Spinner label={tx.loading} />;

  const setPlan = async (row: UserRow, plan: Plan) => {
    if (!confirm(plan === 'premium' ? u.confirmPremium(row.email) : u.confirmBasic(row.email))) return;
    setBusyId(row.id);
    try {
      await backend.setUserPlan(row.id, plan);
      setUsers((list) => (list ?? []).map((x) => (x.id === row.id ? { ...x, plan } : x)));
      if (row.id === profile?.id) await refresh(); // admin changed their own plan
    } catch (err) {
      console.error('[admin] set plan failed', err);
      alert(tx.saveError);
    } finally {
      setBusyId(null);
    }
  };

  const q = query.trim().toLowerCase();
  const visible = users.filter((x) => !q || `${x.full_name} ${x.email}`.toLowerCase().includes(q));
  const premiumCount = users.filter((x) => x.plan === 'premium').length;

  return (
    <div>
      <AdminTabs />
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{u.title}</h1>
      <p className="mt-1 text-slate-600">{u.sub(users.length, premiumCount)}</p>

      <label className="relative mt-5 block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={u.search} aria-label={u.search} className={`${inputClass} pl-10`} />
      </label>

      {visible.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-slate-300 py-12 text-center text-slate-500">{u.empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {visible.map((x) => {
            const premium = x.plan === 'premium';
            const initials = (x.full_name || x.email)
              .split(/\s+/)
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <li key={x.id} className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${busyId === x.id ? 'opacity-50' : ''}`}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      premium ? 'bg-gradient-to-br from-amber-400 to-coral-600' : 'bg-gradient-to-br from-brand-400 to-brand-700'
                    }`}
                  >
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-1.5 font-bold text-slate-900">
                      <span className="truncate">{x.full_name || '—'}</span>
                      {x.is_admin && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                          <Shield className="h-3 w-3" aria-hidden="true" />
                          {u.admin}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-sm text-slate-500">{x.email}</p>
                    <p className="text-xs text-slate-400">
                      {u.joined}: {formatDate(x.created_at.slice(0, 10), lang)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${premium ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                    {premium && <Crown className="h-3.5 w-3.5" aria-hidden="true" />}
                    {premium ? 'Premium' : tx.premium.free}
                  </span>
                  <button
                    type="button"
                    disabled={busyId === x.id}
                    onClick={() => setPlan(x, premium ? 'basic' : 'premium')}
                    className={premium ? 'btn-secondary !px-3 !py-1.5 text-sm' : 'btn-primary !px-3 !py-1.5 text-sm'}
                  >
                    {premium ? u.makeBasic : u.makePremium}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
