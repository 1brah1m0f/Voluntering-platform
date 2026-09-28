import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { dictionaries, LangContext, type Lang } from './i18n';

const LANG_KEY = 'openly_lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'az' || saved === 'en') return saved;
  } catch {
    /* storage unavailable */
  }
  return 'az';
}

/** Site-wide AZ/EN language state, shared by the landing page and the app. */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* storage unavailable */
    }
  };

  const t = dictionaries[lang];
  const ctx = useMemo(() => ({ lang, t, setLang }), [lang, t]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.meta.title;
  }, [lang, t]);

  return <LangContext.Provider value={ctx}>{children}</LangContext.Provider>;
}
