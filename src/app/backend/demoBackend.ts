import { FREE_EVENT_LIMIT } from '../../config';
import { FreeLimitError, PREMIUM_EARLY_HOURS, type Opportunity, type OpportunityInput, type Profile, type SavedItem, type SavedLetter, type SavedScholarship, type SavedSearch, type Scholarship, type ShortlistItem, type University, type UserRow } from '../types';
import { BackendError, type Backend } from './types';
import { DEMO_SCHOLARSHIPS, DEMO_UNIVERSITIES } from './demoStudent';

// Stable ids so the shortlist survives reloads.
const demoScholarships: Scholarship[] = DEMO_SCHOLARSHIPS.map((s, i) => ({ ...s, id: `demo-sch-${i}` }));
const demoUniversities: University[] = DEMO_UNIVERSITIES.map((u, i) => ({ ...u, id: `demo-uni-${i}` }));

/**
 * In-browser backend used when Supabase isn't configured. Everything lives in
 * this browser's localStorage, so it's only for trying the app out. Two demo
 * accounts are created on first use (see DEMO_ACCOUNTS).
 */

type DemoUser = Profile & { password: string; created_at?: string };

const inEarlyWindow = (o: Opportunity) => Date.now() - new Date(o.created_at).getTime() < PREMIUM_EARLY_HOURS * 3_600_000;

export const DEMO_ACCOUNTS = {
  admin: { email: 'admin@openlyapply.com', password: 'demo1234' },
  user: { email: 'aysel@openlyapply.com', password: 'demo1234' },
  student: { email: 'student@openlyapply.com', password: 'demo1234' },
};

const K = {
  users: 'openly_demo_users',
  session: 'openly_demo_session',
  opps: 'openly_demo_opportunities',
  saved: 'openly_demo_saved',
  letters: 'openly_demo_letters',
  searches: 'openly_demo_searches',
  shortlist: 'openly_demo_shortlist',
  savedScholarships: 'openly_demo_saved_scholarships',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable */
  }
}

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
const wait = () => new Promise((r) => setTimeout(r, 150));

function seed(): Opportunity[] {
  // Created a few days ago, so free users see them; the last one is brand new
  // to show the Premium early-access window.
  const base = { published: true, created_at: new Date(Date.now() - 3 * 86_400_000).toISOString(), start_date: null, end_date: null, organizer: '', city: '', is_online: false };
  const rows: Array<Partial<Opportunity> & Pick<Opportunity, 'title' | 'program' | 'kind' | 'country' | 'interests' | 'deadline' | 'costs' | 'url' | 'description'>> = [
    {
      title: 'Youth Exchange: Green Futures',
      program: 'Erasmus+',
      kind: 'youth_exchange',
      country: 'Portuqaliya',
      city: 'Lissabon',
      interests: ['environment', 'education'],
      deadline: day(3),
      start_date: day(40),
      end_date: day(48),
      costs: 'full',
      url: 'https://erasmus-plus.ec.europa.eu/',
      description: 'İqlim dəyişikliyi və davamlı həyat tərzi mövzusunda 8 günlük gənclər mübadiləsi. 18–25 yaş.',
    },
    {
      title: 'Training Course: Climate Action in Youth Work',
      program: 'SALTO-Youth',
      kind: 'training',
      country: 'Almaniya',
      city: 'Berlin',
      interests: ['environment'],
      deadline: day(6),
      start_date: day(50),
      end_date: day(55),
      costs: 'full',
      url: 'https://www.salto-youth.net/tools/european-training-calendar/',
      description: 'Gənclər işçiləri və liderləri üçün iqlim fəaliyyəti mövzusunda təlim kursu.',
    },
    {
      title: 'ESC Volunteering: Youth Centre',
      program: 'European Solidarity Corps',
      kind: 'volunteering',
      country: 'Estoniya',
      city: 'Tartu',
      interests: ['education', 'inclusion'],
      deadline: day(12),
      start_date: day(90),
      end_date: day(270),
      costs: 'full',
      url: 'https://youth.europa.eu/solidarity_en',
      description: 'Gənclər mərkəzində 6 aylıq könüllülük: tədbirlərin təşkili, uşaqlarla iş, sosial media.',
    },
    {
      title: 'Online Volunteering: Digital Skills Mentor',
      program: 'UN Volunteers',
      kind: 'online',
      country: '',
      is_online: true,
      interests: ['digital', 'education'],
      deadline: day(18),
      costs: 'none',
      url: 'https://app.unv.org/',
      description: 'Həftədə 3–5 saat onlayn: gənclərə rəqəmsal bacarıqlar üzrə mentorluq.',
    },
    {
      title: 'İdman tədbirlərində könüllülük',
      program: 'ASAN Könüllüləri',
      kind: 'volunteering',
      country: 'Azərbaycan',
      city: 'Bakı',
      interests: ['sports'],
      deadline: day(25),
      costs: 'unknown',
      url: 'https://www.asanvolunteers.az/',
      description: 'Beynəlxalq idman tədbirlərində qonaqların qarşılanması və məlumatlandırılması.',
    },
    {
      title: 'Seminar: Human Rights Education',
      program: 'European Youth Foundation',
      kind: 'seminar',
      country: 'Fransa',
      city: 'Strasburq',
      interests: ['human_rights', 'peace'],
      deadline: day(9),
      start_date: day(60),
      end_date: day(63),
      costs: 'partial',
      url: 'https://www.coe.int/en/web/european-youth-foundation',
      description: 'Gənclər təşkilatları üçün insan hüquqları təhsili üzrə seminar.',
    },
    {
      title: 'Humanitar yardım könüllüsü',
      program: 'Azərbaycan Qızıl Aypara Cəmiyyəti',
      kind: 'volunteering',
      country: 'Azərbaycan',
      city: 'Bakı',
      interests: ['health', 'inclusion'],
      deadline: day(30),
      costs: 'none',
      url: 'https://redcrescent.org.az/',
      description: 'İlk yardım təlimi və humanitar yardım paylanmasında iştirak.',
    },
    {
      created_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      title: 'Youth Exchange: Art for Inclusion',
      program: 'Erasmus+',
      kind: 'youth_exchange',
      country: 'İtaliya',
      city: 'Bolonya',
      interests: ['culture_arts', 'inclusion'],
      deadline: day(15),
      start_date: day(70),
      end_date: day(77),
      costs: 'full',
      url: 'https://erasmus-plus.ec.europa.eu/',
      description: 'İncəsənət vasitəsilə sosial inklüziya: teatr, musiqi və vizual sənət emalatxanaları.',
    },
  ];
  return rows.map((r) => ({ ...base, id: uuid(), organizer: r.program, ...r }) as Opportunity);
}

export function createDemoBackend(): Backend {
  const listeners = new Set<(id: string | null) => void>();
  const emit = (id: string | null) => listeners.forEach((l) => l(id));

  const seedAccounts = (): DemoUser[] => {
    const base = {
      country: 'Azərbaycan',
      plan: 'basic' as const,
      account_type: 'regular' as const,
      digest_opt_out: false,
      reminders_opt_out: false,
      about: '',
      avatar_url: '',
      headline: '',
      created_at: new Date().toISOString(),
    };
    return [
      { ...base, id: uuid(), ...DEMO_ACCOUNTS.admin, full_name: 'Openly Admin', interests: [], is_admin: true },
      { ...base, id: uuid(), ...DEMO_ACCOUNTS.user, full_name: 'Aysel Məmmədova', interests: ['environment', 'education'], is_admin: false },
      { ...base, id: uuid(), ...DEMO_ACCOUNTS.student, full_name: 'Murad Əliyev', interests: [], is_admin: false, account_type: 'student' as const, plan: 'student' as const },
    ];
  };
  const users = (): DemoUser[] => {
    const existing = read<DemoUser[] | null>(K.users, null);
    if (existing) {
      // Browsers that used the demo before the demo accounts existed get them added.
      const missing = seedAccounts().filter((d) => !existing.some((u) => u.email === d.email));
      if (!missing.length) return existing;
      const merged = [...existing, ...missing];
      write(K.users, merged);
      return merged;
    }
    // First visit: create the demo admin and a demo user with a few tracked items.
    const seeded = seedAccounts();
    write(K.users, seeded);
    const [first, second] = opps();
    const now = new Date().toISOString();
    write(K.saved, {
      [seeded[1].id]: [
        { opportunity_id: first.id, status: 'saved', created_at: now, updated_at: now },
        { opportunity_id: second.id, status: 'applied', created_at: now, updated_at: now },
      ],
    });
    return seeded;
  };
  const session = () => read<string | null>(K.session, null);
  const me = () => users().find((u) => u.id === session()) ?? null;
  const opps = (): Opportunity[] => {
    const existing = read<Opportunity[] | null>(K.opps, null);
    if (existing) return existing;
    const seeded = seed();
    write(K.opps, seeded);
    return seeded;
  };
  const allSaved = () => read<Record<string, SavedItem[]>>(K.saved, {});
  const mySaved = () => allSaved()[session() ?? ''] ?? [];
  const writeMySaved = (items: SavedItem[]) => write(K.saved, { ...allSaved(), [session() ?? '']: items });
  const requireUser = () => {
    const u = me();
    if (!u) throw new BackendError('not_allowed');
    return u;
  };
  const requireAdmin = () => {
    const u = requireUser();
    if (!u.is_admin) throw new BackendError('not_allowed');
  };
  // Older demo data predates the personalisation fields.
  // Mirrors the database rule: the student catalogue is for student accounts on the Student plan (and admins).
  const requireStudent = () => {
    const u = requireUser();
    if (!(u.account_type === 'student' && u.plan === 'student') && !u.is_admin) throw new BackendError('not_allowed');
    return u;
  };
  // Demo users created before account types existed are regular accounts.
  const toProfile = ({ password: _pw, created_at: _c, ...p }: DemoUser): Profile => ({ ...p, account_type: p.account_type ?? 'regular', avatar_url: p.avatar_url ?? '', headline: p.headline ?? '', roadmap: p.roadmap ?? [], student_prefs: p.student_prefs ?? {} });

  return {
    mode: 'demo',
    supportsGoogle: false,

    async getUserId() {
      return me()?.id ?? null;
    },

    onAuthChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },

    async signUp(email, password, fullName, accountType) {
      await wait();
      const list = users();
      const e = email.trim().toLowerCase();
      if (list.some((u) => u.email === e)) throw new BackendError('email_taken');
      if (password.length < 6) throw new BackendError('weak_password');
      const user: DemoUser = {
        id: uuid(),
        email: e,
        password,
        full_name: fullName.trim(),
        interests: [],
        country: '',
        plan: 'basic',
        account_type: accountType,
        is_admin: false,
        digest_opt_out: false,
        reminders_opt_out: false,
        about: '',
        avatar_url: '',
        headline: '',
        created_at: new Date().toISOString(),
      };
      write(K.users, [...list, user]);
      write(K.session, user.id);
      emit(user.id);
      return 'signed_in';
    },

    async signIn(email, password) {
      await wait();
      const u = users().find((x) => x.email === email.trim().toLowerCase() && x.password === password);
      if (!u) throw new BackendError('invalid_credentials');
      write(K.session, u.id);
      emit(u.id);
    },

    async signInWithGoogle() {
      throw new BackendError('not_allowed');
    },

    async requestPasswordReset() {
      await wait(); // Demo mode has no email; the reset link can't be sent.
    },

    async updatePassword(password) {
      const u = requireUser();
      if (password.length < 6) throw new BackendError('weak_password');
      write(
        K.users,
        users().map((x) => (x.id === u.id ? { ...x, password } : x)),
      );
    },

    async signOut() {
      write(K.session, null);
      emit(null);
    },

    async getProfile() {
      const u = me();
      return u ? toProfile(u) : null;
    },

    async updateProfile(patch) {
      const u = requireUser();
      const next = { ...u, ...patch };
      write(
        K.users,
        users().map((x) => (x.id === u.id ? next : x)),
      );
      return toProfile(next);
    },

    async setAvatar(image) {
      // Demo mode keeps the (small, resized) photo inline as a data URL.
      const avatar_url = image
        ? await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = () => reject(r.error);
            r.readAsDataURL(image);
          })
        : '';
      const u = requireUser();
      const next = { ...u, avatar_url };
      write(
        K.users,
        users().map((x) => (x.id === u.id ? next : x)),
      );
      return toProfile(next);
    },

    async cancelPremium() {
      const u = requireUser();
      const next = { ...u, plan: 'basic' as const };
      write(
        K.users,
        users().map((x) => (x.id === u.id ? next : x)),
      );
      return toProfile(next);
    },

    async listOpportunities() {
      await wait();
      const u = me();
      const admin = u?.is_admin;
      const premium = u?.plan === 'premium' || u?.plan === 'student';
      return opps()
        .filter((o) => admin || (o.published && (premium || !inEarlyWindow(o))))
        .sort((a, b) => a.deadline.localeCompare(b.deadline));
    },

    async getOpportunity(id) {
      const o = opps().find((x) => x.id === id) ?? null;
      const u = me();
      if (!o) return null;
      return u?.is_admin || (o.published && (u?.plan === 'premium' || u?.plan === 'student' || !inEarlyWindow(o))) ? o : null;
    },

    async createOpportunity(input: OpportunityInput) {
      requireAdmin();
      const o: Opportunity = { ...input, id: uuid(), created_at: new Date().toISOString() };
      write(K.opps, [...opps(), o]);
      return o;
    },

    async updateOpportunity(id, input) {
      requireAdmin();
      let updated: Opportunity | null = null;
      write(
        K.opps,
        opps().map((o) => (o.id === id ? (updated = { ...o, ...input }) : o)),
      );
      if (!updated) throw new BackendError('unknown', 'not found');
      return updated;
    },

    async deleteOpportunity(id) {
      requireAdmin();
      write(
        K.opps,
        opps().filter((o) => o.id !== id),
      );
      const all = allSaved();
      for (const k of Object.keys(all)) all[k] = all[k].filter((s) => s.opportunity_id !== id);
      write(K.saved, all);
    },

    async premiumEarlyCount() {
      return opps().filter((o) => o.published && inEarlyWindow(o)).length;
    },

    async listUsers() {
      requireAdmin();
      return users().map((u) => ({ ...toProfile(u), created_at: u.created_at ?? new Date().toISOString() }) as UserRow);
    },

    async setUserPlan(userId, plan) {
      requireAdmin();
      write(
        K.users,
        users().map((u) => (u.id === userId ? { ...u, plan } : u)),
      );
    },

    async setAccountType(userId, type) {
      requireAdmin();
      write(
        K.users,
        users().map((u) => {
          if (u.id !== userId) return u;
          const mismatch = (type === 'student' && u.plan === 'premium') || (type === 'regular' && u.plan === 'student');
          return { ...u, account_type: type, plan: mismatch ? ('basic' as const) : u.plan };
        }),
      );
    },

    async ai() {
      // The AI assistant runs in a Supabase Edge Function; there's no demo version.
      throw new BackendError('not_configured');
    },

    async aiStatus() {
      return false;
    },

    async listSaved() {
      requireUser();
      const ids = new Set(opps().map((o) => o.id));
      return mySaved().filter((s) => ids.has(s.opportunity_id));
    },

    async save(opportunityId) {
      const u = requireUser();
      const items = mySaved();
      const existing = items.find((s) => s.opportunity_id === opportunityId);
      if (existing) return existing;
      if (u.plan === 'basic' && items.length >= FREE_EVENT_LIMIT) throw new FreeLimitError();
      const now = new Date().toISOString();
      const item: SavedItem = { opportunity_id: opportunityId, status: 'saved', created_at: now, updated_at: now };
      writeMySaved([...items, item]);
      return item;
    },

    async setStatus(opportunityId, status) {
      requireUser();
      writeMySaved(mySaved().map((s) => (s.opportunity_id === opportunityId ? { ...s, status, updated_at: new Date().toISOString() } : s)));
    },

    async unsave(opportunityId) {
      requireUser();
      writeMySaved(mySaved().filter((s) => s.opportunity_id !== opportunityId));
    },

    async updateTracking(opportunityId, patch) {
      requireUser();
      writeMySaved(mySaved().map((s) => (s.opportunity_id === opportunityId ? { ...s, ...patch } : s)));
    },

    async setShareContact(opportunityId, share) {
      requireUser();
      writeMySaved(mySaved().map((s) => (s.opportunity_id === opportunityId ? { ...s, share_contact: share } : s)));
    },

    async acceptedPeers(opportunityId) {
      const u = requireUser();
      const sharing = (s: SavedItem | undefined) => s?.status === 'accepted' && s.share_contact === true;
      const all = allSaved();
      if (!sharing(all[u.id]?.find((s) => s.opportunity_id === opportunityId))) return [];
      return users()
        .filter((x) => x.id !== u.id && sharing(all[x.id]?.find((s) => s.opportunity_id === opportunityId)))
        .map((x) => ({ full_name: x.full_name, email: x.email, avatar_url: x.avatar_url ?? '', headline: x.headline ?? '', country: x.country }));
    },

    async studentCounts() {
      return { scholarships: demoScholarships.length, universities: demoUniversities.length };
    },

    async listScholarships() {
      requireStudent();
      return demoScholarships;
    },

    async listUniversities() {
      requireStudent();
      return demoUniversities;
    },

    async listShortlist() {
      const u = requireStudent();
      return read<Record<string, ShortlistItem[]>>(K.shortlist, {})[u.id] ?? [];
    },

    async addToShortlist(universityId) {
      const u = requireStudent();
      const all = read<Record<string, ShortlistItem[]>>(K.shortlist, {});
      const mine = all[u.id] ?? [];
      if (!mine.some((x) => x.university_id === universityId)) write(K.shortlist, { ...all, [u.id]: [...mine, { university_id: universityId, status: 'planning' }] });
    },

    async setShortlistStatus(universityId, status) {
      const u = requireStudent();
      const all = read<Record<string, ShortlistItem[]>>(K.shortlist, {});
      write(K.shortlist, { ...all, [u.id]: (all[u.id] ?? []).map((x) => (x.university_id === universityId ? { ...x, status } : x)) });
    },

    async removeFromShortlist(universityId) {
      const u = requireStudent();
      const all = read<Record<string, ShortlistItem[]>>(K.shortlist, {});
      write(K.shortlist, { ...all, [u.id]: (all[u.id] ?? []).filter((x) => x.university_id !== universityId) });
    },

    async listSavedScholarships() {
      const u = requireStudent();
      return read<Record<string, SavedScholarship[]>>(K.savedScholarships, {})[u.id] ?? [];
    },

    async saveScholarship(scholarshipId) {
      const u = requireStudent();
      const all = read<Record<string, SavedScholarship[]>>(K.savedScholarships, {});
      const mine = all[u.id] ?? [];
      if (!mine.some((x) => x.scholarship_id === scholarshipId)) write(K.savedScholarships, { ...all, [u.id]: [...mine, { scholarship_id: scholarshipId, status: 'planning' }] });
    },

    async setScholarshipStatus(scholarshipId, status) {
      const u = requireStudent();
      const all = read<Record<string, SavedScholarship[]>>(K.savedScholarships, {});
      write(K.savedScholarships, { ...all, [u.id]: (all[u.id] ?? []).map((x) => (x.scholarship_id === scholarshipId ? { ...x, status } : x)) });
    },

    async unsaveScholarship(scholarshipId) {
      const u = requireStudent();
      const all = read<Record<string, SavedScholarship[]>>(K.savedScholarships, {});
      write(K.savedScholarships, { ...all, [u.id]: (all[u.id] ?? []).filter((x) => x.scholarship_id !== scholarshipId) });
    },

    async listSearches() {
      const u = requireUser();
      return read<Record<string, SavedSearch[]>>(K.searches, {})[u.id] ?? [];
    },

    async saveSearch(name, params) {
      const u = requireUser();
      const all = read<Record<string, SavedSearch[]>>(K.searches, {});
      const mine = all[u.id] ?? [];
      if (mine.length >= 10) throw new BackendError('not_allowed', 'SEARCH_LIMIT');
      const now = new Date().toISOString();
      const s: SavedSearch = { id: uuid(), name, params, last_seen_at: now, created_at: now };
      write(K.searches, { ...all, [u.id]: [...mine, s] });
      return s;
    },

    async markSearchSeen(id) {
      const u = requireUser();
      const all = read<Record<string, SavedSearch[]>>(K.searches, {});
      write(K.searches, { ...all, [u.id]: (all[u.id] ?? []).map((s) => (s.id === id ? { ...s, last_seen_at: new Date().toISOString() } : s)) });
    },

    async deleteSearch(id) {
      const u = requireUser();
      const all = read<Record<string, SavedSearch[]>>(K.searches, {});
      write(K.searches, { ...all, [u.id]: (all[u.id] ?? []).filter((s) => s.id !== id) });
    },

    async getLetter(opportunityId) {
      const u = requireUser();
      return read<Record<string, SavedLetter>>(K.letters, {})[`${u.id}:${opportunityId}`] ?? null;
    },

    async saveLetter(opportunityId, content) {
      const u = requireUser();
      const letter = { content, updated_at: new Date().toISOString() };
      write(K.letters, { ...read<Record<string, SavedLetter>>(K.letters, {}), [`${u.id}:${opportunityId}`]: letter });
      return letter;
    },
  };
}
