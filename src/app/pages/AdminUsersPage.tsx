import { useCallback, useEffect, useState } from 'react';
import { Crown, Search, Shield } from 'lucide-react';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { useAppText } from '../text';
import type { AccountType, Plan, UserRow } from '../types';

/** Plans each account type can have (mirrors set_user_plan in app.sql). */
const PLANS_FOR: Record<AccountType, Plan[]> = { regular: ['basic', 'premium'], student: ['basic', 'student'] };
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

  const planName = (pl: Plan) => (pl === 'student' ? tx.profile.student : pl === 'premium' ? tx.profile.premium : tx.profile.basic);
  const setPlan = async (row: UserRow, plan: Plan) => {
    if (!confirm(u.confirmPlan(row.email, planName(plan)))) return;
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

  const typeName = (t: AccountType) => (t === 'student' ? u.typeStudent : u.typeRegular);
  const setType = async (row: UserRow, type: AccountType) => {
    if (!confirm(u.confirmType(row.email, typeName(type)))) return;
    setBusyId(row.id);
    try {
      await backend.setAccountType(row.id, type);
      // Same rule as the server: a plan the new type doesn't have goes back to basic.
      const plan = PLANS_FOR[type].includes(row.plan) ? row.plan : 'basic';
      setUsers((list) => (list ?? []).map((x) => (x.id === row.id ? { ...x, account_type: type, plan } : x)));
      if (row.id === profile?.id) await refresh();
    } catch (err) {
      console.error('[admin] set account type failed', err);
      alert(tx.saveError);
    } finally {
      setBusyId(null);
    }
  };

  const q = query.trim().toLowerCase();
  const visible = users.filter((x) => !q || `${x.full_name} ${x.email}`.toLowerCase().includes(q));
  const premiumCount = users.filter((x) => x.plan === 'premium').length;
  const studentCount = users.filter((x) => x.plan === 'student').length;

  return (
    <div>
      <AdminTabs />
      <div className="rounded-[2rem] border border-line bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{tx.nav.admin}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{u.title}</h1>
        <p className="mt-1 text-slate-600">{u.sub(users.length, premiumCount, studentCount)}</p>
      </div>

      <label className="relative mt-5 block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={u.search} aria-label={u.search} className={`${inputClass} pl-10`} />
      </label>

      {visible.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-slate-300 py-12 text-center text-slate-500">{u.empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-3xl border border-line bg-white shadow-card">
          {visible.map((x) => {
            const premium = x.plan !== 'basic';
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
                    <p className="text-xs text-slate-500">
                      {u.joined}: {formatDate(x.created_at.slice(0, 10), lang)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <select
                    value={x.account_type}
                    disabled={busyId === x.id}
                    onChange={(e) => setType(x, e.target.value as AccountType)}
                    aria-label={u.typeLabel}
                    className={`rounded-full border px-3 py-1.5 text-sm font-bold ${
                      x.account_type === 'student' ? 'border-violet-200 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {(['regular', 'student'] as const).map((t) => (
                      <option key={t} value={t}>
                        {typeName(t)}
                      </option>
                    ))}
                  </select>
                  {premium && <Crown className={`h-4 w-4 ${x.plan === 'student' ? 'text-violet-600' : 'text-amber-500'}`} aria-hidden="true" />}
                  <select
                    value={x.plan}
                    disabled={busyId === x.id}
                    onChange={(e) => setPlan(x, e.target.value as Plan)}
                    aria-label={u.planLabel}
                    className={`rounded-full border px-3 py-1.5 text-sm font-bold ${
                      x.plan === 'student' ? 'border-violet-200 bg-violet-50 text-violet-800' : premium ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {PLANS_FOR[x.account_type].map((pl) => (
                      <option key={pl} value={pl}>
                        {planName(pl)}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
