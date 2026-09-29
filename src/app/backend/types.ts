import type { AiRequest, Opportunity, OpportunityInput, Peer, Plan, Profile, SavedItem, SavedLetter, SignUpResult, Status, UserRow } from '../types';

export type ProfilePatch = Partial<Pick<Profile, 'full_name' | 'interests' | 'country' | 'digest_opt_out' | 'reminders_opt_out' | 'about' | 'headline'>>;

/**
 * Error codes surfaced to the UI. Implementations throw `BackendError` with one
 * of these so pages can show a translated message.
 */
export type ErrorCode =
  | 'invalid_credentials'
  | 'email_taken'
  | 'weak_password'
  | 'email_not_confirmed'
  | 'not_allowed'
  | 'unknown'
  // AI assistant
  | 'premium_required'
  | 'daily_limit'
  | 'ai_unavailable'
  | 'not_configured'
  | 'refused';

export class BackendError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export interface Backend {
  mode: 'supabase' | 'demo';
  /** Whether "Continue with Google" can be offered. */
  supportsGoogle: boolean;

  getUserId(): Promise<string | null>;
  onAuthChange(cb: (userId: string | null) => void): () => void;
  signUp(email: string, password: string, fullName: string): Promise<SignUpResult>;
  signIn(email: string, password: string): Promise<void>;
  /** Redirects to Google; the browser comes back to `nextPath` signed in. */
  signInWithGoogle(nextPath: string): Promise<void>;
  signOut(): Promise<void>;
  /** Emails a link to /reset-password. Resolves even if the address is unknown. */
  requestPasswordReset(email: string): Promise<void>;
  /** Sets a new password for the signed-in user (also used after a reset link). */
  updatePassword(password: string): Promise<void>;

  getProfile(): Promise<Profile | null>;
  updateProfile(patch: ProfilePatch): Promise<Profile>;
  /** Uploads a (already resized) profile photo, or removes it with `null`. */
  setAvatar(image: Blob | null): Promise<Profile>;
  /** Premium user switches themselves back to the free plan. */
  cancelPremium(): Promise<Profile>;

  /** Published opportunities (admins also get drafts). */
  listOpportunities(): Promise<Opportunity[]>;
  getOpportunity(id: string): Promise<Opportunity | null>;
  createOpportunity(input: OpportunityInput): Promise<Opportunity>;
  updateOpportunity(id: string, input: OpportunityInput): Promise<Opportunity>;
  deleteOpportunity(id: string): Promise<void>;

  /** Opportunities still in the Premium-only window (for the free-plan teaser). */
  premiumEarlyCount(): Promise<number>;

  /** Admin only. */
  listUsers(): Promise<UserRow[]>;
  setUserPlan(userId: string, plan: Plan): Promise<void>;

  /** Premium AI assistant; `result` shape depends on the action (see AiQuestions/AiDraft/AiReview). */
  ai(request: AiRequest): Promise<{ result: unknown; remaining: number }>;
  /** Whether the AI assistant is deployed and has an API key; false until it's set up. */
  aiStatus(): Promise<boolean>;

  /** The user's saved motivation letter for an opportunity, if any. */
  getLetter(opportunityId: string): Promise<SavedLetter | null>;
  saveLetter(opportunityId: string, content: string): Promise<SavedLetter>;

  /** Application prep for a tracked opportunity: checklist and private note. */
  updateTracking(opportunityId: string, patch: { checklist?: string[]; note?: string }): Promise<void>;
  /** Opt in/out of sharing contact details with others accepted to the same opportunity. */
  setShareContact(opportunityId: string, share: boolean): Promise<void>;
  /** Others accepted to the opportunity who share (empty unless the caller is accepted and sharing). */
  acceptedPeers(opportunityId: string): Promise<Peer[]>;

  listSaved(): Promise<SavedItem[]>;
  /** Throws FreeLimitError when a free-plan user is at the limit. */
  save(opportunityId: string): Promise<SavedItem>;
  setStatus(opportunityId: string, status: Status): Promise<void>;
  unsave(opportunityId: string): Promise<void>;
}
