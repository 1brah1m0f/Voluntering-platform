import { createContext, useContext } from 'react';
import { BRAND, FREE_EVENT_LIMIT } from './config';

export type Lang = 'az' | 'en';

export type EventStatus = 'saved' | 'applied' | 'accepted' | 'rejected';

export interface MockEvent {
  title: string;
  org: string;
  place: string;
  tag: string;
  /** Days from today until the application deadline (negative = closed). */
  daysLeft: number;
  status: EventStatus;
  /** Program logo from /public/logos, if we have one. */
  logo?: string;
}

const az = {
  meta: {
    title: `${BRAND} — Könüllülük fürsətlərini bir daha qaçırma`,
  },
  nav: {
    features: 'Xüsusiyyətlər',
    pricing: 'Qiymətlər',
    cta: 'Erkən qoşul',
    login: 'Daxil ol',
    menu: 'Menyu',
    skip: 'Əsas məzmuna keç',
    langLabel: 'Dili dəyiş',
  },
  hero: {
    badge: 'Tezliklə · Erkən giriş siyahısı açıqdır',
    title1: 'Böyük könüllülük fürsətlərini',
    title2: 'bir daha qaçırma.',
    subtitle:
      'Erasmus+, SALTO-Youth, Avropa Həmrəylik Korpusu, BMT Könüllüləri və milli proqramlar — hamısı bir yerdə. Maraqlarını seç, sənə uyğun fürsətləri hər gün bir dəfə al, son tarixləri isə biz xatırladaq.',
    cta: 'Pulsuz erkən qoşul',
    secondary: 'Xüsusiyyətlərə bax',
    trust: 'Spam yoxdur. İstənilən vaxt abunəlikdən çıxa bilərsən.',
  },
  mock: {
    greeting: 'Salam, Aysel 👋',
    sub: 'Bu gün sənin üçün 4 yeni fürsət var',
    today: 'Bugünkü xülasə',
    tracking: 'Müraciətlərim',
    daysLeft: (d: number) => (d <= 0 ? 'Bağlanıb' : d === 1 ? 'Sabah bitir' : `${d} gün qaldı`),
    save: 'Saxla',
    stats: { saved: 'Saxlanılıb', applied: 'Müraciət', accepted: 'Qəbul' },
    reminder: 'Xatırlatma: “Climate Action” təliminə 3 gün qaldı',
  },
  status: {
    saved: 'Saxlanılıb',
    applied: 'Müraciət edilib',
    accepted: 'Qəbul olunub',
    rejected: 'İmtina',
  } satisfies Record<EventStatus, string>,
  events: [
    { title: 'Youth Exchange in Portugal', org: 'Erasmus+', place: 'Lissabon, Portuqaliya', tag: 'Ekologiya', daysLeft: 3, status: 'saved', logo: '/logos/erasmus-plus.svg' },
    { title: 'Training Course on Climate Action', org: 'SALTO-Youth', place: 'Berlin, Almaniya', tag: 'İqlim', daysLeft: 6, status: 'applied', logo: '/logos/salto-youth.png' },
    { title: 'ESC Volunteering: Youth Centre', org: 'Avropa Həmrəylik Korpusu', place: 'Tartu, Estoniya', tag: 'Təhsil', daysLeft: 12, status: 'accepted', logo: '/logos/european-solidarity-corps.png' },
    { title: 'UN Online Volunteering: Digital Skills', org: 'BMT Könüllüləri', place: 'Onlayn', tag: 'Rəqəmsal', daysLeft: 18, status: 'saved', logo: '/logos/un-volunteers.svg' },
    { title: 'Milli könüllülük proqramı: İdman tədbirləri', org: 'Milli proqram', place: 'Bakı, Azərbaycan', tag: 'İdman', daysLeft: 25, status: 'rejected' },
  ] as MockEvent[],
  strip: {
    label: 'Fürsətləri bu proqramlardan toplayırıq',
  },
  float: {
    newToday: '+4 yeni fürsət',
    newTodaySub: 'maraqlarına uyğun',
    accepted: 'Qəbul olundun!',
    acceptedSub: 'ESC · Tartu',
  },
  problem: {
    eyebrow: 'Problem',
    title: 'Fürsət var, amma tapmaq çətindir',
    subtitle: 'Hər il minlərlə gənc sadəcə vaxtında xəbər tutmadığı üçün həyatını dəyişə biləcək proqramları qaçırır.',
    items: [
      { title: 'Onlarla sayta səpələnib', text: 'SALTO, Erasmus+, ESC, BMT, Telegram kanalları, Instagram səhifələri… Hər gün hamısını yoxlamaq mümkün deyil.' },
      { title: 'Son tarixlər qaçırılır', text: 'Maraqlı bir fürsət tapırsan, “sonra müraciət edərəm” deyirsən — və deadline artıq keçib.' },
      { title: 'Müraciətləri izləmək qarışıqdır', text: 'Harada müraciət etdin, hansı cavab gəldi, nə gözləyir? Qeydlər, skrinşotlar, unudulmuş e-poçtlar.' },
    ],
  },
  backToTop: 'Yuxarı qalx',
  features: {
    eyebrow: 'Xüsusiyyətlər',
    title: 'Könüllü həyatını asanlaşdıran hər şey',
    subtitle: 'Fürsəti tapmaqdan qəbul məktubuna qədər — bütün yol bir tətbiqdə.',
    items: [
      { title: 'Maraqlara əsaslanan seçim', text: 'Qeydiyyatda maraq sahələrini, ölkələri və proqram növlərini seç. Yalnız sənə aid olan fürsətləri görəcəksən.' },
      { title: 'Gündəlik xülasə', text: 'Hər gün bir səliqəli e-poçt: son 24 saatda dərc olunan, maraqlarına uyğun yeni fürsətlər.' },
      { title: 'Bir kliklə saxla', text: 'Bəyəndiyin fürsəti şəxsi siyahına əlavə et ki, sonra rahatca qayıdasan.' },
      { title: 'Son tarix xatırlatmaları', text: 'Saxladığın fürsətin müraciət müddəti bitməyə yaxınlaşanda avtomatik bildiriş alırsan.' },
      { title: 'Müraciət paneli', text: 'Bütün müraciətlərin bir yerdə: Saxlanılıb → Müraciət edilib → Qəbul / İmtina.' },
    ],
    interests: ['Ekologiya', 'Təhsil', 'İnsan hüquqları', 'İncəsənət', 'İdman'],
  },
  preview: {
    eyebrow: 'Tətbiqə bax',
    title: 'Belə görünəcək',
    subtitle: 'Bütün saxladığın və müraciət etdiyin fürsətlər — son tarixləri və statusları ilə bir ekranda.',
    tabs: ['Hamısı', 'Saxlanılıb', 'Müraciət edilib', 'Nəticə'],
    colEvent: 'Fürsət',
    colDeadline: 'Son tarix',
    colStatus: 'Status',
    note: 'Nümunə məlumatlardır. Real proqramlar və tarixlər fərqli ola bilər.',
    nav: ['Bugünkü xülasə', 'Müraciətlərim', 'Xatırlatmalar', 'Maraqlarım'],
    greeting: 'Salam, Aysel 👋',
    greetingSub: 'Bu həftə 2 son tarix yaxınlaşır',
    search: 'Fürsət və ya proqram axtar…',
    empty: 'Bu filtrdə fürsət yoxdur',
    hint: 'Sına: statusa və ya əlfəcinə klik et',
    toast: (title: string, status: string) => `“${title}” → ${status}`,
    savedToast: 'Siyahına əlavə olundu',
    unsavedToast: 'Siyahından çıxarıldı',
    upgrade: 'Premium ilə limitsiz izləmə',
    upgradeSub: '3 ₼ / ay',
  },
  pricing: {
    eyebrow: 'Qiymətlər',
    title: 'Pulsuz başla, lazım olsa genişlət',
    subtitle: 'Erkən qoşulanlar Premium-a xüsusi endirimlə ilk çıxış əldə edəcək.',
    perMonth: '/ ay',
    popular: 'Ən sərfəli',
    free: {
      name: 'Pulsuz',
      desc: 'Könüllülüyə başlayanlar üçün hər şey.',
      price: '0 ₼',
      features: [
        'Həftəlik xülasə e-poçtu',
        'Maraq sahələri və ölkə seçimi',
        `Eyni anda ${FREE_EVENT_LIMIT} fürsətə qədər saxlama və izləmə`,
      ],
    },
    premium: {
      name: 'Premium',
      price: '3 ₼',
      desc: 'Aktiv müraciət edən və heç nəyi qaçırmaq istəməyənlər üçün.',
      features: [
        'Gündəlik xülasə e-poçtu',
        'Limitsiz saxlama və müraciət izləmə',
        'Təkmil filtrlər (ölkə, müddət, xərclərin qarşılanması və s.)',
        'Prioritet — yeni fürsətlərdən daha tez xəbər tut',
        'Genişləndirilmiş xatırlatmalar (7, 3, 1 gün əvvəl, Telegram)',
      ],
    },
    cta: 'Siyahıya qoşul',
  },
  signup: {
    eyebrow: 'Erkən giriş',
    title: 'Növbəti böyük fürsətin səni gözləyir',
    subtitle: 'Siyahıya qoşul — tətbiq hazır olan kimi ilk sən xəbər tutacaqsan.',
    perks: ['Tətbiqə ilk giriş', 'Premium-a erkən qoşulan endirimi', 'Məhsulu birlikdə formalaşdırmaq imkanı'],
    name: 'Ad Soyad',
    namePh: 'Aysel Məmmədova',
    nameRequired: 'Adını və soyadını daxil et.',
    email: 'E-poçt',
    emailPh: 'sen@example.com',
    emailRequired: 'E-poçt ünvanını daxil et.',
    emailInvalid: 'E-poçt ünvanı düzgün görünmür.',
    plan: 'Plan seç',
    planOptions: [
      { id: 'basic', label: 'Sadə', price: 'Pulsuz' },
      { id: 'premium', label: 'Premium', price: '3 ₼ / ay' },
    ],
    submit: 'Siyahıya qoşul',
    submitting: 'Göndərilir…',
    privacy: 'Spam yoxdur. İstənilən vaxt siyahıdan çıxa bilərsən.',
    error: 'Nəsə alınmadı. Bir az sonra yenidən cəhd et.',
    successTitle: 'Təbriklər, siyahıdasan! 🎉',
    successText: 'Tətbiq hazır olan kimi sənə ilk yazacağıq. Bu arada dostlarına da danış — birlikdə daha çox fürsət tapaq.',
    duplicateTitle: 'Sən artıq siyahıdasan! 🙌',
    duplicateText: 'Bu e-poçt artıq qeydiyyatdadır. Tətbiq açılan kimi xəbər verəcəyik.',
    again: 'Başqa e-poçt əlavə et',
  },
  footer: {
    tagline: 'Gənclər və könüllülər üçün bütün böyük fürsətlər bir yerdə.',
    rights: 'Bütün hüquqlar qorunur.',
    disclaimer: `${BRAND} Erasmus+, SALTO-Youth, ESC və ya BMT ilə rəsmi əlaqəli deyil. Bütün proqram adları müvafiq sahiblərinə məxsusdur.`,
  },
};

export type Dict = typeof az;

const en: Dict = {
  meta: {
    title: `${BRAND} — Never miss a volunteering opportunity again`,
  },
  nav: {
    features: 'Features',
    pricing: 'Pricing',
    cta: 'Join early',
    login: 'Log in',
    menu: 'Menu',
    skip: 'Skip to main content',
    langLabel: 'Change language',
  },
  hero: {
    badge: 'Coming soon · Early access list is open',
    title1: 'Never miss a big',
    title2: 'volunteering opportunity again.',
    subtitle:
      'Erasmus+, SALTO-Youth, European Solidarity Corps, UN Volunteers and national programs — all in one place. Pick your interests, get matching opportunities once a day, and let us remind you about deadlines.',
    cta: 'Join early for free',
    secondary: 'See features',
    trust: 'No spam. Unsubscribe anytime.',
  },
  mock: {
    greeting: 'Hi, Aysel 👋',
    sub: '4 new opportunities for you today',
    today: "Today's digest",
    tracking: 'My applications',
    daysLeft: (d: number) => (d <= 0 ? 'Closed' : d === 1 ? 'Ends tomorrow' : `${d} days left`),
    save: 'Save',
    stats: { saved: 'Saved', applied: 'Applied', accepted: 'Accepted' },
    reminder: 'Reminder: 3 days left for “Climate Action” training',
  },
  status: {
    saved: 'Saved',
    applied: 'Applied',
    accepted: 'Accepted',
    rejected: 'Rejected',
  },
  events: [
    { title: 'Youth Exchange in Portugal', org: 'Erasmus+', place: 'Lisbon, Portugal', tag: 'Environment', daysLeft: 3, status: 'saved', logo: '/logos/erasmus-plus.svg' },
    { title: 'Training Course on Climate Action', org: 'SALTO-Youth', place: 'Berlin, Germany', tag: 'Climate', daysLeft: 6, status: 'applied', logo: '/logos/salto-youth.png' },
    { title: 'ESC Volunteering: Youth Centre', org: 'European Solidarity Corps', place: 'Tartu, Estonia', tag: 'Education', daysLeft: 12, status: 'accepted', logo: '/logos/european-solidarity-corps.png' },
    { title: 'UN Online Volunteering: Digital Skills', org: 'UN Volunteers', place: 'Online', tag: 'Digital', daysLeft: 18, status: 'saved', logo: '/logos/un-volunteers.svg' },
    { title: 'National volunteering program: Sports events', org: 'National program', place: 'Baku, Azerbaijan', tag: 'Sports', daysLeft: 25, status: 'rejected' },
  ],
  strip: {
    label: 'We collect opportunities from these programs',
  },
  float: {
    newToday: '+4 new opportunities',
    newTodaySub: 'matching your interests',
    accepted: 'You got accepted!',
    acceptedSub: 'ESC · Tartu',
  },
  problem: {
    eyebrow: 'The problem',
    title: 'Opportunities exist — finding them is the hard part',
    subtitle: 'Every year thousands of young people miss life-changing programs simply because they heard about them too late.',
    items: [
      { title: 'Scattered across dozens of sites', text: 'SALTO, Erasmus+, ESC, UN, Telegram channels, Instagram pages… Checking them all every day is impossible.' },
      { title: 'Deadlines get missed', text: 'You find something great, think “I’ll apply later” — and the deadline has already passed.' },
      { title: 'Tracking applications is messy', text: 'Where did you apply, who replied, what’s pending? Notes, screenshots, forgotten emails.' },
    ],
  },
  backToTop: 'Back to top',
  features: {
    eyebrow: 'Features',
    title: 'Everything that makes volunteering life easier',
    subtitle: 'From discovering an opportunity to your acceptance letter — the whole journey in one app.',
    items: [
      { title: 'Interest-based personalization', text: 'Pick your interest areas, countries and program types at signup. You only see opportunities that matter to you.' },
      { title: 'Daily digest', text: 'One clean email a day: new opportunities published in the last 24 hours that match your interests.' },
      { title: 'Save in one click', text: 'Add any opportunity to your personal list and come back to it anytime.' },
      { title: 'Deadline reminders', text: 'Get notified automatically when a saved opportunity’s application deadline is approaching.' },
      { title: 'Application dashboard', text: 'All your applications in one place: Saved → Applied → Accepted / Rejected.' },
    ],
    interests: ['Environment', 'Education', 'Human rights', 'Arts', 'Sports'],
  },
  preview: {
    eyebrow: 'Sneak peek',
    title: 'Here’s how it will look',
    subtitle: 'Everything you saved and applied to — with deadlines and statuses — on one screen.',
    tabs: ['All', 'Saved', 'Applied', 'Result'],
    colEvent: 'Opportunity',
    colDeadline: 'Deadline',
    colStatus: 'Status',
    note: 'Sample data. Real programs and dates may differ.',
    nav: ['Today’s digest', 'My applications', 'Reminders', 'My interests'],
    greeting: 'Hi, Aysel 👋',
    greetingSub: '2 deadlines are coming up this week',
    search: 'Search opportunities or programs…',
    empty: 'No opportunities in this filter',
    hint: 'Try it: click a status or the bookmark',
    toast: (title: string, status: string) => `“${title}” → ${status}`,
    savedToast: 'Added to your list',
    unsavedToast: 'Removed from your list',
    upgrade: 'Unlimited tracking with Premium',
    upgradeSub: '3 ₼ / mo',
  },
  pricing: {
    eyebrow: 'Pricing',
    title: 'Start free, upgrade if you need more',
    subtitle: 'Early members get first access to Premium with a special discount.',
    perMonth: '/ month',
    popular: 'Best value',
    free: {
      name: 'Free',
      desc: 'Everything you need to start volunteering.',
      price: '₼0',
      features: [
        'Weekly digest email',
        'Interest areas and country selection',
        `Save and track up to ${FREE_EVENT_LIMIT} opportunities at a time`,
      ],
    },
    premium: {
      name: 'Premium',
      price: '3 ₼',
      desc: 'For active applicants who don’t want to miss anything.',
      features: [
        'Daily digest email',
        'Unlimited saved & tracked opportunities',
        'Advanced filters (country, duration, costs covered, etc.)',
        'Priority — hear about new opportunities earlier',
        'Extended reminders (7, 3, 1 day before, Telegram)',
      ],
    },
    cta: 'Join the waitlist',
  },
  signup: {
    eyebrow: 'Early access',
    title: 'Your next big opportunity is waiting',
    subtitle: 'Join the waitlist — you’ll be the first to know when the app is ready.',
    perks: ['First access to the app', 'Early-member Premium discount', 'Help shape the product'],
    name: 'Full name',
    namePh: 'Aysel Mammadova',
    nameRequired: 'Please enter your full name.',
    email: 'Email',
    emailPh: 'you@example.com',
    emailRequired: 'Please enter your email address.',
    emailInvalid: 'That email address doesn’t look right.',
    plan: 'Choose a plan',
    planOptions: [
      { id: 'basic', label: 'Basic', price: 'Free' },
      { id: 'premium', label: 'Premium', price: '3 ₼ / mo' },
    ],
    submit: 'Join the waitlist',
    submitting: 'Sending…',
    privacy: 'No spam. Unsubscribe any time.',
    error: 'Something went wrong. Please try again in a moment.',
    successTitle: 'You’re on the list! 🎉',
    successText: 'We’ll email you first as soon as the app is ready. Meanwhile, tell your friends — let’s find more opportunities together.',
    duplicateTitle: 'You’re already on the list! 🙌',
    duplicateText: 'This email is already registered. We’ll let you know as soon as we launch.',
    again: 'Add another email',
  },
  footer: {
    tagline: 'All the big opportunities for young people and volunteers in one place.',
    rights: 'All rights reserved.',
    disclaimer: `${BRAND} is not officially affiliated with Erasmus+, SALTO-Youth, ESC or the UN. All program names belong to their respective owners.`,
  },
};

export const dictionaries: Record<Lang, Dict> = { az, en };

export const LangContext = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({
  lang: 'az',
  t: az,
  setLang: () => {},
});

export const useLang = () => useContext(LangContext);
