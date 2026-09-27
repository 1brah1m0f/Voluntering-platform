// Single place to rename the brand.
export const BRAND = 'Fürsət';

// Free plan limit shown in pricing copy.
export const FREE_EVENT_LIMIT = 5;

/**
 * Optional: send waitlist signups to a Google Form instead of Supabase.
 * `formId` is the long id in the form's share link
 * (https://docs.google.com/forms/d/e/<formId>/viewform); `fields` are the
 * `entry.<number>` names of its four short-answer questions.
 * Leave as null to use Supabase (or the local demo handler).
 */
export const GOOGLE_FORM: {
  formId: string;
  fields: { name: string; email: string; plan: string; lang: string };
} | null = {
  // "Fürsət – Erkən giriş"
  formId: '1FAIpQLSccfsyZdvuXBxYz1dOCJEnneRx-Pxb_lFGKq84GreZHS1lX2A',
  fields: {
    name: 'entry.1042636337', // Ad Soyad
    email: 'entry.1953271272', // E-poçt
    plan: 'entry.377757911', // Plan seç
    lang: 'entry.1656793712', // Dil
  },
};
