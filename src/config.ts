// Single place to rename the brand.
export const BRAND = 'Openly';

// Free plan limit shown in pricing copy.
export const FREE_EVENT_LIMIT = 3;

// Premium / Student plan purchases go through WhatsApp for now (070 903 40 41),
// in international format without "+" for wa.me links.
export const WHATSAPP_NUMBER = '994709034041';

/** A wa.me link that opens a chat with the team, with the message already typed. */
export const whatsappLink = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

// Shown in the landing footer. The address must be able to receive mail.
export const CONTACT_EMAIL = 'info@openlyapply.com';

// Social profiles for the footer; an empty value hides that icon.
export const SOCIAL_LINKS = {
  instagram: '',
  telegram: '',
};
