import { useState } from 'react';
import { CalendarPlus, Check, Link2, Send } from 'lucide-react';
import { useAppText } from './text';
import type { Opportunity } from './types';
import { formatDate } from './util';

/** Public link to an opportunity page (the one with a link preview for chats). */
export const opportunityUrl = (id: string) => `${window.location.origin}/o/${id}`;

const ymd = (iso: string) => iso.replace(/-/g, '');
function nextDay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  return t.toISOString().slice(0, 10);
}

/** Escaping for iCalendar text values (RFC 5545 §3.3.11). */
const icsText = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');

/** An all-day event on the deadline, with a reminder three days before. */
function downloadIcs(o: Opportunity, title: string, details: string) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Openly//Deadlines//AZ',
    'BEGIN:VEVENT',
    `UID:${o.id}-deadline@openlyapply.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${ymd(o.deadline)}`,
    `DTEND;VALUE=DATE:${ymd(nextDay(o.deadline))}`,
    `SUMMARY:${icsText(title)}`,
    `DESCRIPTION:${icsText(details)}`,
    `URL:${opportunityUrl(o.id)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(title)}`,
    'TRIGGER:-P3D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'openly-deadline.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.12c-.25.69-1.44 1.32-1.99 1.37-.51.05-1 .24-3.35-.7-2.83-1.12-4.62-4.02-4.76-4.2-.14-.19-1.13-1.5-1.13-2.87 0-1.36.72-2.03.97-2.31.25-.28.55-.35.74-.35l.53.01c.17 0 .4-.06.62.48.25.6.84 2.05.91 2.2.07.15.12.32.02.51-.1.2-.15.32-.29.49l-.44.52c-.15.14-.3.3-.13.59.17.29.76 1.26 1.64 2.04 1.13 1 2.08 1.31 2.37 1.46.29.14.46.12.63-.07.17-.2.72-.84.92-1.13.19-.29.38-.24.64-.14.26.09 1.66.78 1.94.93.29.14.48.21.55.33.07.12.07.69-.18 1.37Z" />
    </svg>
  );
}

/** Share the opportunity (WhatsApp, Telegram, copy link) and put its deadline in a calendar. */
export function ShareCard({ o }: { o: Opportunity }) {
  const { tx, lang } = useAppText();
  const [copied, setCopied] = useState(false);
  const url = opportunityUrl(o.id);
  const text = tx.share.text(o.title, formatDate(o.deadline, lang));
  const eventTitle = tx.share.eventTitle(o.title);
  const details = `${o.title}\n${url}\n${o.url}`;
  const google =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(eventTitle)}&dates=${ymd(o.deadline)}/${ymd(nextDay(o.deadline))}&details=${encodeURIComponent(details)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const btn = 'inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-semibold transition';
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
      <p className="text-sm font-bold text-slate-900">{tx.share.title}</p>
      <div className="flex gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
          aria-label="WhatsApp"
          title="WhatsApp"
        >
          <WhatsAppIcon className="h-5 w-5" />
        </a>
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} bg-sky-50 text-sky-800 hover:bg-sky-100`}
          aria-label="Telegram"
          title="Telegram"
        >
          <Send className="h-5 w-5" aria-hidden="true" />
        </a>
        <button type="button" onClick={copy} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`} aria-label={tx.share.copy} title={tx.share.copy}>
          {copied ? <Check className="h-5 w-5" aria-hidden="true" /> : <Link2 className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
      {copied && (
        <p role="status" className="text-xs font-medium text-emerald-700">
          {tx.share.copied}
        </p>
      )}
      <div className="border-t border-slate-100 pt-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <CalendarPlus className="h-4 w-4 text-brand-600" aria-hidden="true" />
          {tx.share.calendar}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
          <a href={google} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">
            {tx.share.google}
          </a>
          <button type="button" onClick={() => downloadIcs(o, eventTitle, details)} className="text-brand-700 hover:underline">
            {tx.share.ics}
          </button>
        </div>
      </div>
    </section>
  );
}
