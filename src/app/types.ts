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
  /** Student plan: level, field, IELTS and budget from "My plan". */
  student_prefs?: StudentPrefs;
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

/** What a scholarship pays for. */
export type Cover = 'tuition' | 'stipend' | 'housing' | 'flights' | 'insurance' | 'language';

/** Text columns with an English version in `en`. */
export type ScholarshipText = 'name' | 'provider' | 'country' | 'coverage' | 'deadline_note' | 'eligibility' | 'how_to_apply';
export type UniversityText = 'name' | 'city' | 'country' | 'language' | 'tuition_note' | 'app_fee_note' | 'exams' | 'requirements' | 'deadline_note' | 'scholarships_note';

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  country: string;
  levels: StudyLevel[];
  /** Empty = any field. */
  fields: string[];
  coverage: string;
  /** Exact next deadline, once announced. */
  deadline: string | null;
  deadline_note: string;
  eligibility: string;
  how_to_apply: string;
  url: string;
  sort: number;
  en: Partial<Record<ScholarshipText, string>>;
  covers: Cover[];
  funding: 'full' | 'partial' | null;
  /** Usual application window (1–12), when the official page names it. */
  opens_month: number | null;
  closes_month: number | null;
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
  en: Partial<Record<UniversityText, string>>;
  /** Month applications usually close (1–12), when it is fixed. */
  closes_month: number | null;
}

export type ShortlistStatus = 'planning' | 'applied' | 'accepted' | 'rejected';
export interface ShortlistItem {
  university_id: string;
  status: ShortlistStatus;
}
export interface SavedScholarship {
  scholarship_id: string;
  status: ShortlistStatus;
}

export interface StudentPrefs {
  level?: StudyLevel;
  /** A key of FIELDS in student/roadmap.ts. */
  field?: string;
  /** 0 or missing = no score yet. */
  ielts?: number;
  /** Euros per year. */
  budget?: number;
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
