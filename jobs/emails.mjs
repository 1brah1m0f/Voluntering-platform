// HTML + plain-text bodies for the digest and reminder emails. Table-based
// markup with inline styles so Gmail/Outlook render it like the auth emails
// in supabase/email-templates/.

import { daysBetween } from './plan.mjs';

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
const KINDS = {
  youth_exchange: 'Gənclər mübadiləsi',
  training: 'Təlim kursu',
  volunteering: 'Könüllülük',
  seminar: 'Seminar / konfrans',
  online: 'Onlayn',
  other: 'Digər',
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const date = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const daysLeft = (d) => (d <= 0 ? 'Bu gün bitir' : d === 1 ? 'Sabah bitir' : `${d} gün qaldı`);
const place = (o) => (o.is_online ? 'Onlayn' : [o.city, o.country].filter(Boolean).join(', '));
const greet = (name) => `Salam${name ? `, <strong style="color:#0f172a;">${esc(name.split(' ')[0])}</strong>` : ''}! 👋`;

function layout({ preheader, eyebrow, title, body, site }) {
  return `<!doctype html>
<html lang="az"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="color-scheme" content="light only" /><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
  <tr><td align="center" style="padding-bottom:24px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="40" height="40" align="center" valign="middle" style="background-color:#1b7a85;border-radius:12px;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;color:#ffffff;line-height:40px;">O<span style="color:#fb5d3b;">.</span></td>
      <td style="padding-left:10px;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;color:#0f172a;">Openly</td>
    </tr></table>
  </td></tr>
  <tr><td style="background-color:#ffffff;border-radius:20px;overflow:hidden;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background-color:#1b626c;background-image:linear-gradient(135deg,#1f98a1,#1b626c 55%,#082a31);padding:28px 32px 24px;font-family:Arial,Helvetica,sans-serif;">
        <p style="margin:0;font-size:13px;font-weight:bold;letter-spacing:1px;color:#afe6e7;">${esc(eyebrow)}</p>
        <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;color:#ffffff;">${esc(title)}</h1>
      </td>
    </tr></table>
    ${body}
  </td></tr>
  <tr><td align="center" style="padding:24px 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#94a3b8;">
    Bu məktubu Openly hesabındakı bildiriş ayarlarına görə alırsan.<br />
    <a href="${site}/app/profile" style="color:#64748b;">Bildiriş ayarlarını dəyiş</a> · <a href="${site}" style="color:#64748b;">openlyapply.com</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function card(o, site, badge) {
  const url = `${site}/app/o/${o.id}`;
  return `<tr><td style="padding:0 32px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:14px;">
    <tr><td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0;font-size:12px;font-weight:bold;color:#1b7a85;">${esc(o.program)}</p>
      <p style="margin:4px 0 6px;font-size:16px;font-weight:bold;line-height:1.35;"><a href="${url}" style="color:#0f172a;text-decoration:none;">${esc(o.title)}</a></p>
      <p style="margin:0 0 12px;font-size:13px;color:#64748b;">📍 ${esc(place(o) || '—')}${o.is_online && o.kind === 'online' ? '' : ` · ${esc(KINDS[o.kind] ?? '')}`}${o.costs === 'full' ? ' · <span style="color:#047857;font-weight:bold;">Xərclər qarşılanır</span>' : ''}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;"><span style="display:inline-block;padding:4px 10px;border-radius:999px;background-color:${badge.bg};color:${badge.fg};">${esc(badge.text)}</span></td>
        <td align="right"><a href="${url}" style="display:inline-block;padding:8px 16px;border-radius:999px;background-color:#c33416;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;text-decoration:none;">Bax →</a></td>
      </tr></table>
    </td></tr>
  </table>
</td></tr>`;
}

const deadlineBadge = (d) => (d <= 3 ? { bg: '#ffe6df', fg: '#a12e17' } : d <= 7 ? { bg: '#fef3c7', fg: '#92400e' } : { bg: '#effbfb', fg: '#1b626c' });

export function digestEmail({ name, premium, items, total, today, site }) {
  const n = total;
  const subject = n === 1 ? 'Sənə uyğun 1 yeni fürsət var' : `Sənə uyğun ${n} yeni fürsət var`;
  const cards = items
    .map((o) => {
      const d = daysBetween(today, o.deadline);
      return card(o, site, { ...deadlineBadge(d), text: `${daysLeft(d)} · ${date(o.deadline)}` });
    })
    .join('');
  const more =
    total > items.length
      ? `<tr><td align="center" style="padding:4px 32px 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;"><a href="${site}/app" style="color:#1b7a85;font-weight:bold;">və daha ${total - items.length} fürsət →</a></td></tr>`
      : '';
  const body = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding:24px 32px 16px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#334155;">
    <p style="margin:0 0 8px;">${greet(name)}</p>
    <p style="margin:0;">${premium ? 'Dünəndən bəri' : 'Keçən həftə'} maraqlarına uyğun yeni fürsətlər dərc olundu:</p>
  </td></tr>
  ${cards}${more}
  <tr><td align="center" style="padding:12px 32px 28px;">
    <a href="${site}/app" style="display:inline-block;padding:12px 28px;border-radius:999px;border:2px solid #1b7a85;color:#1b626c;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;">Bütün fürsətlərə bax</a>
  </td></tr>
</table>`;
  const text = [
    `Salam${name ? `, ${name.split(' ')[0]}` : ''}!`,
    '',
    `${premium ? 'Dünəndən bəri' : 'Keçən həftə'} maraqlarına uyğun yeni fürsətlər:`,
    '',
    ...items.map((o) => `• ${o.title} (${o.program}) — son tarix ${date(o.deadline)}\n  ${site}/app/o/${o.id}`),
    total > items.length ? `\n…və daha ${total - items.length}: ${site}/app` : '',
    '',
    `Bildiriş ayarları: ${site}/app/profile`,
  ].join('\n');
  return {
    subject,
    html: layout({ preheader: items.map((o) => o.title).join(' · '), eyebrow: premium ? 'GÜNDƏLİK XÜLASƏ' : 'HƏFTƏLİK XÜLASƏ', title: subject, body, site }),
    text,
  };
}

export function reminderEmail({ name, items, site }) {
  const soonest = items[0];
  const subject =
    items.length === 1 ? `⏰ “${soonest.opportunity.title}” — ${daysLeft(soonest.days).toLowerCase()}` : `⏰ ${items.length} fürsətin son tarixi yaxınlaşır`;
  const cards = items.map(({ opportunity: o, days }) => card(o, site, { ...deadlineBadge(days), text: `${daysLeft(days)} · ${date(o.deadline)}` })).join('');
  const body = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding:24px 32px 16px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#334155;">
    <p style="margin:0 0 8px;">${greet(name)}</p>
    <p style="margin:0;">Saxladığın ${items.length === 1 ? 'fürsətin' : 'fürsətlərin'} müraciət müddəti bitmək üzrədir. Hələ müraciət etməmisənsə, indi vaxtıdır:</p>
  </td></tr>
  ${cards}
  <tr><td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#64748b;">
    Artıq müraciət etmisənsə, <a href="${site}/app/tracker" style="color:#1b7a85;">Müraciətlərim</a> bölməsində statusu yenilə — daha xatırlatma göndərməyəcəyik.
  </td></tr>
</table>`;
  const text = [
    `Salam${name ? `, ${name.split(' ')[0]}` : ''}!`,
    '',
    'Saxladığın fürsətlərin son tarixi yaxınlaşır:',
    '',
    ...items.map(({ opportunity: o, days }) => `• ${o.title} — ${daysLeft(days)} (${date(o.deadline)})\n  ${site}/app/o/${o.id}`),
    '',
    `Müraciət etmisənsə, statusu yenilə: ${site}/app/tracker`,
    `Bildiriş ayarları: ${site}/app/profile`,
  ].join('\n');
  return { subject, html: layout({ preheader: 'Son tarix yaxınlaşır — müraciət etməyi unutma.', eyebrow: 'SON TARİX XATIRLATMASI', title: subject, body, site }), text };
}
