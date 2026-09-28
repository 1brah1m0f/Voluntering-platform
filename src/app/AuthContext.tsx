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
    try {
      const id = await backend.getUserId();
      setUserId(id);
      setProfile(id ? await backend.getProfile() : null);
    } catch (err) {
      console.error('[auth] refresh failed', err);
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
