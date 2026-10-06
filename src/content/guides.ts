import type { Lang } from '../i18n';

// Short, practical guides (the "Bələdçilər" pages). Rules change between calls,
// so the text stays general and every guide points to the official source.

export interface GuideSection {
  h: string;
  p: string[];
  /** Annotated screenshots shown under the text (files in /public/guides). */
  images?: { src: string; alt: string }[];
}

export interface GuideText {
  title: string;
  summary: string;
  sections: GuideSection[];
}

export interface Guide {
  slug: string;
  minutes: number;
  /** Shown on opportunities of these kinds as "useful reading". */
  kinds: string[];
  links: { label: string; href: string }[];
  text: Record<Lang, GuideText>;
}

export const GUIDES: Guide[] = [
  {
    slug: 'youth-exchange',
    minutes: 4,
    kinds: ['youth_exchange'],
    links: [
      { label: 'Erasmus+ Programme Guide', href: 'https://erasmus-plus.ec.europa.eu/programme-guide' },
      { label: 'European Youth Portal', href: 'https://youth.europa.eu/' },
    ],
    text: {
      az: {
        title: 'Gənclər mübadiləsinə necə müraciət etmək olar',
        summary: 'İlk mübadiləyə hazırlaşanlar üçün addım-addım: layihəni tapmaqdan geri qayıdıb xərcləri almağa qədər.',
        sections: [
          {
            h: 'Gənclər mübadiləsi nədir?',
            p: [
              'Bir neçə ölkədən gənc qruplarının bir mövzu ətrafında (ekologiya, incəsənət, insan hüquqları və s.) 5–21 gün birlikdə yaşayıb işlədiyi Erasmus+ layihəsidir. Proqram qeyri-formal təhsilə əsaslanır: müzakirələr, oyunlar, seminarlar, mədəni gecələr.',
              'İştirakçıların yaşı adətən 13–30 arasıdır, amma hər layihə öz aralığını müəyyən edir — elandakı şərtlərə bax.',
            ],
          },
          {
            h: '1. Uyğun layihəni tap',
            p: [
              'Openly-də “Gənclər mübadiləsi” növünü seç və elanda Azərbaycanın iştirakçı ölkələr arasında olduğunu yoxla. Tarixlər, yaş aralığı və mövzu sənə uyğundursa, saxla — son tarixi sənə xatırladacağıq.',
            ],
          },
          {
            h: '2. Göndərən təşkilatla əlaqə saxla',
            p: [
              'Mübadiləyə adətən fərdi yox, Azərbaycandakı partnyor (göndərən) təşkilat vasitəsilə qatılırsan. Elanda təşkilat göstərilibsə, onlara yaz; göstərilməyibsə, layihənin təşkilatçısından Azərbaycandakı partnyoru soruş.',
            ],
          },
          {
            h: '3. Müraciət formasını doldur',
            p: [
              'Çox vaxt qısa onlayn forma olur: özün haqqında, ingilis dili səviyyən, mövzuya marağın və niyə qatılmaq istədiyin. Konkret ol: nə etmisən, nə öyrənmək istəyirsən, geri qayıdanda nəyi paylaşacaqsan.',
            ],
          },
          {
            h: '4. Qəbul olunsan',
            p: [
              'Təşkilatçılar adətən yol, viza, sığorta və iştirakçı məlumatları ilə paket göndərir. Bileti almazdan əvvəl təşkilatla razılaşdır: yol xərci adətən layihədən sonra, məsafəyə görə müəyyən olunan limit daxilində qaytarılır.',
              'Bütün biletləri, minik talonlarını (boarding pass) və qəbzləri saxla — onlarsız xərc qaytarılmaya bilər.',
            ],
          },
          {
            h: '5. Geri qayıdanda',
            p: [
              'Layihədən sonra Youthpass sertifikatı ala bilərsən — öyrəndiklərini təsdiqləyən sənəddir, CV-də faydalıdır. Təcrübəni yerli icmanla paylaşmaq da çox vaxt layihənin şərtlərindəndir.',
            ],
          },
        ],
      },
      en: {
        title: 'How to apply to a youth exchange',
        summary: 'Step by step for your first exchange: from finding a project to getting your travel costs back.',
        sections: [
          {
            h: 'What is a youth exchange?',
            p: [
              'An Erasmus+ project where groups of young people from several countries live and work together for 5–21 days around one topic (environment, arts, human rights…). It is based on non-formal learning: discussions, games, workshops, cultural nights.',
              'Participants are usually 13–30, but each project sets its own range — check the call.',
            ],
          },
          {
            h: '1. Find a project that fits',
            p: [
              'On Openly, pick the “Youth exchange” type and check that Azerbaijan is among the participating countries. If the dates, age range and topic work for you, save it — we will remind you of the deadline.',
            ],
          },
          {
            h: '2. Contact the sending organisation',
            p: [
              'You usually join an exchange through a partner (sending) organisation in Azerbaijan, not on your own. If the call names one, write to them; if not, ask the organisers who their Azerbaijani partner is.',
            ],
          },
          {
            h: '3. Fill in the application form',
            p: [
              'Often a short online form: about you, your English level, your interest in the topic and why you want to take part. Be specific: what you have done, what you want to learn, what you will share when you are back.',
            ],
          },
          {
            h: '4. If you are selected',
            p: [
              'Organisers usually send an info pack about travel, visas, insurance and the programme. Agree on your tickets with them before buying: travel is usually reimbursed after the project, up to a limit based on distance.',
              'Keep every ticket, boarding pass and receipt — without them your costs may not be reimbursed.',
            ],
          },
          {
            h: '5. When you are back',
            p: [
              'You can receive a Youthpass certificate that recognises what you learned — useful on your CV. Sharing the experience with your local community is often part of the project too.',
            ],
          },
        ],
      },
    },
  },
  {
    slug: 'motivation-letter',
    minutes: 3,
    kinds: ['youth_exchange', 'training', 'volunteering', 'seminar', 'online', 'other'],
    links: [{ label: 'Youthpass', href: 'https://www.youthpass.eu/' }],
    text: {
      az: {
        title: 'Seçiləcək motivasiya məktubu necə yazılır',
        summary: 'Komissiyalar yüzlərlə məktub oxuyur. Səninkinin yadda qalması üçün 5 sadə qayda.',
        sections: [
          {
            h: '1. Bu layihəyə yaz, hər layihəyə yox',
            p: ['Elanı diqqətlə oxu və məktubda layihənin mövzusunu, məqsədlərini adla. “Bu təcrübə mənim üçün çox vacibdir” kimi hər yerə uyğun cümlələr heç nə demir.'],
          },
          {
            h: '2. Hekayə danış, siyahı yox',
            p: ['Bir konkret təcrübə seç: harada, nə etdin, nə dəyişdi. “Ekologiyaya maraqlıyam” əvəzinə “Keçən yaz məktəbimizdə 40 nəfərlə ağacəkmə aksiyası təşkil etdim” yaz.'],
          },
          {
            h: '3. Nə verəcəyini de',
            p: ['Komissiya yalnız nə alacağını yox, qrupa nə qatacağını da bilmək istəyir: bacarığın, fikirlərin, təcrübən. Mədəni gecədə nə təqdim edə biləcəyini də yaza bilərsən.'],
          },
          {
            h: '4. Sonra nə olacaq?',
            p: ['Öyrəndiklərini geri qayıdanda necə istifadə edəcəyini göstər: öz icmanda seminar, təşkilatında yeni layihə, sosial mediada paylaşım.'],
          },
          {
            h: '5. Qısa və səmimi saxla',
            p: [
              '250–400 söz kifayətdir. Klişelərdən (“uşaqlıqdan arzum idi…”) qaç, sadə ingilis dilində yaz və göndərməzdən əvvəl kiməsə oxut.',
              'Premium-da AI köməkçi əvvəlcə sənə suallar verir və məktubun skeletini yalnız sənin cavablarından qurur — heç nə uydurmur.',
            ],
          },
        ],
      },
      en: {
        title: 'How to write a motivation letter that gets you selected',
        summary: 'Committees read hundreds of letters. Five simple rules to make yours stand out.',
        sections: [
          {
            h: '1. Write for this project, not any project',
            p: ['Read the call carefully and name the project’s topic and goals in your letter. Sentences that fit anywhere, like “this experience is very important to me”, say nothing.'],
          },
          {
            h: '2. Tell a story, not a list',
            p: ['Pick one concrete experience: where, what you did, what changed. Instead of “I am interested in the environment”, write “Last spring I organised a tree-planting day at my school with 40 people.”'],
          },
          {
            h: '3. Say what you will bring',
            p: ['Committees want to know what you will add to the group, not only what you will get: your skills, ideas and experience. You can mention what you could present on the cultural night too.'],
          },
          {
            h: '4. What happens afterwards?',
            p: ['Show how you will use what you learn when you are back: a workshop in your community, a new project at your organisation, sharing on social media.'],
          },
          {
            h: '5. Keep it short and honest',
            p: [
              '250–400 words is enough. Avoid clichés (“it has been my dream since childhood…”), write in plain English and have someone read it before you send it.',
              'With Premium, the AI assistant first asks you questions and builds a draft only from your answers — it never makes things up.',
            ],
          },
        ],
      },
    },
  },
  {
    slug: 'sending-organisation',
    minutes: 3,
    kinds: ['youth_exchange', 'volunteering'],
    links: [
      { label: 'SALTO OTLAS', href: 'https://www.salto-youth.net/tools/otlas-partner-finding/' },
      { label: 'European Solidarity Corps', href: 'https://youth.europa.eu/solidarity_en' },
    ],
    text: {
      az: {
        title: 'Göndərən təşkilat nədir və necə tapılır',
        summary: 'Erasmus+ və ESC layihələrinin çoxuna birbaşa yox, təşkilat vasitəsilə qatılırsan. Bunun necə işlədiyini izah edirik.',
        sections: [
          {
            h: 'Göndərən təşkilat nə edir?',
            p: [
              'Layihəni bir ölkədəki ev sahibi (host) təşkilat keçirir, hər iştirakçı ölkədən isə partnyor — göndərən (sending) təşkilat iştirakçıları seçir və hazırlayır. O, adətən müraciətləri toplayır, sənədlərdə kömək edir və səfərdən əvvəl hazırlıq görüşü keçirir.',
            ],
          },
          {
            h: 'Harada tapım?',
            p: [
              'Əvvəlcə elana bax — Openly-də göndərən təşkilat göstərilibsə, fürsət səhifəsində adı və əlaqəsi var. Yoxdursa, layihə təşkilatçısına yazıb Azərbaycandakı partnyorlarını soruş.',
              'SALTO-nun OTLAS bazasında gənclər sahəsində işləyən təşkilatları ölkəyə görə axtarmaq olar. Yerli gənclər QHT-ləri də tez-tez partnyor olur.',
            ],
          },
          {
            h: 'Onlara necə yazım?',
            p: [
              'Qısa və konkret: hansı layihə (link), özün haqqında 2–3 cümlə, niyə maraqlıdır, və əlaqə məlumatın. Cavab gəlməsə, bir neçə gündən sonra nəzakətlə xatırlat.',
            ],
          },
          {
            h: 'Pul istəsələr?',
            p: [
              'Bəzi təşkilatlar üzvlük və ya iştirak haqqı istəyə bilər — bu, layihəyə görə dəyişir. Nəyin qarşılandığını və nəyi özün ödəyəcəyini əvvəlcədən yazılı soruş. Şübhəli görünən halda ev sahibi təşkilatdan da təsdiq al.',
            ],
          },
        ],
      },
      en: {
        title: 'What a sending organisation is and how to find one',
        summary: 'You join most Erasmus+ and ESC projects through an organisation, not on your own. Here is how that works.',
        sections: [
          {
            h: 'What does a sending organisation do?',
            p: [
              'A host organisation runs the project in one country, and a partner — the sending organisation — in each participating country selects and prepares participants. It usually collects applications, helps with documents and runs a preparation meeting before the trip.',
            ],
          },
          {
            h: 'Where do I find one?',
            p: [
              'Check the call first — if Openly lists a sending organisation, its name and contact are on the opportunity page. If not, write to the organisers and ask who their Azerbaijani partner is.',
              'SALTO’s OTLAS database lets you search youth organisations by country. Local youth NGOs are often partners too.',
            ],
          },
          {
            h: 'How do I write to them?',
            p: ['Keep it short and specific: which project (link), 2–3 sentences about you, why it interests you, and your contact details. If there is no reply, send a polite reminder a few days later.'],
          },
          {
            h: 'What if they ask for money?',
            p: [
              'Some organisations ask for a membership or participation fee — it depends on the project. Ask in writing what is covered and what you pay yourself. If something looks wrong, confirm with the host organisation.',
            ],
          },
        ],
      },
    },
  },
  {
    slug: 'visa-documents',
    minutes: 3,
    kinds: ['youth_exchange', 'training', 'volunteering', 'seminar'],
    links: [{ label: 'EU visa policy', href: 'https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en' }],
    text: {
      az: {
        title: 'Viza və sənədlər: səfərə necə hazırlaşmalı',
        summary: 'Qəbul olundun? Şengen vizası üçün adətən lazım olan sənədlər və vaxtlama.',
        sections: [
          {
            h: 'Nə vaxt başlamalı?',
            p: [
              'Qəbul məktubunu alan kimi. Viza müraciətinə baxılması adətən bir neçə həftə çəkir, yay aylarında növbə daha uzun olur. Səfirliyin və ya viza mərkəzinin saytında görüş vaxtını dərhal yoxla.',
            ],
          },
          {
            h: 'Adətən lazım olan sənədlər',
            p: [
              'Pasport (səfərdən sonra da ən azı bir neçə ay etibarlı, boş səhifələri olan), doldurulmuş viza forması və foto, ev sahibi təşkilatın dəvət məktubu (layihə, tarixlər, xərclərin kim tərəfindən qarşılandığı), tibbi səyahət sığortası, bilet rezervasiyası.',
              'Dəqiq siyahı ölkəyə görə dəyişir — getdiyin ölkənin səfirliyinin saytındakı rəsmi siyahını əsas götür.',
            ],
          },
          {
            h: 'Rüsum',
            p: [
              'AB ilə Azərbaycan arasında viza asanlaşdırma sazişi var; bəzi kateqoriyalar üçün rüsum azaldılır və ya ləğv olunur. Mübadilə proqramı iştirakçısı kimi hansı şərtlərin sənə aid olduğunu səfirlikdən soruş.',
            ],
          },
          {
            h: 'Kiçik məsləhətlər',
            p: [
              'Təşkilatçılardan dəvət məktubunu vaxtında istə və adının pasportdakı kimi yazıldığını yoxla. Bütün sənədlərin nüsxəsini telefonunda da saxla.',
            ],
          },
        ],
      },
      en: {
        title: 'Visas and documents: getting ready to travel',
        summary: 'Selected? The documents a Schengen visa usually needs, and when to start.',
        sections: [
          {
            h: 'When should I start?',
            p: [
              'As soon as you get your acceptance letter. Visa processing usually takes a few weeks, and queues are longer in summer. Check appointment slots on the embassy or visa centre website right away.',
            ],
          },
          {
            h: 'Documents you usually need',
            p: [
              'A passport (valid for at least a few months after the trip, with blank pages), the visa form and a photo, an invitation letter from the host organisation (project, dates, who covers the costs), travel medical insurance, and a ticket reservation.',
              'The exact list depends on the country — go by the official list on the website of the embassy of the country you are travelling to.',
            ],
          },
          {
            h: 'Fees',
            p: [
              'The EU and Azerbaijan have a visa facilitation agreement that lowers or waives the fee for some categories. Ask the embassy which rules apply to you as an exchange participant.',
            ],
          },
          {
            h: 'Small tips',
            p: ['Ask the organisers for the invitation letter early and check that your name is spelled exactly as in your passport. Keep copies of all documents on your phone too.'],
          },
        ],
      },
    },
  },
  {
    // Linked from the install banner on the landing page (iPhone has no install button).
    slug: 'install-app',
    minutes: 1,
    kinds: [],
    links: [{ label: 'Google Chrome: Use progressive web apps', href: 'https://support.google.com/chrome/answer/9658361' }],
    text: {
      az: {
        title: 'Openly-ni telefonuna necə yükləmək olar',
        summary: 'Openly-ni App Store və ya Play Market olmadan, bir dəqiqəyə ana ekranına əlavə et: tətbiq kimi açılır, son tarixlər həmişə əlinin altında olur.',
        sections: [
          {
            h: 'iPhone və iPad (Safari)',
            p: [
              'iPhone-da menyular telefonun dilində olur. Aşağıda adlar türkcə və ingiliscə verilib.',
              '1. openlyapply.com saytını Safari-də aç və aşağı sağdakı «•••» düyməsinə toxun.',
              '2. Açılan menyuda «Paylaş» (Share) seç.',
              '3. Paylaşma pəncərəsində «Daha Fazla» (More) düyməsinə toxun.',
              '4. Siyahıdan «Ana Ekrana Ekle» (Add to Home Screen) seç, sonra sağ yuxarıda «Ekle» (Add) düyməsinə toxun. Openly ikonu ana ekranında görünəcək — oradan aç.',
              'Köhnə iOS versiyalarında «Paylaş» düyməsi birbaşa ekranın aşağısında olur (yuxarı oxu olan kvadrat). Ona toxun və 4-cü addıma keç.',
            ],
            images: [
              { src: '/guides/ios-step-1.webp', alt: '1. Aşağı sağdakı «•••» düyməsi' },
              { src: '/guides/ios-step-2.webp', alt: '2. «Paylaş» (Share)' },
              { src: '/guides/ios-step-3.webp', alt: '3. «Daha Fazla» (More)' },
              { src: '/guides/ios-step-4.webp', alt: '4. «Ana Ekrana Ekle» (Add to Home Screen)' },
            ],
          },
          {
            h: 'Android',
            p: [
              'Saytı Chrome-da açanda yuxarıda çıxan bildirişdə «Yüklə» düyməsinə toxun və təsdiqlə.',
              'Bildiriş görünmürsə: Chrome-un sağ yuxarısındakı «⋮» menyusunu aç və «Tətbiqi quraşdır» və ya «Ana ekrana əlavə et» seç.',
            ],
          },
          {
            h: 'Kompüter (Chrome, Edge)',
            p: [
              'Ünvan sətrinin sağındakı quraşdırma ikonuna klik et və ya brauzer menyusundan «Openly-ni quraşdır» seç. Openly ayrıca pəncərədə açılacaq və ondan masaüstündən istifadə edə biləcəksən.',
            ],
          },
          {
            h: 'Silmək istəsən',
            p: ['Hər hansı tətbiq kimi: ikonu basıb saxla və «Sil» seç. Hesabın və məlumatların itmir, sayt brauzerdə də işləməyə davam edir.'],
          },
        ],
      },
      en: {
        title: 'How to install Openly on your phone',
        summary: 'Add Openly to your home screen in a minute, no App Store or Play Store needed: it opens like an app and keeps deadlines at hand.',
        sections: [
          {
            h: 'iPhone and iPad (Safari)',
            p: [
              'iPhone menus follow the phone’s language; the screenshots below are in Turkish, with the English names given.',
              '1. Open openlyapply.com in Safari and tap the “•••” button at the bottom right.',
              '2. In the menu, choose “Share” (Paylaş).',
              '3. In the share sheet, tap “More” (Daha Fazla).',
              '4. Choose “Add to Home Screen” (Ana Ekrana Ekle), then tap “Add” in the top right. The Openly icon appears on your home screen — open it from there.',
              'On older iOS versions the Share button (a square with an arrow pointing up) sits right at the bottom of the screen: tap it and go to step 4.',
            ],
            images: [
              { src: '/guides/ios-step-1.webp', alt: '1. The “•••” button at the bottom right' },
              { src: '/guides/ios-step-2.webp', alt: '2. “Share” (Paylaş)' },
              { src: '/guides/ios-step-3.webp', alt: '3. “More” (Daha Fazla)' },
              { src: '/guides/ios-step-4.webp', alt: '4. “Add to Home Screen” (Ana Ekrana Ekle)' },
            ],
          },
          {
            h: 'Android',
            p: [
              'When you open the site in Chrome, tap “Install” in the banner at the top and confirm.',
              'No banner? Open Chrome’s “⋮” menu in the top right and choose “Install app” or “Add to Home screen”.',
            ],
          },
          {
            h: 'Computer (Chrome, Edge)',
            p: [
              'Click the install icon at the right of the address bar, or choose “Install Openly” from the browser menu. Openly opens in its own window and you can launch it from your desktop.',
            ],
          },
          {
            h: 'To remove it',
            p: ['Like any app: press and hold the icon and choose “Remove”. Your account and data stay, and the site keeps working in the browser.'],
          },
        ],
      },
    },
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
