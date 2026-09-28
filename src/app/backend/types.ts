import type { Opportunity, OpportunityInput, Profile, SavedItem, SignUpResult, Status } from '../types';

export type ProfilePatch = Partial<Pick<Profile, 'full_name' | 'interests' | 'country'>>;

/**
 * Error codes surfaced to the UI. Implementations throw `BackendError` with one
 * of these so pages can show a translated message.
 */
export type ErrorCode = 'invalid_credentials' | 'email_taken' | 'weak_password' | 'email_not_confirmed' | 'not_allowed' | 'unknown';

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

  getProfile(): Promise<Profile | null>;
  updateProfile(patch: ProfilePatch): Promise<Profile>;

  /** Published opportunities (admins also get drafts). */
  listOpportunities(): Promise<Opportunity[]>;
  getOpportunity(id: string): Promise<Opportunity | null>;
  createOpportunity(input: OpportunityInput): Promise<Opportunity>;
  updateOpportunity(id: string, input: OpportunityInput): Promise<Opportunity>;
  deleteOpportunity(id: string): Promise<void>;

  listSaved(): Promise<SavedItem[]>;
  /** Throws FreeLimitError when a free-plan user is at the limit. */
  save(opportunityId: string): Promise<SavedItem>;
  setStatus(opportunityId: string, status: Status): Promise<void>;
  unsave(opportunityId: string): Promise<void>;
}
