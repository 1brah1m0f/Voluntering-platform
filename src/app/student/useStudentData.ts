import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { backend } from '../backend';
import { useAuth } from '../AuthContext';
import { useAppText } from '../text';
import type { SavedScholarship, Scholarship, ShortlistItem, ShortlistStatus, StudentPrefs, University } from '../types';
import { localize, withScholarshipDefaults, withUniversityDefaults } from './logic';

export type StudentData = ReturnType<typeof useStudentData>;

/**
 * Everything the Student section shows: the catalogue in the UI language, the
 * student's lists and their "My plan" preferences. Changes apply at once and
 * are rolled back if saving fails.
 */
export function useStudentData(enabled: boolean) {
  const { tx, lang } = useAppText();
  const { profile, setProfile } = useAuth();
  const [catalog, setCatalog] = useState<{ scholarships: Scholarship[]; universities: University[] } | null>(null);
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [saved, setSaved] = useState<SavedScholarship[]>([]);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    Promise.all([
      backend.listScholarships(),
      backend.listUniversities(),
      backend.listShortlist(),
      // The table is missing until supabase/app.sql is re-run; the rest still works.
      backend.listSavedScholarships().catch((err) => {
        console.warn('[student] saved scholarships unavailable', err);
        return [] as SavedScholarship[];
      }),
    ]).then(
      ([s, u, list, sv]) => {
        setCatalog({ scholarships: s.map(withScholarshipDefaults), universities: u.map(withUniversityDefaults) });
        setShortlist(list);
        setSaved(sv);
      },
      (err) => {
        console.error('[student] load failed', err);
        setError(true);
      },
    );
  }, []);
  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  const scholarships = useMemo(() => catalog?.scholarships.map((s) => localize(s, lang)) ?? null, [catalog, lang]);
  const universities = useMemo(() => catalog?.universities.map((u) => localize(u, lang)) ?? null, [catalog, lang]);

  const failed = (what: string, undo?: () => void) => (err: unknown) => {
    undo?.();
    console.error(`[student] ${what} failed`, err);
    alert(tx.saveError);
  };

  const uni = {
    add: (id: string) => {
      if (shortlist.some((x) => x.university_id === id)) return;
      const before = shortlist;
      setShortlist([...before, { university_id: id, status: 'planning' }]);
      backend.addToShortlist(id).catch(failed('shortlist add', () => setShortlist(before)));
    },
    remove: (id: string) => {
      const before = shortlist;
      setShortlist(before.filter((x) => x.university_id !== id));
      backend.removeFromShortlist(id).catch(failed('shortlist remove', () => setShortlist(before)));
    },
    status: (id: string, status: ShortlistStatus) => {
      const before = shortlist;
      setShortlist(before.map((x) => (x.university_id === id ? { ...x, status } : x)));
      backend.setShortlistStatus(id, status).catch(failed('shortlist status', () => setShortlist(before)));
    },
  };

  const sch = {
    toggle: (id: string) => {
      const before = saved;
      if (before.some((x) => x.scholarship_id === id)) {
        setSaved(before.filter((x) => x.scholarship_id !== id));
        backend.unsaveScholarship(id).catch(failed('unsave scholarship', () => setSaved(before)));
      } else {
        setSaved([...before, { scholarship_id: id, status: 'planning' }]);
        backend.saveScholarship(id).catch(failed('save scholarship', () => setSaved(before)));
      }
    },
    status: (id: string, status: ShortlistStatus) => {
      const before = saved;
      setSaved(before.map((x) => (x.scholarship_id === id ? { ...x, status } : x)));
      backend.setScholarshipStatus(id, status).catch(failed('scholarship status', () => setSaved(before)));
    },
  };

  // "My plan" preferences live on the profile; typing and sliding are saved once they settle.
  const prefs: StudentPrefs = useMemo(() => profile?.student_prefs ?? {}, [profile?.student_prefs]);
  const saveTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(saveTimer.current), []);
  const setPrefs = (patch: Partial<StudentPrefs>) => {
    if (!profile) return;
    const next = { ...prefs, ...patch };
    setProfile({ ...profile, student_prefs: next });
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      backend.updateProfile({ student_prefs: next }).catch(failed('preferences'));
    }, 700);
  };

  return { scholarships, universities, shortlist, saved, error, load, uni, sch, prefs, setPrefs };
}
