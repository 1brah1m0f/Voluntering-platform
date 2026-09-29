export type Status = 'saved' | 'applied' | 'accepted' | 'rejected';
export type Plan = 'basic' | 'premium' | 'student';
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
  /** Profile photo URL ('' = show initials). */
  avatar_url: string;
  /** One line under the name, e.g. "Student · ADA University". */
  headline: string;
  /** Student plan: ids of the ticked study-abroad roadmap steps. */
  roadmap?: string[];
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
  /** Youth exchanges are applied to through a partner organisation in Azerbaijan. */
  sending_org?: string;
  /** Its email, phone or website. */
  sending_org_contact?: string;
}

export type OpportunityInput = Omit<Opportunity, 'id' | 'created_at'>;

// --- Premium AI assistant (supabase/functions/ai) ---------------------------

export type AiRequest =
  | { action: 'questions'; opportunityId: string; lang: 'az' | 'en' }
  | { action: 'draft'; opportunityId: string; lang: 'az' | 'en'; letterLang: 'az' | 'en'; answers: { question: string; answer: string }[] }
  | {
      action: 'review';
      opportunityId: string;
      lang: 'az' | 'en';
      docType: 'letter' | 'cv';
      /** Pasted / extracted text; ignored when a PDF `file` is attached. */
      text: string;
      file?: { name: string; mimeType: 'application/pdf'; data: string };
    };

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
  /** When accepted: shares name and email with others accepted to the same opportunity. */
  share_contact?: boolean;
  /** Ticked application-prep items (ids from checklist.ts). */
  checklist?: string[];
  /** Private note, e.g. "wrote to the sending organisation on Monday". */
  note?: string;
}

/** Another participant accepted to the same opportunity who shares their contact. */
export interface Peer {
  full_name: string;
  email: string;
  avatar_url: string;
  headline: string;
  country: string;
}

// --- Student section (Student plan) ----------------------------------------
export type StudyLevel = 'bachelor' | 'master' | 'phd';

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  country: string;
  levels: StudyLevel[];
  /** Empty = any field. */
  fields: string[];
  coverage: string;
  deadline: string | null;
  deadline_note: string;
  eligibility: string;
  how_to_apply: string;
  url: string;
  sort: number;
}

export interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  fields: string[];
  levels: StudyLevel[];
  language: string;
  /** Per year, euros; estimates. */
  tuition_min_eur: number | null;
  tuition_max_eur: number | null;
  tuition_note: string;
  living_eur_month: number | null;
  /** 0 = no fee, null = unknown. */
  app_fee_eur: number | null;
  app_fee_note: string;
  min_ielts: number | null;
  exams: string;
  requirements: string;
  deadline_note: string;
  scholarships_note: string;
  url: string;
  sort: number;
}

export type ShortlistStatus = 'planning' | 'applied' | 'accepted' | 'rejected';
export interface ShortlistItem {
  university_id: string;
  status: ShortlistStatus;
}

export interface SavedSearch {
  id: string;
  name: string;
  /** Filter URL parameters, e.g. "kind=training&country=Almaniya". */
  params: string;
  last_seen_at: string;
  created_at: string;
}

export interface SavedLetter {
  content: string;
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
