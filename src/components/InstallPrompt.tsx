import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useLang } from '../i18n';

// Chrome, Edge and Android browsers fire this when the PWA can be installed.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'openly:install-dismissed';
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

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}

/** Notification-style card at the top of the landing page inviting guests to install the app. */
export default function InstallPrompt() {
  const { t } = useLang();
  const [canPrompt, setCanPrompt] = useState(!!deferred);
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [ios] = useState(isIos);
  const [mobile] = useState(isMobile);

  useEffect(() => {
    const sync = () => setCanPrompt(!!deferred);
    listeners.add(sync);
    const timer = window.setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => {
      listeners.delete(sync);
      window.clearTimeout(timer);
    };
  }, []);

  // iOS has no install event: show the "Add to Home Screen" steps instead.
  const supported = canPrompt || ios;
  if (!supported || hidden || isStandalone() || recentlyDismissed()) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Private mode: it just shows again next visit.
    }
    setHidden(true);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    if (outcome === 'dismissed') dismiss();
    else setHidden(true);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-labelledby="install-title"
      className={`fixed inset-x-3 top-3 z-[60] mx-auto max-w-md transition duration-500 sm:top-5 ${
        ready ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-6 opacity-0'
      }`}
    >
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-soft backdrop-blur-md">
        <img src="/icons/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p id="install-title" className="font-display text-sm font-bold text-ink">
            {mobile ? t.installApp.titlePhone : t.installApp.titleDesktop}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-slate-500">
            {ios && !canPrompt ? (
              <>
                <Share className="mr-1 inline h-3.5 w-3.5 -translate-y-px text-brand-600" aria-hidden="true" />
                {t.installApp.iosHint}
              </>
            ) : (
              t.installApp.text
            )}
          </p>
          {canPrompt && (
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={install}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-700 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-800"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                {t.installApp.install}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
              >
                {t.installApp.later}
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t.installApp.close}
          className="-m-1 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
