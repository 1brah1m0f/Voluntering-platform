import type { ReactNode } from 'react';
import { CalendarPlus, Check, Columns3, ExternalLink, Plus } from 'lucide-react';
import { downloadIcs } from '../ShareTools';
import { useAppText } from '../text';
import type { Scholarship, University } from '../types';
import { deadlineInfo, scholarshipFit, universityFit, yearlyCostRange } from './logic';
import { FIELDS, LEVELS } from './roadmap';
import { CoverChips, DeadlineBadge, FitBadge, SaveToggle, Section, Sheet, eur, useCostText } from './ui';
import type { StudentData } from './useStudentData';

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-paper p-3">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-bold text-ink">{children}</dd>
    </div>
  );
}

const officialLink = (url: string, label: string) => (
  <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary !py-2.5 text-sm">
    {label}
    <ExternalLink className="h-4 w-4" aria-hidden="true" />
  </a>
);

/** Everything about one scholarship: key facts first, then the full text in labelled sections. */
export function ScholarshipSheet({ s, data, onClose }: { s: Scholarship | null; data: StudentData; onClose: () => void }) {
  const { tx, lang } = useAppText();
  const info = s ? deadlineInfo(s) : null;
  const saved = !!s && data.saved.some((x) => x.scholarship_id === s.id);
  return (
    <Sheet
      open={!!s}
      onClose={onClose}
      title={s?.name}
      footer={
        s && (
          <>
            {officialLink(s.url, tx.student.officialPage)}
            <SaveToggle on={saved} onClick={() => data.sch.toggle(s.id)} />
            {info?.kind === 'exact' && (
              <button
                type="button"
                onClick={() => downloadIcs({ uid: `scholarship-${s.id}`, date: info.date, title: `${tx.student.deadline}: ${s.name}`, details: s.deadline_note, link: s.url })}
                className="btn-secondary !py-2.5 text-sm"
              >
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                {tx.share.ics}
              </button>
            )}
          </>
        )
      }
    >
      {s && info && (
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-brand-700">
              {s.provider} · {s.country}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <DeadlineBadge info={info} />
              <FitBadge fit={scholarshipFit(s, data.prefs)} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <Fact label={tx.student.level}>{s.levels.map((l) => LEVELS[l]?.[lang] ?? l).join(', ')}</Fact>
            <Fact label={tx.student.field}>{s.fields.length ? s.fields.map((x) => FIELDS[x]?.[lang] ?? x).join(', ') : tx.student.anyField}</Fact>
          </dl>
          <CoverChips covers={s.covers} />
          <Section title={tx.student.coverage}>{s.coverage}</Section>
          <Section title={tx.student.eligibility}>{s.eligibility}</Section>
          <Section title={tx.student.howToApply}>{s.how_to_apply}</Section>
          <Section title={tx.student.deadline}>{s.deadline_note}</Section>
          <p className="text-xs text-slate-500">{tx.student.disclaimer}</p>
        </div>
      )}
    </Sheet>
  );
}

/** Everything about one university: the numbers first, then fees, requirements and deadlines in full. */
export function UniversitySheet({
  u,
  data,
  comparing,
  compareFull,
  onToggleCompare,
  onClose,
}: {
  u: University | null;
  data: StudentData;
  comparing: boolean;
  compareFull: boolean;
  onToggleCompare: () => void;
  onClose: () => void;
}) {
  const { tx, lang } = useAppText();
  const costText = useCostText();
  const listed = !!u && data.shortlist.some((x) => x.university_id === u.id);
  const tuition =
    u && (u.tuition_min_eur !== null || u.tuition_max_eur !== null)
      ? u.tuition_min_eur !== null && u.tuition_max_eur !== null && u.tuition_min_eur !== u.tuition_max_eur
        ? `${eur(u.tuition_min_eur)} – ${eur(u.tuition_max_eur)}`
        : eur((u.tuition_min_eur ?? u.tuition_max_eur)!)
      : tx.student.unknown;
  return (
    <Sheet
      open={!!u}
      onClose={onClose}
      title={u?.name}
      footer={
        u && (
          <>
            {officialLink(u.url, tx.student.officialPage)}
            <button
              type="button"
              onClick={() => data.uni.add(u.id)}
              disabled={listed}
              className={`inline-flex min-h-[2.75rem] items-center gap-1.5 rounded-full px-4 text-sm font-bold ${listed ? 'bg-emerald-50 text-emerald-800' : 'bg-brand-50 text-brand-900 hover:bg-brand-100'}`}
            >
              {listed ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
              {listed ? tx.student.inShortlist : tx.student.addShortlist}
            </button>
            <button
              type="button"
              onClick={onToggleCompare}
              aria-pressed={comparing}
              disabled={!comparing && compareFull}
              title={!comparing && compareFull ? tx.student.compareMax : undefined}
              className="btn-secondary !py-2.5 text-sm disabled:opacity-60"
            >
              <Columns3 className="h-4 w-4" aria-hidden="true" />
              {tx.student.compare}
              {comparing && <Check className="h-4 w-4 text-brand-700" aria-hidden="true" />}
            </button>
          </>
        )
      }
    >
      {u && (
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-brand-700">
              {[u.city, u.country].filter(Boolean).join(', ')} · {u.language}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <FitBadge fit={universityFit(u, data.prefs)} minIelts={u.min_ielts} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <Fact label={tx.student.yearCost}>{costText(yearlyCostRange(u))}</Fact>
            <Fact label={`${tx.student.tuition}${tx.student.perYear}`}>{tuition}</Fact>
            <Fact label={`${tx.student.living}${tx.student.perMonth}`}>{u.living_eur_month ? `~${eur(u.living_eur_month)}` : '—'}</Fact>
            <Fact label={tx.student.appFee}>{u.app_fee_eur === null ? '—' : u.app_fee_eur === 0 ? tx.student.free : `~${eur(u.app_fee_eur)}`}</Fact>
            <Fact label="IELTS">{u.min_ielts !== null ? `${u.min_ielts}+` : '—'}</Fact>
            <Fact label={tx.student.level}>{u.levels.map((l) => LEVELS[l]?.[lang] ?? l).join(', ')}</Fact>
          </dl>
          <Section title={tx.student.tuition}>{u.tuition_note}</Section>
          <Section title={tx.student.appFee}>{u.app_fee_note}</Section>
          {u.exams && <Section title={tx.student.exams}>{u.exams}</Section>}
          <Section title={tx.student.requirements}>{u.requirements}</Section>
          <Section title={tx.student.deadline}>{u.deadline_note}</Section>
          {u.scholarships_note && <Section title={tx.student.scholarshipsNote}>{u.scholarships_note}</Section>}
          <div>
            <h3 className="text-base font-bold">{tx.student.field}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {u.fields.map((x) => (
                <span key={x} className="rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {FIELDS[x]?.[lang] ?? x}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500">{tx.student.disclaimer}</p>
        </div>
      )}
    </Sheet>
  );
}
