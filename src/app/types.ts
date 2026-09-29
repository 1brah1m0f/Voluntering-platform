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
  /** Education, experience, skills — context for the AI assistant. */
  about: string;
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

// --- Premium AI assistant (supabase/functions/ai) ---------------------------

export type AiRequest =
  | { action: 'questions'; opportunityId: string; lang: 'az' | 'en' }
  | { action: 'draft'; opportunityId: string; lang: 'az' | 'en'; letterLang: 'az' | 'en'; answers: { question: string; answer: string }[] }
  | { action: 'review'; opportunityId: string; lang: 'az' | 'en'; docType: 'letter' | 'cv'; text: string };

export interface AiQuestions {
  questions: { question: string; why: string }[];
}
export interface AiDraft {
  draft: string;
  tips: string[];
  missing_info: string[];
}
export interface AiReview {
  score: number;
  verdict: string;
  strengths: string[];
  issues: { quote: string; problem: string; suggestion: string }[];
  missing: string[];
}

/** A user row as seen in Admin → Users. */
export type UserRow = Profile & { created_at: string };

/** New opportunities are Premium-only for this long after publishing. */
export const PREMIUM_EARLY_HOURS = 24;

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
