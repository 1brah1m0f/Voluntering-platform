export type Status = 'saved' | 'applied' | 'accepted' | 'rejected';
export type Plan = 'basic' | 'premium';
export type Kind = 'youth_exchange' | 'training' | 'volunteering' | 'seminar' | 'online' | 'other';
export type Costs = 'full' | 'partial' | 'none' | 'unknown';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  interests: string[];
  country: string;
  plan: Plan;
  is_admin: boolean;
  /** Opted out of the new-opportunities digest email. */
  digest_opt_out: boolean;
  /** Opted out of deadline reminder emails (Premium). */
  reminders_opt_out: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  program: string;
  organizer: string;
  kind: Kind;
  country: string;
  city: string;
  is_online: boolean;
  interests: string[];
  /** ISO date (YYYY-MM-DD). */
  deadline: string;
  start_date: string | null;
  end_date: string | null;
  costs: Costs;
  url: string;
  description: string;
  published: boolean;
  created_at: string;
}

export type OpportunityInput = Omit<Opportunity, 'id' | 'created_at'>;

export interface SavedItem {
  opportunity_id: string;
  status: Status;
  created_at: string;
  updated_at: string;
}

/** Thrown when a free-plan user tries to track more than FREE_EVENT_LIMIT items. */
export class FreeLimitError extends Error {
  constructor() {
    super('FREE_LIMIT_REACHED');
  }
}

/** Returned by signUp when the account needs e-mail confirmation first. */
export type SignUpResult = 'signed_in' | 'confirm_email';
