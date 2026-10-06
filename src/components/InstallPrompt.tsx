import { useEffect, useState } from 'react';
import { ArrowRight, Download, Monitor, Smartphone, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Platform } from '../content/guides';
import { useLang } from '../i18n';

// Chrome, Edge and Android browsers fire this when the PWA can be installed.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// After "Later" or the close button, ask again after two weeks.
const DISMISS_DAYS = 14;
const SHOW_DELAY_MS = 1500;

// The event can fire before React mounts, so catch it as soon as this module loads.
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((fn) => fn());
  });
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
// iPadOS reports itself as a Mac; touch support tells them apart.
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isMobile = () => isIos() || /android|mobile/i.test(navigator.userAgent);

/** The visitor's device, to open the matching tab of the install guide. */
export function detectPlatform(): Platform {
  if (isIos()) return /CriOS/i.test(navigator.userAgent) ? 'ios-chrome' : 'ios-safari';
  return /android/i.test(navigator.userAgent) ? 'android' : 'desktop';
}

function recentlyDismissed(key: string) {
  try {
    const at = Number(localStorage.getItem(key));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}

/**
 * Install state shared by the landing banner, the hero link and the home card. `dismissKey`
 * keeps each place's "Later" separate (none: it can't be dismissed). iOS has no install
 * event, so there `show` means "point to the install guide".
 */
function useInstall(dismissKey?: string) {
  const [canPrompt, setCanPrompt] = useState(!!deferred);
  const [hidden, setHidden] = useState(() => isStandalone() || (!!dismissKey && recentlyDismissed(dismissKey)));
  const [ios] = useState(isIos);
  const [mobile] = useState(isMobile);

  useEffect(() => {
    const sync = () => setCanPrompt(!!deferred);
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const dismiss = () => {
    try {
      if (dismissKey) localStorage.setItem(dismissKey, String(Date.now()));
    } catch {
      // Private mode: it just shows again next visit.
    }
    setHidden(true);
  };

  // The browser allows one prompt per event; afterwards the guide is the fallback.
  const install = async () => {
    if (!deferred) return 'dismissed';
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    setCanPrompt(false);
    if (outcome === 'dismissed') dismiss();
    else setHidden(true);
    return outcome;
  };

  return { show: !hidden && (canPrompt || ios), installed: hidden && isStandalone(), canPrompt, iosGuide: ios && !canPrompt, mobile, install, dismiss };
}

const GUIDE = '/guides/install-app';
const button = 'inline-flex items-center justify-center gap-2 rounded-full font-bold transition';

/**
 * Notification-style card at the top of the landing page inviting guests to install the app.
 * Android / desktop: opens the browser's install dialog. iPhone: links to the install guide.
 */
export default function InstallPrompt() {
  const { t } = useLang();
  const { show, iosGuide, mobile, install, dismiss } = useInstall('openly:install-dismissed');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-labelledby="install-title"
      className={`fixed inset-x-3 top-3 z-[60] mx-auto max-w-md transition duration-500 ease-out sm:top-5 ${
        ready ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-8 opacity-0'
      }`}
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-4 text-white shadow-2xl shadow-brand-900/40 ring-1 ring-white/10">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-coral-500/30 blur-2xl" aria-hidden="true" />
        <button
          type="button"
          onClick={dismiss}
          aria-label={t.installApp.close}
          className="absolute right-2.5 top-2.5 rounded-full p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="relative flex items-center gap-3.5 pr-7">
          <img src="/icons/icon-192.png" alt="" className="h-14 w-14 shrink-0 rounded-2xl shadow-lg ring-2 ring-white/25" />
          <div className="min-w-0">
            <p id="install-title" className="font-display text-base font-extrabold leading-tight sm:text-lg">
              {mobile ? t.installApp.titlePhone : t.installApp.titleDesktop}
            </p>
            <p className="mt-1 text-sm leading-snug text-white/85">{iosGuide ? t.installApp.iosText : t.installApp.text}</p>
          </div>
        </div>
        <div className="relative mt-4 flex gap-2">
          {iosGuide ? (
            <Link to={GUIDE} onClick={dismiss} className={`${button} flex-1 px-4 py-2.5 text-sm bg-coral-600 text-white shadow-lg shadow-coral-900/30 hover:bg-coral-700`}>
              {t.installApp.iosHow}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <button type="button" onClick={install} className={`${button} flex-1 px-4 py-2.5 text-sm bg-coral-600 text-white shadow-lg shadow-coral-900/30 hover:bg-coral-700`}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {t.installApp.install}
            </button>
          )}
          <button type="button" onClick={dismiss} className={`${button} px-5 py-2.5 text-sm bg-white/10 text-white/90 hover:bg-white/20`}>
            {t.installApp.later}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Compact card for the signed-in home page (/app/home), same behaviour as the banner. */
export function InstallCard({ className = '' }: { className?: string }) {
  const { t } = useLang();
  const { show, iosGuide, mobile, install, dismiss } = useInstall('openly:install-home-dismissed');
  if (!show) return null;

  return (
    <section
      aria-labelledby="install-card-title"
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-4 text-white shadow-sm ${className}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-coral-500/30 blur-2xl" aria-hidden="true" />
      <button
        type="button"
        onClick={dismiss}
        aria-label={t.installApp.close}
        className="absolute right-2 top-2 rounded-full p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="relative flex items-center gap-3 pr-6">
        <img src="/icons/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl ring-2 ring-white/25" />
        <div className="min-w-0">
          <h2 id="install-card-title" className="text-sm font-extrabold leading-tight text-white">
            {mobile ? t.installApp.titlePhone : t.installApp.titleDesktop}
          </h2>
          <p className="mt-0.5 text-xs leading-snug text-white/80">{iosGuide ? t.installApp.iosText : t.installApp.text}</p>
        </div>
      </div>
      {iosGuide ? (
        <Link to={GUIDE} className={`${button} relative mt-3 w-full bg-coral-600 px-4 py-2 text-sm text-white hover:bg-coral-700`}>
          {t.installApp.iosHow}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <button type="button" onClick={install} className={`${button} relative mt-3 w-full bg-coral-600 px-4 py-2 text-sm text-white hover:bg-coral-700`}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {t.installApp.install}
        </button>
      )}
    </section>
  );
}

/**
 * Always-visible install link under the landing hero buttons, for every browser.
 * Installs directly where the browser allows it; everywhere else it opens the guide
 * (with `hint`, as on the guide itself: shows the browser's menu steps instead).
 */
export function InstallLink({ hint }: { hint?: string }) {
  const { t } = useLang();
  const { installed, canPrompt, mobile, install } = useInstall();
  const [done, setDone] = useState(false);
  const [showHint, setShowHint] = useState(false);
  if (installed || done) return null;

  const Icon = mobile ? Smartphone : Monitor;
  const body = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="text-left leading-tight">
        <span className="block text-sm font-bold text-ink">{mobile ? t.installApp.titlePhone : t.installApp.titleDesktop}</span>
        <span className="block text-xs text-slate-500">{t.installApp.free}</span>
      </span>
      {canPrompt ? (
        <Download className="ml-1 h-4 w-4 text-brand-700" aria-hidden="true" />
      ) : (
        <ArrowRight className="ml-1 h-4 w-4 text-brand-700 transition group-hover:translate-x-0.5" aria-hidden="true" />
      )}
    </>
  );
  const cls = 'group inline-flex items-center gap-3 rounded-full border border-brand-200 bg-white/80 py-1.5 pl-1.5 pr-4 shadow-sm backdrop-blur transition hover:border-brand-400 hover:bg-white';

  if (canPrompt) {
    return (
      <button type="button" onClick={() => install().then((outcome) => setDone(outcome === 'accepted'))} className={cls}>
        {body}
      </button>
    );
  }
  // On the guide itself the browser's menu steps replace the link back to the guide.
  if (hint) {
    return (
      <div>
        <button type="button" onClick={() => setShowHint(true)} aria-expanded={showHint} className={cls}>
          {body}
        </button>
        {showHint && <p className="mt-3 rounded-2xl bg-brand-50 px-4 py-3 text-sm leading-6 text-brand-900">{hint}</p>}
      </div>
    );
  }
  return (
    <Link to={GUIDE} className={cls}>
      {body}
    </Link>
  );
}
