import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Pencil, Pin, PinOff, Plus, StickyNote, Trash2 } from 'lucide-react';
import { backend, BackendError } from './backend';
import { useAppText } from './text';
import type { Note, NoteColor } from './types';
import { Spinner } from './ui';
import { formatDateTime } from './util';

const COLORS: Record<NoteColor, { card: string; dot: string }> = {
  yellow: { card: 'border-amber-200 bg-amber-50', dot: 'bg-amber-300' },
  mint: { card: 'border-emerald-200 bg-emerald-50', dot: 'bg-emerald-300' },
  sky: { card: 'border-sky-200 bg-sky-50', dot: 'bg-sky-300' },
  pink: { card: 'border-rose-200 bg-rose-50', dot: 'bg-rose-300' },
  lilac: { card: 'border-violet-200 bg-violet-50', dot: 'bg-violet-300' },
};
const COLOR_IDS = Object.keys(COLORS) as NoteColor[];

const sortNotes = (list: Note[]) => [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at));

/** The user's notes with add / update / remove that keep the list in order. */
function useNotes() {
  const { tx } = useAppText();
  const [notes, setNotes] = useState<Note[] | null>(null);
  useEffect(() => {
    backend.listNotes().then(setNotes, (err) => {
      console.error('[notes] load failed', err);
      setNotes([]);
    });
  }, []);
  const fail = (err: unknown) => {
    console.error('[notes] save failed', err);
    alert(err instanceof BackendError && err.code === 'notes_limit' ? tx.notes.limit : tx.saveError);
  };
  const add = async (body: string, color: NoteColor) => {
    try {
      const n = await backend.addNote(body, color);
      setNotes((cur) => sortNotes([n, ...(cur ?? [])]));
      return true;
    } catch (err) {
      fail(err);
      return false;
    }
  };
  const update = async (id: string, patch: Partial<Pick<Note, 'body' | 'color' | 'pinned'>>) => {
    try {
      const n = await backend.updateNote(id, patch);
      setNotes((cur) => sortNotes((cur ?? []).map((x) => (x.id === id ? n : x))));
      return true;
    } catch (err) {
      fail(err);
      return false;
    }
  };
  const remove = async (id: string) => {
    if (!confirm(tx.notes.confirmRemove)) return;
    try {
      await backend.deleteNote(id);
      setNotes((cur) => (cur ?? []).filter((x) => x.id !== id));
    } catch (err) {
      fail(err);
    }
  };
  return { notes, add, update, remove };
}

function ColorDots({ value, onChange }: { value: NoteColor; onChange: (c: NoteColor) => void }) {
  const { tx } = useAppText();
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label={tx.notes.color}>
      {COLOR_IDS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          onClick={() => onChange(c)}
          className={`h-5 w-5 rounded-full ${COLORS[c].dot} ring-offset-1 transition hover:scale-110 ${value === c ? 'ring-2 ring-ink' : ''}`}
        />
      ))}
    </div>
  );
}

function Composer({ onAdd, compact = false }: { onAdd: (body: string, color: NoteColor) => Promise<boolean>; compact?: boolean }) {
  const { tx } = useAppText();
  const [body, setBody] = useState('');
  const [color, setColor] = useState<NoteColor>('yellow');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    if (await onAdd(body.trim(), color)) setBody('');
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className={`rounded-2xl border p-3 transition ${COLORS[color].card}`}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        rows={compact ? 2 : 3}
        placeholder={tx.notes.ph}
        aria-label={tx.notes.ph}
        className="w-full resize-y border-0 bg-transparent p-1 text-sm text-ink outline-none placeholder:text-slate-500 focus:ring-0"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <ColorDots value={color} onChange={setColor} />
        <button type="submit" disabled={busy || !body.trim()} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-sm font-bold text-white transition hover:bg-brand-900 disabled:opacity-40">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {tx.notes.add}
        </button>
      </div>
    </form>
  );
}

function NoteCard({ note, onUpdate, onRemove }: { note: Note; onUpdate: ReturnType<typeof useNotes>['update']; onRemove: (id: string) => void }) {
  const { tx, lang } = useAppText();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body);
  const [color, setColor] = useState(note.color);
  const save = async () => {
    if (!draft.trim()) return;
    if (await onUpdate(note.id, { body: draft.trim(), color })) setEditing(false);
  };
  return (
    <article className={`mb-3 break-inside-avoid rounded-2xl border p-4 shadow-sm ${COLORS[editing ? color : note.color].card}`}>
      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            rows={4}
            autoFocus
            className="w-full resize-y border-0 bg-transparent p-0 text-sm text-ink outline-none focus:ring-0"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <ColorDots value={color} onChange={setColor} />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraft(note.body);
                  setColor(note.color);
                }}
                className="rounded-full px-3 py-1 text-xs font-bold text-slate-600 hover:bg-white/70"
              >
                {tx.notes.cancel}
              </button>
              <button type="button" onClick={save} className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
                {tx.notes.save}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="whitespace-pre-line break-words text-sm leading-relaxed text-ink">{note.body}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[0.6875rem] font-medium text-slate-500">{formatDateTime(note.updated_at, lang)}</span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onUpdate(note.id, { pinned: !note.pinned })}
                title={note.pinned ? tx.notes.unpin : tx.notes.pin}
                aria-label={note.pinned ? tx.notes.unpin : tx.notes.pin}
                className={`rounded-full p-1.5 transition hover:bg-white/70 ${note.pinned ? 'text-coral-600' : 'text-slate-400'}`}
              >
                {note.pinned ? <Pin className="h-4 w-4 fill-current" aria-hidden="true" /> : <PinOff className="h-4 w-4" aria-hidden="true" />}
              </button>
              <button type="button" onClick={() => setEditing(true)} title={tx.notes.edit} aria-label={tx.notes.edit} className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/70 hover:text-ink">
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => onRemove(note.id)} title={tx.notes.remove} aria-label={tx.notes.remove} className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/70 hover:text-rose-600">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

/** Profile → Notes: write, pin, colour, edit and delete private notes. */
export function NotesBoard() {
  const { tx } = useAppText();
  const { notes, add, update, remove } = useNotes();
  return (
    <section className="mt-6 space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <StickyNote className="h-5 w-5 text-amber-500" aria-hidden="true" />
          {tx.notes.title}
          {notes && notes.length > 0 && <span className="text-sm font-semibold text-slate-500">· {tx.notes.count(notes.length)}</span>}
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">{tx.notes.sub}</p>
      </div>
      <Composer onAdd={add} />
      {notes === null ? (
        <Spinner label={tx.loading} />
      ) : notes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line py-10 text-center text-sm text-slate-500">{tx.notes.empty}</p>
      ) : (
        <div className="columns-1 gap-3 sm:columns-2">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} onUpdate={update} onRemove={remove} />
          ))}
        </div>
      )}
    </section>
  );
}

/** Home page: a quick note box and the latest (pinned first) notes. */
export function NotesMini() {
  const { tx } = useAppText();
  const { notes, add, update, remove } = useNotes();
  return (
    <section className="rounded-3xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold">
          <StickyNote className="h-4 w-4 text-amber-500" aria-hidden="true" />
          {tx.notes.title}
        </h2>
        <Link to="/app/profile?tab=notes" className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline">
          {tx.notes.seeAll}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <Composer onAdd={add} compact />
      {notes && notes.length > 0 && (
        <div className="mt-3">
          {notes.slice(0, 3).map((n) => (
            <NoteCard key={n.id} note={n} onUpdate={update} onRemove={remove} />
          ))}
        </div>
      )}
    </section>
  );
}
