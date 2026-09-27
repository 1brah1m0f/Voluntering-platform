import { useEffect, useMemo, useState } from 'react';
import { useInteractions } from './hooks/useInteractions';
import { dictionaries, LangContext, type Lang } from './i18n';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProgramStrip from './components/ProgramStrip';
import BackToTop from './components/BackToTop';
import Problem from './components/Problem';
import Features from './components/Features';
import AppPreview from './components/AppPreview';
import Pricing from './components/Pricing';
import SignupForm from './components/SignupForm';
import Footer from './components/Footer';

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

export default function App() {
  const [lang, setLangState] = useState<Lang>(initialLang);
  useInteractions();

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


  return (
    <LangContext.Provider value={ctx}>
      <Navbar />
      <main id="main">
        <Hero />
        <ProgramStrip />
        <Problem />
        <Features />
        <AppPreview />
        <Pricing />
        <SignupForm />
      </main>
      <Footer />
      <BackToTop />
    </LangContext.Provider>
  );
}
