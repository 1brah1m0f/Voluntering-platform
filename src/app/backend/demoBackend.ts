import type { SocialProfile, SocialProfileInput } from '../types';
import type { Hackathon, HackathonEntry } from '../hackathons/types';
import { DEMO_ACCOUNTS } from './demoAccounts';
import { type Note, type Opportunity, type OpportunityInput, type Profile, type SavedItem, type SavedLetter, type SavedScholarship, type SavedSearch, type Scholarship, type ShortlistItem, type University, type UserRow } from '../types';
import { BackendError, type Backend, type DiscussionQuestion, type PlanNotification } from './types';
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



const K = {
  notifications: 'openly_demo_plan_notifications',
  users: 'openly_demo_users',
  verifications: 'openly_demo_verifications',
  session: 'openly_demo_session',
  opps: 'openly_demo_opportunities',
  saved: 'openly_demo_saved',
  letters: 'openly_demo_letters',
  notes: 'openly_demo_notes',
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
  // Mirrors the database rule: the student catalogue is for student accounts and admins.
  const requireStudent = () => {
    const u = requireUser();
    if (!(u.account_type === 'student') && !u.is_admin) throw new BackendError('not_allowed');
    return u;
  };
  // Demo users created before account types existed are regular accounts.
  const toProfile = ({ password: _pw, created_at: _c, ...p }: DemoUser): Profile => ({ ...p, account_type: p.account_type ?? 'regular', avatar_url: p.avatar_url ?? '', headline: p.headline ?? '', roadmap: p.roadmap ?? [], student_prefs: p.student_prefs ?? {}, prefs: p.prefs ?? {} });

  const socialKey = 'openly_demo_social_profiles';
  const followsKey = 'openly_demo_follows';
  const socialRows = () => read<Array<SocialProfileInput & { id: string }>>(socialKey, []);
  const followRows = () => read<Array<{ follower_id: string; following_id: string }>>(followsKey, []);
  const socialProfile = (row: SocialProfileInput & { id: string }): SocialProfile => {
    const follows = followRows();
    return { ...row, followers_count: follows.filter(f => f.following_id === row.id).length,
      following_count: follows.filter(f => f.follower_id === row.id).length,
      is_following: follows.some(f => f.follower_id === session() && f.following_id === row.id) };
  };
  return {
    async listCommunity(query = {}) {
      requireUser();
      const follows = followRows();
      return socialRows().filter(p =>
        (!query.search || p.display_name.toLowerCase().includes(query.search.slice(0, 100).toLowerCase())) &&
        (!query.kind || p.kind === query.kind) &&
        (!query.relation || follows.some(f => query.relation === 'following'
          ? f.follower_id === query.personId && f.following_id === p.id
          : f.following_id === query.personId && f.follower_id === p.id)))
        .sort((a, b) => a.display_name.localeCompare(b.display_name) || a.id.localeCompare(b.id))
        .slice(query.offset ?? 0, (query.offset ?? 0) + 24).map(socialProfile);
    },
    async getSocialProfile(id) {
      requireUser();
      const row = socialRows().find(p => p.id === id);
      return row ? socialProfile(row) : null;
    },
    async publishSocialProfile(input) {
      const user = requireUser();
      const display_name = input.display_name.trim();
      if (!display_name || display_name.length > 80 || input.bio.length > 500 ||
        !['volunteer', 'organization'].includes(input.kind) || input.avatar_url.length > 2048 ||
        (input.avatar_url && !input.avatar_url.startsWith('https://'))) throw new BackendError('unknown');
      const row = { id: user.id, display_name, bio: input.bio, avatar_url: input.avatar_url, kind: input.kind };
      write(socialKey, [...socialRows().filter(p => p.id !== user.id), row]);
    },
    async deleteSocialProfile() {
      const user = requireUser();
      write(socialKey, socialRows().filter(p => p.id !== user.id));
      write(followsKey, followRows().filter(f => f.follower_id !== user.id && f.following_id !== user.id));
    },
    async setFollowing(id, following) {
      const user = requireUser();
      if (id === user.id || !socialRows().some(p => p.id === user.id) || !socialRows().some(p => p.id === id)) throw new BackendError('not_allowed');
      const rows = followRows().filter(f => !(f.follower_id === user.id && f.following_id === id));
      if (following) rows.push({ follower_id: user.id, following_id: id });
      write(followsKey, rows);
    },
    async listQuestions(scope) {
      const rows = read<Array<DiscussionQuestion & { voters: string[] }>>('openly_demo_discussions_v1', []);
      return rows.filter(q => q.scope === scope).map(q => ({ ...q, stars: q.voters.length, starred: q.voters.includes(session() ?? '') }));
    },
    async askQuestion(scope, title, body) {
      const u = requireUser();
      title = title.trim(); body = body.trim();
      if (!title || title.length > 160 || !body || body.length > 3000) throw new BackendError('unknown');
      const rows = read<Array<DiscussionQuestion & { voters: string[] }>>('openly_demo_discussions_v1', []);
      rows.unshift({ id: uuid(), scope, title, body, author_name: u.full_name || 'İstifadəçi', created_at: new Date().toISOString(), answers: [], stars: 0, starred: false, voters: [] });
      write('openly_demo_discussions_v1', rows);
    },
    async answerQuestion(questionId, body) {
      const u = requireUser(); body = body.trim();
      if (!body || body.length > 3000) throw new BackendError('unknown');
      const rows = read<Array<DiscussionQuestion & { voters: string[] }>>('openly_demo_discussions_v1', []);
      const q = rows.find(q => q.id === questionId);
      if (!q) throw new BackendError('not_allowed');
      q.answers.push({ id: uuid(), question_id: questionId, body, author_name: u.full_name || 'İstifadəçi', created_at: new Date().toISOString() });
      write('openly_demo_discussions_v1', rows);
    },
    async starQuestion(questionId, starred) {
      const u = requireUser();
      const rows = read<Array<DiscussionQuestion & { voters: string[] }>>('openly_demo_discussions_v1', []);
      const q = rows.find(q => q.id === questionId);
      if (!q) throw new BackendError('not_allowed');
      q.voters = q.voters.filter(id => id !== u.id);
      if (starred) q.voters.push(u.id);
      write('openly_demo_discussions_v1', rows);
    },
    async listHackathons() { requireAdmin(); return read<Hackathon[]>('openly_demo_hackathons_v1', []).sort((a,b) => a.deadline.localeCompare(b.deadline)); },
    async getHackathon(id) { requireAdmin(); return read<Hackathon[]>('openly_demo_hackathons_v1', []).find(h => h.id === id) ?? null; },
    async createHackathon(input) {
      requireAdmin();
      const h: Hackathon = { ...input, id: uuid(), created_at: new Date().toISOString() };
      write('openly_demo_hackathons_v1', [...read<Hackathon[]>('openly_demo_hackathons_v1', []), h]);
      return h;
    },
    async updateHackathon(id, input) {
      requireAdmin();
      const rows = read<Hackathon[]>('openly_demo_hackathons_v1', []);
      const old = rows.find(h => h.id === id);
      if (!old) throw new BackendError('not_allowed');
      const h = { ...old, ...input };
      write('openly_demo_hackathons_v1', rows.map(row => row.id === id ? h : row));
      return h;
    },
    async deleteHackathon(id) {
      requireAdmin();
      write('openly_demo_hackathons_v1', read<Hackathon[]>('openly_demo_hackathons_v1', []).filter(h => h.id !== id));
      const all = read<Record<string, HackathonEntry[]>>('openly_demo_hackathon_entries_v1', {});
      for (const key of Object.keys(all)) all[key] = all[key].filter(e => e.hackathon_id !== id);
      write('openly_demo_hackathon_entries_v1', all);
    },
    async listHackathonEntries() { requireAdmin(); return read<Record<string, HackathonEntry[]>>('openly_demo_hackathon_entries_v1', {})[requireUser().id] ?? []; },
    async setHackathonStage(id, stage) {
      requireAdmin();
      if (!read<Hackathon[]>('openly_demo_hackathons_v1', []).some(h => h.id === id)) throw new BackendError('not_allowed');
      const all = read<Record<string, HackathonEntry[]>>('openly_demo_hackathon_entries_v1', {});
      const userId = requireUser().id;
      const rows = (all[userId] ?? []).filter(e => e.hackathon_id !== id);
      all[userId] = stage === null ? rows : [...rows, { hackathon_id: id, stage }];
      write('openly_demo_hackathon_entries_v1', all);
    },
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

    async claimStudentAccount() {
      return false; // no Google sign-in in demo mode
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
      return opps()
        .filter((o) => admin || (o.published))
        .sort((a, b) => a.deadline.localeCompare(b.deadline));
    },

    async getOpportunity(id) {
      const o = opps().find((x) => x.id === id) ?? null;
      const u = me();
      if (!o) return null;
      return u?.is_admin || (o.published) ? o : null;
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
      return 0;
    },

    async listUsers() {
      requireAdmin();
      return users().map((u) => ({ ...toProfile(u), created_at: u.created_at ?? new Date().toISOString() }) as UserRow);
    },

    async listAcceptanceRequests() {
      requireAdmin();
      const approvals = read<string[]>(K.verifications, []);
      return Object.entries(allSaved()).flatMap(([user_id, rows]) => rows.filter((s) => s.status === 'accepted').map((s) => {
        const user = users().find((u) => u.id === user_id);
        return { user_id, opportunity_id: s.opportunity_id, title: opps().find((o) => o.id === s.opportunity_id)?.title ?? '',
          full_name: user?.full_name ?? '', email: user?.email ?? '', verified: approvals.includes(`${user_id}/${s.opportunity_id}`) };
      }));
    },

    async setAcceptanceVerified(userId, opportunityId, verified) {
      requireAdmin();
      if (!allSaved()[userId]?.some((s) => s.opportunity_id === opportunityId && s.status === 'accepted')) throw new BackendError('not_allowed');
      const key = `${userId}/${opportunityId}`;
      const approvals = read<string[]>(K.verifications, []).filter((x) => x !== key);
      write(K.verifications, verified ? [...approvals, key] : approvals);
    },

    async listPlanNotifications() {
      const u = requireUser();
      return read<Record<string, PlanNotification[]>>(K.notifications, {})[u.id] ?? [];
    },
    async dismissPlanNotification(id) {
      const u = requireUser();
      const all = read<Record<string, PlanNotification[]>>(K.notifications, {});
      all[u.id] = (all[u.id] ?? []).filter(n => n.id !== id);
      write(K.notifications, all);
    },
    async setUserPlan(userId, plan) {
      requireAdmin();
      const target = users().find(u => u.id === userId);
      if (target && target.plan !== plan && (plan === 'premium' || plan === 'student')) {
        const all = read<Record<string, PlanNotification[]>>(K.notifications, {});
        all[userId] = [{ id: uuid(), plan, created_at: new Date().toISOString() }, ...(all[userId] ?? [])];
        write(K.notifications, all);
      }
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
      return { configured: false, limit: null, remaining: null };
    },

    async listSaved() {
      requireUser();
      const ids = new Set(opps().map((o) => o.id));
      return mySaved().filter((s) => ids.has(s.opportunity_id));
    },

    async save(opportunityId) {
      requireUser();
      const items = mySaved();
      const existing = items.find((s) => s.opportunity_id === opportunityId);
      if (existing) return existing;
      const now = new Date().toISOString();
      const item: SavedItem = { opportunity_id: opportunityId, status: 'saved', created_at: now, updated_at: now };
      writeMySaved([...items, item]);
      return item;
    },

    async setStatus(opportunityId, status) {
      const user = requireUser();
      const previous = mySaved().find((s) => s.opportunity_id === opportunityId);
      if (previous && previous.status !== status) write(K.verifications, read<string[]>(K.verifications, []).filter((x) => x !== `${user.id}/${opportunityId}`));
      writeMySaved(mySaved().map((s) => (s.opportunity_id === opportunityId ? { ...s, status, share_contact: previous?.status === status ? s.share_contact : false, updated_at: new Date().toISOString() } : s)));
    },

    async unsave(opportunityId) {
      const user = requireUser();
      write(K.verifications, read<string[]>(K.verifications, []).filter((x) => x !== `${user.id}/${opportunityId}`));
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
      const approvals = read<string[]>(K.verifications, []);
      const sharing = (s: SavedItem | undefined, userId: string) => s?.status === 'accepted' && s.share_contact === true && approvals.includes(`${userId}/${opportunityId}`);
      const all = allSaved();
      if (!sharing(all[u.id]?.find((s) => s.opportunity_id === opportunityId), u.id)) return [];
      return users()
        .filter((x) => x.id !== u.id && sharing(all[x.id]?.find((s) => s.opportunity_id === opportunityId), x.id))
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

    async listNotes() {
      const u = requireUser();
      return [...(read<Record<string, Note[]>>(K.notes, {})[u.id] ?? [])].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at));
    },

    async addNote(body, color) {
      const u = requireUser();
      const all = read<Record<string, Note[]>>(K.notes, {});
      const mine = all[u.id] ?? [];
      if (mine.length >= 100) throw new BackendError('notes_limit');
      const now = new Date().toISOString();
      const note: Note = { id: uuid(), body, color, pinned: false, created_at: now, updated_at: now };
      write(K.notes, { ...all, [u.id]: [note, ...mine] });
      return note;
    },

    async updateNote(id, patch) {
      const u = requireUser();
      const all = read<Record<string, Note[]>>(K.notes, {});
      let updated: Note | null = null;
      const mine = (all[u.id] ?? []).map((n) => (n.id === id ? (updated = { ...n, ...patch, updated_at: new Date().toISOString() }) : n));
      if (!updated) throw new BackendError('unknown', 'not found');
      write(K.notes, { ...all, [u.id]: mine });
      return updated;
    },

    async deleteNote(id) {
      const u = requireUser();
      const all = read<Record<string, Note[]>>(K.notes, {});
      write(K.notes, { ...all, [u.id]: (all[u.id] ?? []).filter((n) => n.id !== id) });
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
