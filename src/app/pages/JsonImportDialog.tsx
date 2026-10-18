import { useMemo, useState } from 'react';
import type { OpportunityInput } from '../types';
import { parseOpportunityJson } from '../importOpportunities';

interface Props {
  /** Same call the form uses to save, e.g. (input) => backend.createOpportunity(input). */
  create: (input: OpportunityInput) => Promise<unknown>;
  /** Called after at least one item was saved, so the list can reload. */
  onDone: () => void;
  onClose: () => void;
}

const EXAMPLE = `{
  "title": "Digital Content & Pedagogical Practices",
  "program": "SALTO",
  "country": "Bulqarıstan",
  "city": "Bansko",
  "deadline": "2026-10-19",
  "startDate": "2026-11-26",
  "endDate": "2026-12-02",
  "costs": "full",
  "link": "https://www.salto-youth.net/...",
  "description": "..."
}`;

export default function JsonImportDialog({ create, onDone, onClose }: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const result = useMemo(() => (text.trim() ? parseOpportunityJson(text) : null), [text]);
  const canImport = !!result && result.items.length > 0 && !busy;

  async function runImport() {
    if (!result || result.items.length === 0) return;
    setBusy(true);
    setSaveErrors([]);
    setSavedCount(null);
    const failed: string[] = [];
    let saved = 0;
    for (const item of result.items) {
      try {
        await create(item);
        saved += 1;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'naməlum xəta';
        failed.push(`${item.title}: ${msg}`);
      }
    }
    setBusy(false);
    setSavedCount(saved);
    setSaveErrors(failed);
    if (saved > 0) onDone();
    if (failed.length === 0) {
      setText('');
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="JSON-dan əlavə et"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">JSON-dan əlavə et</h2>
            <p className="mt-1 text-sm text-slate-600">
              Bir obyekt və ya obyektlərin massivini yapışdırın. Hər fürsət ayrıca yoxlanılır.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
            aria-label="Bağla"
          >
            ✕
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          spellCheck={false}
          className="mt-4 h-64 w-full rounded-xl border border-slate-300 p-3 font-mono text-xs focus:border-slate-500 focus:outline-none"
        />

        {result && (
          <div className="mt-3 space-y-2 text-sm">
            {result.items.length > 0 && (
              <p className="text-emerald-700">
                {result.items.length} fürsət hazırdır:{' '}
                {result.items.map((i) => i.title).join(', ')}
              </p>
            )}
            {result.errors.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-red-700">
                {result.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {savedCount !== null && (
          <p className="mt-3 text-sm text-slate-700">{savedCount} fürsət yadda saxlanıldı.</p>
        )}
        {saveErrors.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
            {saveErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Ləğv et
          </button>
          <button
            type="button"
            onClick={runImport}
            disabled={!canImport}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? 'Əlavə olunur…' : result && result.items.length > 1 ? `${result.items.length} fürsəti əlavə et` : 'Əlavə et'}
          </button>
        </div>
      </div>
    </div>
  );
}
