import { useId, useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { OTHER_PROGRAM, PROGRAMS } from '../../lib/programs';
import { backend } from '../backend';
import { useData } from '../DataContext';
import { COSTS, COUNTRIES, INTERESTS, INTEREST_IDS, KINDS } from '../taxonomy';
import { useAppText } from '../text';
import type { Costs, Kind, Opportunity, OpportunityInput } from '../types';
import { Chip, DeadlineChip, ErrorState, Field, ProgramBadge, Spinner, inputClass } from '../ui';
import { formatDate } from '../util';

/** "Opportunities | Users" switch shown at the top of the admin pages. */
export function AdminTabs() {
  const { tx } = useAppText();
  const tabs = [
    { to: '/admin', label: tx.list.title },
    { to: '/admin/users', label: tx.users.title },
  ];
  return (
    <nav className="mb-5 inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200" aria-label={tx.nav.admin}>
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end
          className={({ isActive }) => `rounded-full px-4 py-1.5 text-sm font-semibold transition ${isActive ? 'bg-brand-700 text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AdminListPage() {
  const { tx, lang } = useAppText();
  const { opportunities, error, reload, upsertOpportunity, removeOpportunity } = useData();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (error) return <ErrorState onRetry={reload} />;
  if (!opportunities) return <Spinner label={tx.loading} />;

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    try {
      await fn();
    } catch (err) {
      console.error('[admin] action failed', err);
      alert(tx.saveError);
    } finally {
      setBusyId(null);
    }
  };

  const togglePublish = (o: Opportunity) =>
    run(o.id, async () => {
      const { id: _id, created_at: _c, ...input } = o;
      upsertOpportunity(await backend.updateOpportunity(o.id, { ...input, published: !o.published }));
    });

  const remove = (o: Opportunity) => {
    if (!confirm(tx.admin.confirmDelete(o.title))) return;
    void run(o.id, async () => {
      await backend.deleteOpportunity(o.id);
      removeOpportunity(o.id);
    });
  };

  return (
    <div>
      <AdminTabs />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-[2.75rem] sm:leading-[1.1]">{tx.admin.title}</h1>
          <p className="mt-1 text-slate-600 sm:mt-2 sm:text-lg">{tx.admin.sub}</p>
        </div>
        <Link to="/admin/new" className="btn-primary shrink-0 self-start !py-2.5 sm:self-auto">
          <Plus className="h-5 w-5" aria-hidden="true" />
          {tx.admin.add}
        </Link>
      </div>

      {opportunities.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed border-slate-300 py-14 text-center text-slate-500">{tx.admin.empty}</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-3xl border border-line bg-white shadow-card">
          {opportunities.map((o) => (
            <li key={o.id} className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${busyId === o.id ? 'opacity-50' : ''}`}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <ProgramBadge program={o.program} />
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">{o.title}</p>
                  <p className="text-sm text-slate-500">
                    {o.program} · {KINDS[o.kind][lang]} · {formatDate(o.deadline, lang)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <DeadlineChip deadline={o.deadline} />
                <button
                  type="button"
                  onClick={() => togglePublish(o)}
                  disabled={busyId === o.id}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${o.published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                >
                  {o.published ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
                  {o.published ? tx.admin.published : tx.admin.draft}
                </button>
                <Link to={`/admin/${o.id}`} className="rounded-full p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-700" aria-label={tx.admin.edit} title={tx.admin.edit}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => remove(o)}
                  disabled={busyId === o.id}
                  className="rounded-full p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                  aria-label={tx.admin.delete}
                  title={tx.admin.delete}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const knownPrograms = PROGRAMS.map((p) => p.name);

const empty: OpportunityInput = {
  title: '',
  program: 'Erasmus+',
  organizer: '',
  kind: 'youth_exchange',
  country: '',
  city: '',
  is_online: false,
  interests: [],
  deadline: '',
  start_date: null,
  end_date: null,
  costs: 'full',
  url: '',
  description: '',
  published: true,
};

export function AdminEditPage() {
  const { id } = useParams();
  const { tx } = useAppText();
  const { opportunities } = useData();
  if (!opportunities) return <Spinner label={tx.loading} />;
  const existing = id ? opportunities.find((o) => o.id === id) : undefined;
  if (id && !existing) {
    return <p className="rounded-3xl border border-dashed border-slate-300 py-14 text-center text-slate-500">{tx.detail.notFound}</p>;
  }
  return <OpportunityForm key={id ?? 'new'} existing={existing} />;
}

function OpportunityForm({ existing }: { existing?: Opportunity }) {
  const { tx, lang } = useAppText();
  const f = tx.admin.f;
  const { upsertOpportunity } = useData();
  const navigate = useNavigate();
  const uid = useId();

  const initial: OpportunityInput = existing ? (({ id: _i, created_at: _c, ...rest }) => rest)(existing) : empty;
  const [v, setV] = useState<OpportunityInput>(initial);
  const [otherProgram, setOtherProgram] = useState(existing && !knownPrograms.includes(existing.program) ? existing.program : '');
  const [programChoice, setProgramChoice] = useState(existing && !knownPrograms.includes(existing.program) ? OTHER_PROGRAM : initial.program);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const set = <K extends keyof OpportunityInput>(k: K, val: OpportunityInput[K]) => setV((cur) => ({ ...cur, [k]: val }));
  const toggleInterest = (i: string) => set('interests', v.interests.includes(i) ? v.interests.filter((x) => x !== i) : [...v.interests, i]);

  function validate(input: OpportunityInput) {
    const e: Record<string, string> = {};
    if (input.title.trim().length < 3) e.title = f.required;
    if (!input.program.trim()) e.program = f.required;
    if (!input.deadline) e.deadline = f.required;
    if (!/^https?:\/\/\S+\.\S+/.test(input.url.trim())) e.url = f.badUrl;
    if (!input.is_online && !input.country) e.country = f.required;
    if (input.start_date && input.end_date && input.end_date < input.start_date) e.end_date = f.badDates;
    return e;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const input: OpportunityInput = {
      ...v,
      title: v.title.trim(),
      program: programChoice === OTHER_PROGRAM ? otherProgram.trim() : programChoice,
      organizer: v.organizer.trim(),
      city: v.is_online ? '' : v.city.trim(),
      country: v.is_online ? '' : v.country,
      url: v.url.trim(),
      description: v.description.trim(),
      start_date: v.start_date || null,
      end_date: v.end_date || null,
      sending_org: v.sending_org?.trim(),
      sending_org_contact: v.sending_org_contact?.trim(),
    };
    // Leave the new columns out when unused, so saving still works before app.sql is re-run.
    if (!input.sending_org && !(existing && 'sending_org' in existing)) delete input.sending_org;
    if (!input.sending_org_contact && !(existing && 'sending_org_contact' in existing)) delete input.sending_org_contact;
    const errs = validate(input);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setSaveError(false);
    try {
      const saved = existing ? await backend.updateOpportunity(existing.id, input) : await backend.createOpportunity(input);
      upsertOpportunity(saved);
      navigate('/admin');
    } catch (err) {
      console.error('[admin] save failed', err);
      setSaveError(true);
    } finally {
      setBusy(false);
    }
  }

  const id = (k: string) => `${uid}-${k}`;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {tx.back}
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{existing ? tx.admin.editTitle : tx.admin.newTitle}</h1>

      <form onSubmit={submit} noValidate className="mt-6 space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <Field label={f.title} htmlFor={id('title')} error={errors.title}>
          <input id={id('title')} value={v.title} maxLength={160} onChange={(e) => set('title', e.target.value)} className={inputClass} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={f.program} htmlFor={id('program')} error={errors.program}>
            <select id={id('program')} value={programChoice} onChange={(e) => setProgramChoice(e.target.value)} className={inputClass}>
              {knownPrograms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value={OTHER_PROGRAM}>{OTHER_PROGRAM}…</option>
            </select>
          </Field>
          {programChoice === OTHER_PROGRAM ? (
            <Field label={f.otherProgram} htmlFor={id('other')} error={errors.program}>
              <input id={id('other')} value={otherProgram} maxLength={60} onChange={(e) => setOtherProgram(e.target.value)} className={inputClass} />
            </Field>
          ) : (
            <Field label={f.organizer} htmlFor={id('org')}>
              <input id={id('org')} value={v.organizer} maxLength={120} onChange={(e) => set('organizer', e.target.value)} className={inputClass} />
            </Field>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={f.kind} htmlFor={id('kind')}>
            <select id={id('kind')} value={v.kind} onChange={(e) => set('kind', e.target.value as Kind)} className={inputClass}>
              {(Object.keys(KINDS) as Kind[]).map((k) => (
                <option key={k} value={k}>
                  {KINDS[k][lang]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={f.costs} htmlFor={id('costs')}>
            <select id={id('costs')} value={v.costs} onChange={(e) => set('costs', e.target.value as Costs)} className={inputClass}>
              {(Object.keys(COSTS) as Costs[]).map((c) => (
                <option key={c} value={c}>
                  {COSTS[c][lang]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <input
            type="checkbox"
            checked={v.is_online}
            onChange={(e) => set('is_online', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          {f.online}
        </label>

        {!v.is_online && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={f.country} htmlFor={id('country')} error={errors.country}>
              <input id={id('country')} list={id('countries')} value={v.country} maxLength={60} onChange={(e) => set('country', e.target.value)} className={inputClass} />
              <datalist id={id('countries')}>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label={f.city} htmlFor={id('city')}>
              <input id={id('city')} value={v.city} maxLength={60} onChange={(e) => set('city', e.target.value)} className={inputClass} />
            </Field>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={f.deadline} htmlFor={id('deadline')} error={errors.deadline}>
            <input id={id('deadline')} type="date" value={v.deadline} onChange={(e) => set('deadline', e.target.value)} className={inputClass} />
          </Field>
          <Field label={f.start} htmlFor={id('start')}>
            <input id={id('start')} type="date" value={v.start_date ?? ''} onChange={(e) => set('start_date', e.target.value || null)} className={inputClass} />
          </Field>
          <Field label={f.end} htmlFor={id('end')} error={errors.end_date}>
            <input id={id('end')} type="date" value={v.end_date ?? ''} onChange={(e) => set('end_date', e.target.value || null)} className={inputClass} />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-800">{f.interests}</legend>
          <div className="flex flex-wrap gap-2">
            {INTEREST_IDS.map((i) => (
              <Chip key={i} on={v.interests.includes(i)} onClick={() => toggleInterest(i)}>
                {INTERESTS[i][lang]}
              </Chip>
            ))}
          </div>
        </fieldset>

        <Field label={f.url} htmlFor={id('url')} error={errors.url}>
          <input id={id('url')} type="url" inputMode="url" value={v.url} placeholder="https://" onChange={(e) => set('url', e.target.value)} className={inputClass} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={f.sendingOrg} htmlFor={id('sorg')} hint={f.sendingOrgHint}>
            <input id={id('sorg')} value={v.sending_org ?? ''} maxLength={120} onChange={(e) => set('sending_org', e.target.value)} className={inputClass} />
          </Field>
          <Field label={f.sendingOrgContact} htmlFor={id('sorgc')}>
            <input
              id={id('sorgc')}
              value={v.sending_org_contact ?? ''}
              maxLength={200}
              placeholder="info@example.az"
              onChange={(e) => set('sending_org_contact', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label={f.description} htmlFor={id('desc')}>
          <textarea id={id('desc')} rows={6} maxLength={5000} value={v.description} onChange={(e) => set('description', e.target.value)} className={`${inputClass} resize-y`} />
        </Field>

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <input
            type="checkbox"
            checked={v.published}
            onChange={(e) => set('published', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          {f.publish}
        </label>

        {saveError && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
            {tx.saveError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link to="/admin" className="btn-secondary">
            {f.cancel}
          </Link>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {f.save}
          </button>
        </div>
      </form>
    </div>
  );
}
