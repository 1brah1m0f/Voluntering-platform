import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { backend } from './backend';
import type { Profile } from './types';

interface AuthState {
  /** True until the first session check finishes. */
  loading: boolean;
  userId: string | null;
  profile: Profile | null;
  setProfile: (p: Profile) => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const refresh = useCallback(async () => {
    let id: string | null = null;
    try {
      id = await backend.getUserId();
      const p = id ? await backend.getProfile() : null;
      // Set together: a signed-in user always comes with their profile (and account
      // type), so the route guards never send a student into the regular app for a frame.
      setUserId(id);
      setProfile(p);
    } catch (err) {
      console.error('[auth] refresh failed', err);
      setUserId(id);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return backend.onAuthChange(() => void refresh());
  }, [refresh]);

  return <AuthContext.Provider value={{ loading, userId, profile, setProfile, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
