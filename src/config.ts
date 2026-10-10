// Single place to rename the brand.
export const BRAND = 'Openly';

// Free plan limit shown in pricing copy.
export const FREE_EVENT_LIMIT = 3;

// Premium / Student plan purchases go through this Instagram account.
export const INSTAGRAM_PAYMENT_URL = 'https://www.instagram.com/openlyapply';

/** Instagram profile link used as the payment contact path. */
export const instagramLink = (_text?: string) => INSTAGRAM_PAYMENT_URL;

// Shown in the landing footer. The address must be able to receive mail.
export const CONTACT_EMAIL = 'info@openlyapply.com';

// Social profiles for the footer; an empty value hides that icon.
export const SOCIAL_LINKS = {
  instagram: '',
  telegram: '',
};
