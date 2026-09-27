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
}

const az = {
  meta: {
    title: `${BRAND} — Könüllülük fürsətlərini bir daha qaçırma`,
  },
  nav: {
    how: 'Necə işləyir',
    features: 'Xüsusiyyətlər',
    pricing: 'Qiymətlər',
    cta: 'Erkən qoşul',
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
    secondary: 'Necə işləyir?',
    counter: (n: number) => `${n.toLocaleString('az-AZ')} nəfər artıq siyahıdadır`,
    counterFallback: 'İlk qoşulanlardan ol',
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
    { title: 'Youth Exchange in Portugal', org: 'Erasmus+', place: 'Lissabon, Portuqaliya', tag: 'Ekologiya', daysLeft: 3, status: 'saved' },
    { title: 'Training Course on Climate Action', org: 'SALTO-Youth', place: 'Berlin, Almaniya', tag: 'İqlim', daysLeft: 6, status: 'applied' },
    { title: 'ESC Volunteering: Youth Centre', org: 'Avropa Həmrəylik Korpusu', place: 'Tartu, Estoniya', tag: 'Təhsil', daysLeft: 12, status: 'accepted' },
    { title: 'UN Online Volunteering: Digital Skills', org: 'BMT Könüllüləri', place: 'Onlayn', tag: 'Rəqəmsal', daysLeft: 18, status: 'saved' },
    { title: 'Milli könüllülük proqramı: İdman tədbirləri', org: 'Milli proqram', place: 'Bakı, Azərbaycan', tag: 'İdman', daysLeft: 25, status: 'rejected' },
  ] as MockEvent[],
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
  how: {
    eyebrow: 'Necə işləyir',
    title: 'Üç addımda bütün fürsətlər nəzarətində',
    steps: [
      { title: 'Maraqlarını seç', text: 'Ekologiya, təhsil, insan hüquqları, incəsənət, idman… Həmçinin ölkələri və proqram növlərini qeyd et.' },
      { title: 'Gündəlik xülasə al', text: 'Gündə bir dəfə yalnız sənə uyğun yeni fürsətlər — səliqəli, qısa, spamsız.' },
      { title: 'Saxla, müraciət et, izlə', text: 'Bəyəndiyini bir kliklə saxla, rəsmi mənbədə müraciət et və statusunu panelində izlə.' },
    ],
  },
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
  },
  pricing: {
    eyebrow: 'Qiymətlər',
    title: 'Pulsuz başla, lazım olsa genişlət',
    subtitle: 'Erkən qoşulanlar Premium-a xüsusi endirimlə ilk çıxış əldə edəcək.',
    soon: 'Tezliklə',
    popular: 'Ən sərfəli',
    free: {
      name: 'Pulsuz',
      desc: 'Könüllülüyə başlayanlar üçün hər şey.',
      price: '0 ₼',
      features: [
        'Gündəlik xülasə e-poçtu',
        'Maraq sahələri və ölkə seçimi',
        `Eyni anda ${FREE_EVENT_LIMIT} fürsətə qədər saxlama və izləmə`,
        'Əsas son tarix xatırlatmaları',
      ],
    },
    premium: {
      name: 'Premium',
      desc: 'Aktiv müraciət edən və heç nəyi qaçırmaq istəməyənlər üçün.',
      features: [
        'Limitsiz saxlama və müraciət izləmə',
        'Təkmil filtrlər (ölkə, müddət, xərclərin qarşılanması və s.)',
        'Prioritet — yeni fürsətlərdən daha tez xəbər tut',
        'Genişləndirilmiş xatırlatmalar (7, 3, 1 gün əvvəl, Telegram)',
      ],
    },
    cta: 'Siyahıya qoşul',
  },
  faq: {
    eyebrow: 'Suallar',
    title: 'Tez-tez verilən suallar',
    items: [
      { q: `${BRAND} pulsuzdur?`, a: `Bəli! Əsas funksiyalar — gündəlik xülasə, maraq seçimi, ${FREE_EVENT_LIMIT} fürsətə qədər izləmə və xatırlatmalar — həmişə pulsuz olacaq. Daha çox imkan istəyənlər üçün sonradan Premium plan təklif edəcəyik.` },
      { q: 'Hansı proqramları əhatə edirsiniz?', a: 'SALTO-Youth təlim kursları, Erasmus+ gənclər mübadilələri, Avropa Həmrəylik Korpusu (ESC), BMT Könüllüləri (UNV), həmçinin böyük milli könüllülük proqramları və tədbirləri. Siyahını daim genişləndirəcəyik.' },
      { q: 'Nə qədər tez-tez e-poçt alacağam?', a: 'Gündə ən çox bir dəfə — yalnız maraqlarına uyğun yeni fürsət olduqda. Üstəlik, saxladığın fürsətlərin son tarixi yaxınlaşanda xatırlatma. Spam yoxdur.' },
      { q: 'Mənim adımdan müraciət edirsiniz?', a: 'Xeyr. Biz hər fürsəti rəsmi mənbəyə yönləndiririk və müraciəti özün edirsən. Bizim işimiz — heç nəyi qaçırmamağın və hər şeyi rahat izləməyin üçündür.' },
      { q: 'Məlumatlarım təhlükəsizdir?', a: 'Bəli. E-poçtunu yalnız sənə fürsətlər göndərmək üçün istifadə edirik, heç kimə ötürmürük. İstənilən vaxt siyahıdan çıxa bilərsən.' },
    ],
  },
  signup: {
    eyebrow: 'Erkən giriş',
    title: 'Növbəti böyük fürsətin səni gözləyir',
    subtitle: 'Siyahıya qoşul — tətbiq hazır olan kimi ilk sən xəbər tutacaqsan. Bir neçə qısa sual isə məhsulu məhz sənin üçün qurmağımıza kömək edəcək.',
    perks: ['Tətbiqə ilk giriş', 'Premium-a erkən qoşulan endirimi', 'Məhsulu birlikdə formalaşdırmaq imkanı'],
    name: 'Adın',
    optional: '(istəyə bağlı)',
    namePh: 'Məs. Aysel',
    email: 'E-poçt',
    emailPh: 'sen@example.com',
    emailRequired: 'E-poçt ünvanını daxil et.',
    emailInvalid: 'E-poçt ünvanı düzgün görünmür.',
    interests: 'Maraq sahələrin',
    interestsHint: 'Bir neçəsini seçə bilərsən',
    interestOptions: [
      { id: 'environment', label: 'Ekologiya' },
      { id: 'education', label: 'Təhsil' },
      { id: 'human_rights', label: 'İnsan hüquqları' },
      { id: 'culture_arts', label: 'Mədəniyyət və incəsənət' },
      { id: 'sports', label: 'İdman' },
      { id: 'digital', label: 'Rəqəmsal bacarıqlar' },
      { id: 'inclusion', label: 'Sosial inklüziya' },
      { id: 'health', label: 'Sağlamlıq' },
    ],
    country: 'Ölkə',
    countries: [
      { id: 'AZ', label: 'Azərbaycan' },
      { id: 'TR', label: 'Türkiyə' },
      { id: 'GE', label: 'Gürcüstan' },
      { id: 'KZ', label: 'Qazaxıstan' },
      { id: 'UZ', label: 'Özbəkistan' },
      { id: 'UA', label: 'Ukrayna' },
      { id: 'DE', label: 'Almaniya' },
      { id: 'PL', label: 'Polşa' },
      { id: 'OTHER_EU', label: 'Digər Avropa ölkəsi' },
      { id: 'OTHER', label: 'Digər' },
    ],
    applied: 'Heç beynəlxalq könüllülük proqramına müraciət etmisən?',
    appliedOptions: [
      { id: 'yes', label: 'Bəli' },
      { id: 'no', label: 'Xeyr' },
      { id: 'planning', label: 'Planlaşdırıram' },
    ],
    pay: 'Premium plan üçün ödəniş edərdin?',
    payOptions: [
      { id: 'yes', label: 'Bəli' },
      { id: 'maybe', label: 'Bəlkə' },
      { id: 'no', label: 'Xeyr' },
    ],
    submit: 'Siyahıya qoşul',
    submitting: 'Göndərilir…',
    privacy: 'Qoşulmaqla yalnız məhsul yenilikləri və fürsətlər barədə e-poçt almağa razılaşırsan. Spam yoxdur.',
    error: 'Nəsə alınmadı. Bir az sonra yenidən cəhd et.',
    successTitle: 'Təbriklər, siyahıdasan! 🎉',
    successText: 'Tətbiq hazır olan kimi sənə ilk yazacağıq. Bu arada dostlarına da danış — birlikdə daha çox fürsət tapaq.',
    duplicateTitle: 'Sən artıq siyahıdasan! 🙌',
    duplicateText: 'Bu e-poçt artıq qeydiyyatdadır. Tətbiq açılan kimi xəbər verəcəyik.',
    again: 'Başqa e-poçt əlavə et',
  },
  footer: {
    tagline: 'Gənclər və könüllülər üçün bütün böyük fürsətlər bir yerdə.',
    contact: 'Əlaqə',
    follow: 'Bizi izlə',
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
    how: 'How it works',
    features: 'Features',
    pricing: 'Pricing',
    cta: 'Join early',
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
    secondary: 'How it works',
    counter: (n: number) => `${n.toLocaleString('en-US')} people already joined`,
    counterFallback: 'Be one of the first to join',
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
    { title: 'Youth Exchange in Portugal', org: 'Erasmus+', place: 'Lisbon, Portugal', tag: 'Environment', daysLeft: 3, status: 'saved' },
    { title: 'Training Course on Climate Action', org: 'SALTO-Youth', place: 'Berlin, Germany', tag: 'Climate', daysLeft: 6, status: 'applied' },
    { title: 'ESC Volunteering: Youth Centre', org: 'European Solidarity Corps', place: 'Tartu, Estonia', tag: 'Education', daysLeft: 12, status: 'accepted' },
    { title: 'UN Online Volunteering: Digital Skills', org: 'UN Volunteers', place: 'Online', tag: 'Digital', daysLeft: 18, status: 'saved' },
    { title: 'National volunteering program: Sports events', org: 'National program', place: 'Baku, Azerbaijan', tag: 'Sports', daysLeft: 25, status: 'rejected' },
  ],
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
  how: {
    eyebrow: 'How it works',
    title: 'Every opportunity under control in three steps',
    steps: [
      { title: 'Choose your interests', text: 'Environment, education, human rights, arts, sports… Plus the countries and program types you prefer.' },
      { title: 'Get a daily digest', text: 'Once a day, only new opportunities that match you — clean, short, spam-free.' },
      { title: 'Save, apply, track', text: 'Save what you like in one click, apply on the official site and track your status on your dashboard.' },
    ],
  },
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
  },
  pricing: {
    eyebrow: 'Pricing',
    title: 'Start free, upgrade if you need more',
    subtitle: 'Early members get first access to Premium with a special discount.',
    soon: 'Coming soon',
    popular: 'Best value',
    free: {
      name: 'Free',
      desc: 'Everything you need to start volunteering.',
      price: '₼0',
      features: [
        'Daily digest email',
        'Interest areas and country selection',
        `Save and track up to ${FREE_EVENT_LIMIT} opportunities at a time`,
        'Basic deadline reminders',
      ],
    },
    premium: {
      name: 'Premium',
      desc: 'For active applicants who don’t want to miss anything.',
      features: [
        'Unlimited saved & tracked opportunities',
        'Advanced filters (country, duration, costs covered, etc.)',
        'Priority — hear about new opportunities earlier',
        'Extended reminders (7, 3, 1 day before, Telegram)',
      ],
    },
    cta: 'Join the waitlist',
  },
  faq: {
    eyebrow: 'Questions',
    title: 'Frequently asked questions',
    items: [
      { q: `Is ${BRAND} free?`, a: `Yes! The core features — daily digest, interest selection, tracking up to ${FREE_EVENT_LIMIT} opportunities and reminders — will always be free. We’ll offer a Premium plan later for those who want more.` },
      { q: 'Which programs do you cover?', a: 'SALTO-Youth training courses, Erasmus+ youth exchanges, European Solidarity Corps (ESC), UN Volunteers (UNV), plus major national volunteering programs and events. We’ll keep expanding the list.' },
      { q: 'How often will I get emails?', a: 'At most once a day — only when there are new opportunities matching your interests. Plus reminders when a saved opportunity’s deadline is near. No spam.' },
      { q: 'Do you apply on my behalf?', a: 'No. We link every opportunity to its official source and you apply yourself. Our job is to make sure you never miss anything and can track it all easily.' },
      { q: 'Is my data safe?', a: 'Yes. We only use your email to send you opportunities and never share it. You can leave the list anytime.' },
    ],
  },
  signup: {
    eyebrow: 'Early access',
    title: 'Your next big opportunity is waiting',
    subtitle: 'Join the waitlist — you’ll be the first to know when the app is ready. A few quick questions help us build it for you.',
    perks: ['First access to the app', 'Early-member Premium discount', 'Help shape the product'],
    name: 'Your name',
    optional: '(optional)',
    namePh: 'e.g. Aysel',
    email: 'Email',
    emailPh: 'you@example.com',
    emailRequired: 'Please enter your email address.',
    emailInvalid: 'That email address doesn’t look right.',
    interests: 'Your interest areas',
    interestsHint: 'Pick as many as you like',
    interestOptions: [
      { id: 'environment', label: 'Environment' },
      { id: 'education', label: 'Education' },
      { id: 'human_rights', label: 'Human rights' },
      { id: 'culture_arts', label: 'Culture & arts' },
      { id: 'sports', label: 'Sports' },
      { id: 'digital', label: 'Digital skills' },
      { id: 'inclusion', label: 'Social inclusion' },
      { id: 'health', label: 'Health' },
    ],
    country: 'Country',
    countries: [
      { id: 'AZ', label: 'Azerbaijan' },
      { id: 'TR', label: 'Türkiye' },
      { id: 'GE', label: 'Georgia' },
      { id: 'KZ', label: 'Kazakhstan' },
      { id: 'UZ', label: 'Uzbekistan' },
      { id: 'UA', label: 'Ukraine' },
      { id: 'DE', label: 'Germany' },
      { id: 'PL', label: 'Poland' },
      { id: 'OTHER_EU', label: 'Other European country' },
      { id: 'OTHER', label: 'Other' },
    ],
    applied: 'Have you ever applied to an international volunteering program?',
    appliedOptions: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
      { id: 'planning', label: 'Planning to' },
    ],
    pay: 'Would you pay for a Premium plan?',
    payOptions: [
      { id: 'yes', label: 'Yes' },
      { id: 'maybe', label: 'Maybe' },
      { id: 'no', label: 'No' },
    ],
    submit: 'Join the waitlist',
    submitting: 'Sending…',
    privacy: 'By joining you agree to receive emails about the product and opportunities. No spam.',
    error: 'Something went wrong. Please try again in a moment.',
    successTitle: 'You’re on the list! 🎉',
    successText: 'We’ll email you first as soon as the app is ready. Meanwhile, tell your friends — let’s find more opportunities together.',
    duplicateTitle: 'You’re already on the list! 🙌',
    duplicateText: 'This email is already registered. We’ll let you know as soon as we launch.',
    again: 'Add another email',
  },
  footer: {
    tagline: 'All the big opportunities for young people and volunteers in one place.',
    contact: 'Contact',
    follow: 'Follow us',
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
