import type { Lang } from '../i18n';

// Short, practical guides (the "Bələdçilər" pages). Rules change between calls,
// so the text stays general and every guide points to the official source.

export interface GuideSection {
  h: string;
  p: string[];
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
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
