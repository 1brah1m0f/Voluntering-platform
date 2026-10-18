// Single place to rename the brand.
export const BRAND = 'Openly';

// Contact the team on Instagram.
export const INSTAGRAM_HANDLE = 'openlyapply';

/** Opens a DM with the team on Instagram (DMs can't be pre-filled, so the copy asks for the account email). */
export const PAYMENT_LINK = `https://ig.me/m/${INSTAGRAM_HANDLE}`;

// Shown in the landing footer. The address must be able to receive mail.
export const CONTACT_EMAIL = 'info@openlyapply.com';

// Social profiles for the footer; an empty value hides that icon.
export const SOCIAL_LINKS = {
  instagram: `https://www.instagram.com/${INSTAGRAM_HANDLE}`,
  telegram: '',
};
