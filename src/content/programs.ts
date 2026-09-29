import type { Lang } from '../i18n';

// Programme hub pages (/programs/:slug): what the programme is, who it is for,
// and its open opportunities. `name` must match Opportunity.program.

export interface ProgramPage {
  slug: string;
  name: string;
  href: string;
  /** Tailwind gradient for the page header. */
  tone: string;
  text: Record<Lang, { tagline: string; about: string; who: string; costs: string }>;
}

export const PROGRAM_PAGES: ProgramPage[] = [
  {
    slug: 'erasmus-plus',
    name: 'Erasmus+',
    href: 'https://erasmus-plus.ec.europa.eu/',
    tone: 'from-blue-700 via-blue-800 to-indigo-900',
    text: {
      az: {
        tagline: 'Avropa İttifaqının təhsil, gənclər və idman proqramı',
        about: 'Gənclər sahəsində Erasmus+ əsasən gənclər mübadilələrini (5–21 gün) və gənclərlə işləyənlər üçün təlim və seminarları maliyyələşdirir. Azərbaycan qonşu tərəfdaş ölkə kimi bir çox gənclər layihəsində iştirak edə bilər.',
        who: 'Mübadilələr adətən 13–30 yaş üçündür; təlimlər gənclər işçiləri, könüllülər və gənc liderlər üçün.',
        costs: 'Yaşayış və yemək adətən qarşılanır, yol xərci məsafəyə görə limit daxilində qaytarılır.',
      },
      en: {
        tagline: 'The EU programme for education, youth and sport',
        about: 'In the youth field, Erasmus+ mainly funds youth exchanges (5–21 days) and training courses and seminars for youth workers. As a neighbouring partner country, Azerbaijan can take part in many youth projects.',
        who: 'Exchanges are usually for ages 13–30; training courses are for youth workers, volunteers and young leaders.',
        costs: 'Accommodation and food are usually covered; travel is reimbursed up to a limit based on distance.',
      },
    },
  },
  {
    slug: 'european-solidarity-corps',
    name: 'European Solidarity Corps',
    href: 'https://youth.europa.eu/solidarity_en',
    tone: 'from-fuchsia-700 via-pink-700 to-rose-800',
    text: {
      az: {
        tagline: 'Avropa Həmrəylik Korpusu — xaricdə könüllülük',
        about: 'ESC gənclərə başqa ölkədə bir təşkilatda qısa (2 həftə – 2 ay) və ya uzunmüddətli (2–12 ay) könüllü olmaq imkanı verir: gənclər mərkəzləri, ekologiya, sosial xidmət, mədəniyyət layihələri.',
        who: '18–30 yaş. Avropa Gənclər Portalında qeydiyyatdan keçmək lazımdır.',
        costs: 'Yaşayış, yemək, yerli nəqliyyat, sığorta və aylıq cib pulu verilir, yol xərci qarşılanır.',
      },
      en: {
        tagline: 'European Solidarity Corps — volunteering abroad',
        about: 'ESC lets young people volunteer with an organisation in another country, short term (2 weeks – 2 months) or long term (2–12 months): youth centres, environment, social work, culture.',
        who: 'Ages 18–30. You need to register on the European Youth Portal.',
        costs: 'Accommodation, food, local transport, insurance and monthly pocket money are provided; travel is covered.',
      },
    },
  },
  {
    slug: 'salto-youth',
    name: 'SALTO-Youth',
    href: 'https://www.salto-youth.net/',
    tone: 'from-teal-700 via-brand-800 to-brand-950',
    text: {
      az: {
        tagline: 'Gənclər işi üçün Avropa resurs mərkəzləri şəbəkəsi',
        about: 'SALTO-Youth Avropa Təlim Təqvimində (European Training Calendar) gənclər işçiləri və liderlər üçün təlim kursları, seminarlar və tərəfdaş axtarışı görüşləri dərc edir. Azərbaycan üçün ən faydalı mənbələrdən biri SALTO Şərqi Avropa və Qafqaz mərkəzidir.',
        who: 'Əsasən gənclər işçiləri, təlimçilər, könüllülər və gənclər təşkilatlarının əməkdaşları.',
        costs: 'Çox vaxt iştirak pulsuzdur; xərclər adətən göndərən Milli Agentlik və ya təşkilatçı tərəfindən qarşılanır — hər elanda yoxla.',
      },
      en: {
        tagline: 'A network of European resource centres for youth work',
        about: 'SALTO-Youth publishes training courses, seminars and partnership-building activities for youth workers and leaders in the European Training Calendar. For Azerbaijan, the SALTO Eastern Europe and Caucasus centre is one of the most useful sources.',
        who: 'Mainly youth workers, trainers, volunteers and staff of youth organisations.',
        costs: 'Participation is often free; costs are usually covered by the sending National Agency or the organisers — check each call.',
      },
    },
  },
  {
    slug: 'un-volunteers',
    name: 'UN Volunteers',
    href: 'https://www.unv.org/',
    tone: 'from-sky-600 via-sky-700 to-blue-900',
    text: {
      az: {
        tagline: 'BMT Könüllüləri — onlayn və sahədə könüllülük',
        about: 'BMT Könüllüləri proqramı BMT təşkilatları üçün könüllülər cəlb edir. Onlayn könüllülükdə evdən BMT və digər təşkilatların layihələrinə kömək edə bilərsən: tərcümə, dizayn, araşdırma, mentorluq.',
        who: 'Onlayn könüllülük 18 yaşdan yuxarı hər kəs üçündür; sahə tapşırıqlarının öz tələbləri var.',
        costs: 'Onlayn könüllülük ödənişsizdir; sahə tapşırıqlarında müavinət və xərclər proqram tərəfindən qarşılanır.',
      },
      en: {
        tagline: 'UN Volunteers — online and on-site volunteering',
        about: 'The UN Volunteers programme mobilises volunteers for UN entities. Through online volunteering you can help UN and other organisations from home: translation, design, research, mentoring.',
        who: 'Online volunteering is open to anyone over 18; on-site assignments have their own requirements.',
        costs: 'Online volunteering is unpaid; on-site assignments come with allowances and costs covered by the programme.',
      },
    },
  },
];

export const programPageBySlug = (slug: string) => PROGRAM_PAGES.find((p) => p.slug === slug);
export const programPageByName = (name: string) => PROGRAM_PAGES.find((p) => p.name === name);
