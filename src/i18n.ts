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
    how: 'Necə işləyir',
    opportunities: 'Fürsətlər',
    guides: 'Bələdçilər',
    calendar: 'Son tarixlər təqvimi',
    more: 'Ətraflı',
    features: 'Xüsusiyyətlər',
    pricing: 'Qiymətlər',
    cta: 'Qeydiyyat',
    openApp: 'Tətbiqə keç',
    login: 'Daxil ol',
    menu: 'Menyu',
    skip: 'Əsas məzmuna keç',
    langLabel: 'Dili dəyiş',
  },
  hero: {
    title1: 'Xaricdə könüllü olmaq',
    title2: 'düşündüyündən asandır.',
    subtitle:
      'Avropada gənclər üçün mübadilələr, təlimlər və könüllülük proqramları var — çox vaxt yol, yaşayış və yeməyi proqram özü ödəyir. Çətin olan onları vaxtında tapmaqdır. Openly Azərbaycandan qatıla biləcəyin fürsətləri bir yerə yığır, son tarixləri xatırladır və müraciətini izləməyə kömək edir.',
    cta: 'Fürsətlərə bax',
    secondary: 'Pulsuz qeydiyyat',
    // Boarding-pass cards in the hero (decorative).
    pass: {
      exchange: 'Gənclər mübadiləsi',
      training: 'Təlim kursu',
      from: 'BAKI',
      lisbon: 'LİSSABON',
      berlin: 'BERLİN',
      dates: 'Tarix',
      topic: 'Mövzu',
      costs: 'Xərclər',
      covered: 'Ödənilir',
      environment: 'Ekologiya',
      climate: 'İqlim',
      applyBy: 'Son tarix',
      daysLeft: (n: number) => `${n} gün qaldı`,
      months: ['YAN', 'FEV', 'MAR', 'APR', 'MAY', 'İYN', 'İYL', 'AVQ', 'SEN', 'OKT', 'NOY', 'DEK'],
    },
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
  backToTop: 'Yuxarı qalx',
  explain: {
    eyebrow: 'Sadə dillə',
    title: 'Bu fürsətlər nədir?',
    subtitle: '“Erasmus+”, “ESC”, “youth exchange” eşitmisən, amma nə olduğunu tam bilmirsən? Buradan başla.',
    items: [
      {
        title: 'Gənclər mübadiləsi',
        text: 'Bir neçə ölkədən gənclər 5–21 gün bir yerdə yaşayır və bir mövzu üzərində — ekologiya, incəsənət, insan hüquqları — birlikdə işləyir. Yol, yaşayış və yemək adətən qarşılanır.',
        meta: '13–30 yaş · Erasmus+',
      },
      {
        title: 'Təlim kursu',
        text: 'Gənclərlə işləyənlər, könüllülər və gənc liderlər üçün bir neçə günlük təlim. Yeni metodlar öyrənirsən, başqa ölkələrdən həmkarlarla tanış olursan.',
        meta: 'Adətən 18+ · SALTO-Youth',
      },
      {
        title: 'Uzunmüddətli könüllülük',
        text: '2–12 ay başqa ölkədə bir təşkilatda könüllü işləyirsən. Yaşayış, yemək, sığorta və aylıq cib pulu verilir.',
        meta: '18–30 yaş · Avropa Həmrəylik Korpusu',
      },
      {
        title: 'Onlayn fürsətlər',
        text: 'Evdən çıxmadan qatıla biləcəyin vebinarlar, onlayn kurslar və BMT-nin onlayn könüllülük layihələri.',
        meta: 'Onlayn · BMT Könüllüləri, SALTO',
      },
    ],
    note: 'Hər fürsətin öz şərtləri var. Dəqiq məlumat həmişə rəsmi səhifədədir — hər fürsətdə linkini veririk.',
  },
  live: {
    eyebrow: 'Canlı',
    titleNew: (n: number) => `Bu həftə ${n} yeni fürsət`,
    titleOpen: (n: number) => `İndi ${n} açıq fürsət`,
    subtitle: 'Hamısı Azərbaycandan iştirakçılar üçün açıqdır. Qeydiyyatsız bax, bəyəndiyini saxlamaq üçün qoşul.',
    all: 'Bütün fürsətlərə bax',
    online: 'Onlayn',
  },
  how: {
    eyebrow: 'Necə işləyir',
    title: 'Üç addımda fürsətdən müraciətə',
    steps: [
      { title: 'Nə sevdiyini de', text: 'Pulsuz qeydiyyatdan keç və maraqlarını seç: ekologiya, təhsil, incəsənət, idman… Bir dəqiqə çəkir.' },
      { title: 'Sənə uyğun olanı tap', text: 'Siyahıda proqram, ölkə və növə görə süz. Yeni fürsətlər həm də e-poçtuna gəlir — axtarmağa ehtiyac qalmır.' },
      { title: 'Müraciət et, biz izləyək', text: 'Rəsmi səhifədə müraciət edirsən, biz son tarixi xatırladırıq və statusunu bir yerdə saxlayırıq.' },
    ],
  },
  faq: {
    eyebrow: 'Suallar',
    title: 'Tez-tez verilən suallar',
    items: [
      {
        q: `${BRAND} pulsuzdur?`,
        a: `Bəli. Fürsətlər siyahısı, filtrlər, ${FREE_EVENT_LIMIT} fürsətə qədər izləmə və həftəlik xülasə pulsuzdur. Premium (ayda 3 ₼) limitsiz izləmə, gündəlik xülasə, son tarix xatırlatmaları, erkən giriş və AI müraciət köməkçisi əlavə edir.`,
      },
      {
        q: 'Müraciəti özüm edə bilərəm? Siz mənim adımdan müraciət edirsiniz?',
        a: 'Müraciəti həmişə özün, rəsmi mənbədə edirsən — biz hər fürsətdə rəsmi linki veririk. Gənclər mübadilələrinə adətən Azərbaycandakı göndərən (partnyor) təşkilat vasitəsilə müraciət olunur; belə fürsətlərdə təşkilatı və əlaqəsini göstəririk.',
      },
      {
        q: 'Hansı proqramları əhatə edirsiniz?',
        a: 'SALTO-Youth təlim kursları, Erasmus+ gənclər mübadilələri, Avropa Həmrəylik Korpusu (ESC), BMT Könüllüləri (UNV) və milli proqramlar. Fürsətləri komandamız rəsmi mənbələrdən əl ilə əlavə edir.',
      },
      {
        q: 'Premium-u necə ləğv edə bilərəm?',
        a: 'Profil → Plan bölməsində bir kliklə. Saxladığın fürsətlər itmir, sadəcə pulsuz plana keçirsən.',
      },
      {
        q: 'Məlumatlarım təhlükəsizdir?',
        a: 'E-poçtunu yalnız sənə fürsətlər və xatırlatmalar göndərmək üçün istifadə edirik və heç kimə ötürmürük. Bildirişləri istənilən vaxt Profil → Parametrlər bölməsində söndürə bilərsən.',
      },
    ],
  },
  pricing: {
    eyebrow: 'Qiymətlər',
    title: 'Əsas hər şey pulsuzdur',
    subtitle: 'Premium daha çox köməyə ehtiyacı olanlar üçündür — ayda 3 ₼, istədiyin vaxt ləğv edə bilərsən.',
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
        'AI motivasiya məktubu köməkçisi və müraciət yoxlanışı',
        'Ağıllı uyğunlaşdırma: hər fürsət üçün uyğunluq faizi',
        'Gündəlik xülasə e-poçtu',
        'Limitsiz saxlama və müraciət izləmə',
        'Yeni fürsətləri 24 saat əvvəl gör',
        'Təkmil filtrlər: xərclər qarşılanır, son 7 gün',
        'Son tarix xatırlatmaları e-poçtla (7, 3 və 1 gün əvvəl)',
      ],
    },
    cta: 'Pulsuz başla',
    premiumCta: 'Premium ilə başla',
    student: {
      name: 'Tələbə',
      price: '7 ₼',
      desc: 'Xaricdə bakalavr və ya magistr oxumaq istəyənlər üçün.',
      features: [
        'Ayrıca tələbə hesabı və bölməsi',
        'Təqaüdlər: kim üçündür, nəyi qarşılayır, son tarixlər',
        'Universitetlər: ixtisaslar, təhsil və müraciət haqları, tələblər',
        '16 addımlıq müraciət yol xəritəsi',
        'Planlayıcı: balına və büdcənə uyğun universitetlər',
      ],
      cta: 'Nələr daxildir?',
    },
  },
  finalCta: {
    title: 'İlk fürsətini bu gün tap',
    sub: 'Qeydiyyat bir dəqiqə çəkir. Kart lazım deyil, istədiyin vaxt çıxa bilərsən.',
    primary: 'Pulsuz qeydiyyat',
    secondary: 'Əvvəlcə fürsətlərə bax',
  },
  signup: {
    eyebrow: 'Erkən giriş',
    title: 'Növbəti böyük fürsətin səni gözləyir',
    subtitle: 'Siyahıya qoşul — tətbiq hazır olan kimi ilk sən xəbər tutacaqsan.',
    perks: ['Maraqlarına uyğun fürsətlər bir siyahıda', 'Son tarixləri qaçırma', 'Müraciətlərini bir yerdə izlə'],
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
    contact: 'Əlaqə',
    product: 'Məhsul',
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
    opportunities: 'Opportunities',
    guides: 'Guides',
    calendar: 'Deadline calendar',
    more: 'Learn more',
    features: 'Features',
    pricing: 'Pricing',
    cta: 'Sign up',
    openApp: 'Open app',
    login: 'Log in',
    menu: 'Menu',
    skip: 'Skip to main content',
    langLabel: 'Change language',
  },
  hero: {
    title1: 'Volunteering abroad is',
    title2: 'easier than you think.',
    subtitle:
      'Europe runs youth exchanges, training courses and volunteering programmes for young people — often with travel, accommodation and food paid by the programme. The hard part is finding them in time. Openly collects the ones you can join from Azerbaijan, reminds you of deadlines and helps you keep track of your applications.',
    cta: 'Browse opportunities',
    secondary: 'Sign up free',
    pass: {
      exchange: 'Youth exchange',
      training: 'Training course',
      from: 'BAKU',
      lisbon: 'LISBON',
      berlin: 'BERLIN',
      dates: 'Dates',
      topic: 'Topic',
      costs: 'Costs',
      covered: 'Covered',
      environment: 'Environment',
      climate: 'Climate',
      applyBy: 'Apply by',
      daysLeft: (n: number) => `${n} days left`,
      months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
    },
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
  backToTop: 'Back to top',
  explain: {
    eyebrow: 'In plain words',
    title: 'What are these opportunities?',
    subtitle: 'Heard of “Erasmus+”, “ESC” or “youth exchanges” but not sure what they are? Start here.',
    items: [
      {
        title: 'Youth exchange',
        text: 'Young people from several countries live together for 5–21 days and work on one topic — environment, arts, human rights. Travel, accommodation and food are usually covered.',
        meta: 'Ages 13–30 · Erasmus+',
      },
      {
        title: 'Training course',
        text: 'A few days of training for youth workers, volunteers and young leaders. You learn new methods and meet peers from other countries.',
        meta: 'Usually 18+ · SALTO-Youth',
      },
      {
        title: 'Long-term volunteering',
        text: 'You volunteer with an organisation in another country for 2–12 months. Accommodation, food, insurance and monthly pocket money are provided.',
        meta: 'Ages 18–30 · European Solidarity Corps',
      },
      {
        title: 'Online opportunities',
        text: 'Webinars, online courses and UN online volunteering projects you can join from home.',
        meta: 'Online · UN Volunteers, SALTO',
      },
    ],
    note: 'Every opportunity has its own rules. The exact details are always on the official page — we link it on every opportunity.',
  },
  live: {
    eyebrow: 'Live',
    titleNew: (n: number) => `${n} new opportunities this week`,
    titleOpen: (n: number) => `${n} open opportunities right now`,
    subtitle: 'All open to participants from Azerbaijan. Browse without an account; sign up to save the ones you like.',
    all: 'See all opportunities',
    online: 'Online',
  },
  how: {
    eyebrow: 'How it works',
    title: 'From opportunity to application in three steps',
    steps: [
      { title: 'Tell us what you like', text: 'Sign up for free and pick your interests: environment, education, arts, sports… It takes a minute.' },
      { title: 'Find what fits you', text: 'Filter the list by programme, country and type. New opportunities also land in your inbox — no more searching.' },
      { title: 'Apply, we keep track', text: 'You apply on the official page; we remind you of the deadline and keep your status in one place.' },
    ],
  },
  faq: {
    eyebrow: 'Questions',
    title: 'Frequently asked questions',
    items: [
      {
        q: `Is ${BRAND} free?`,
        a: `Yes. The opportunity list, filters, tracking up to ${FREE_EVENT_LIMIT} opportunities and the weekly digest are free. Premium (3 ₼ a month) adds unlimited tracking, a daily digest, deadline reminders, early access and the AI application assistant.`,
      },
      {
        q: 'Can I apply myself? Do you apply on my behalf?',
        a: 'You always apply yourself, at the official source — we link it on every opportunity. Youth exchanges are usually applied to through a sending (partner) organisation in Azerbaijan; for those we show the organisation and how to reach it.',
      },
      {
        q: 'Which programmes do you cover?',
        a: 'SALTO-Youth training courses, Erasmus+ youth exchanges, the European Solidarity Corps (ESC), UN Volunteers (UNV) and national programmes. Our team adds opportunities by hand from official sources.',
      },
      {
        q: 'How do I cancel Premium?',
        a: 'In one click under Profile → Plan. Your saved opportunities stay; you just move to the free plan.',
      },
      {
        q: 'Is my data safe?',
        a: 'We use your email only to send you opportunities and reminders, and never share it. You can turn notifications off anytime under Profile → Settings.',
      },
    ],
  },
  pricing: {
    eyebrow: 'Pricing',
    title: 'The essentials are free',
    subtitle: 'Premium is for when you want more help — 3 ₼ a month, cancel anytime.',
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
        'AI motivation letter assistant and application review',
        'Smart matching: a fit score for every opportunity',
        'Daily digest email',
        'Unlimited saved & tracked opportunities',
        'See new opportunities 24 hours earlier',
        'Advanced filters: funded, closing in 7 days',
        'Deadline reminders by email (7, 3 and 1 day before)',
      ],
    },
    cta: 'Start free',
    premiumCta: 'Start with Premium',
    student: {
      name: 'Student',
      price: '7 ₼',
      desc: 'For anyone who wants a bachelor’s or master’s abroad.',
      features: [
        'A separate student account and section',
        'Scholarships: who they’re for, what they cover, deadlines',
        'Universities: fields, tuition and application fees, requirements',
        'A 16-step application roadmap',
        'Planner: universities that fit your score and budget',
      ],
      cta: 'See what’s inside',
    },
  },
  finalCta: {
    title: 'Find your first opportunity today',
    sub: 'Sign-up takes a minute. No card needed, leave whenever you like.',
    primary: 'Sign up free',
    secondary: 'Browse opportunities first',
  },
  signup: {
    eyebrow: 'Early access',
    title: 'Your next big opportunity is waiting',
    subtitle: 'Join the waitlist — you’ll be the first to know when the app is ready.',
    perks: ['Opportunities matching your interests in one list', 'Never miss a deadline', 'Track all your applications in one place'],
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
    contact: 'Contact',
    product: 'Product',
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
