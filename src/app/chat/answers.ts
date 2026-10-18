export type ChatLang = 'az' | 'en';
type Entry = {
  id: string;
  keywords: string[];
  question: Record<ChatLang, string>;
  answer: Record<ChatLang, string>;
  link?: { to: string; label: Record<ChatLang, string> };
};

// Curated platform help only: no model, network calls or daily AI quota usage.
export const answers: Entry[] = [
  {
    id: 'start', keywords: ['baslamaq', 'baslayim', 'baslama', 'start', 'begin', 'istifade', 'isleyir'],
    question: { az: 'Haradan başlayım?', en: 'How do I get started?' },
    answer: { az: 'Əvvəlcə profilində maraqlarını və təcrübəni tamamla. Sonra Fürsətlər bölməsində ölkə, proqram və son tarix filtrlərindən istifadə et. Uyğun elanı aç, tələbləri oxu və izləmək üçün yadda saxla.', en: 'Complete your interests and experience in your profile. Then browse Opportunities using the country, programme and deadline filters. Open a suitable listing, read its requirements and save it to track your preparation.' },
    link: { to: '/app', label: { az: 'Fürsətlərə bax', en: 'Browse opportunities' } },
  },
  {
    id: 'apply', keywords: ['muraciet', 'apply', 'application', 'qeydiyyat', 'register'],
    question: { az: 'Necə müraciət edim?', en: 'How do I apply?' },
    answer: { az: 'Elanın tələblərini, uyğunluq şərtlərini və son tarixini yoxla. Lazım olan sənədləri hazırla və elandakı rəsmi keçiddən müraciət et. Openly müraciəti sənin yerinə göndərmir. Göndərdikdən sonra Müraciətlərim bölməsində statusu yenilə.', en: 'Check the listing’s requirements, eligibility and deadline. Prepare the requested documents and apply through its official link. Openly does not submit applications for you. After submitting, update the status in My applications.' },
    link: { to: '/app/tracker', label: { az: 'Müraciətlərim', en: 'My applications' } },
  },
  {
    id: 'letter', keywords: ['motivasiya', 'motivation', 'letter', 'mektub', 'esse', 'essay'],
    question: { az: 'Motivasiya məktubunu necə yazım?', en: 'How do I write a motivation letter?' },
    answer: { az: 'Məktubda 4 hissə saxla: kim olduğun, məhz bu layihəni niyə seçdiyin, real təcrübəndən konkret nümunə və layihəyə necə töhfə verəcəyin. Elanın məqsədinə uyğun yaz, ümumi ifadələrdən uzaq dur. Fərdi qaralama üçün saxladığın fürsətin “Motivasiya məktubu” alətini aça bilərsən; bu alət gündəlik AI limitindən istifadə edir.', en: 'Use four parts: who you are, why you chose this project, a concrete example from your real experience, and how you will contribute. Connect your letter to the project’s goals. For a personalised draft, open the Motivation letter tool on a saved opportunity; that tool uses your daily AI allowance.' },
  },
  {
    id: 'cv', keywords: ['cv', 'resume', 'rezume', 'europass'],
    question: { az: 'CV-də nələr olmalıdır?', en: 'What should my CV include?' },
    answer: { az: 'Əlaqə məlumatların, təhsilin, iş və könüllülük təcrübən, dil biliklərin və uyğun bacarıqlarını əlavə et. Hər təcrübə üçün nə etdiyini və nəticəni qısa yaz. Elandakı format və dil tələbinə əməl et; Europass yalnız tələb olunursa vacibdir. Təcrübə və sertifikat uydurma.', en: 'Include contact details, education, work and volunteering experience, languages and relevant skills. Briefly describe your actions and results for each experience. Follow the listing’s format and language requirements; Europass is essential only when requested. Never invent experience or certificates.' },
  },
  {
    id: 'costs', keywords: ['odenis', 'pulsuz', 'qiymet', 'limit', 'token', 'free', 'price', 'cost', 'quota', 'paid'],
    question: { az: 'Pulsuzdur? AI limiti nə qədərdir?', en: 'Is it free? What is the AI limit?' },
    answer: { az: 'Openly-nin bütün imkanları pulsuzdur. Bu hazır cavablı çat gündəlik AI limitini azaltmır. Məktub qaralaması, yoxlanış və digər generativ AI alətləri üçün gündə ümumilikdə 10 istifadə var. Layihənin öz yol, viza və iştirak xərclərini isə ayrıca elandan yoxla.', en: 'All Openly features are free. This template-based chat does not reduce your daily AI allowance. Drafts, reviews and other generative AI tools share 10 uses per day. Check each listing separately for the project’s travel, visa and participation costs.' },
  },
  {
    id: 'funding', keywords: ['xercler', 'xerc', 'maliyye', 'funding', 'funded', 'reimbursement', 'travel', 'yol', 'qarsilanir'],
    question: { az: 'Layihənin xərcləri qarşılanır?', en: 'Are project expenses covered?' },
    answer: { az: 'Bu, layihədən asılıdır. Elandakı “Xərclər” hissəsinə bax: yol, yaşayış, yemək və mümkün iştirak haqqını ayrı-ayrı yoxla. Yol xərcinin limiti və geri ödəniş vaxtı ola bilər. Bilet almamışdan əvvəl təşkilatçının təsdiqini və rəsmi şərtləri oxu.', en: 'It depends on the project. Check the listing’s costs section separately for travel, accommodation, meals and any participation fee. Travel reimbursement may have a cap and a payment schedule. Read the official terms and get organiser confirmation before buying tickets.' },
  },
  {
    id: 'erasmus', keywords: ['erasmus', 'mubadile', 'exchange', 'salto'],
    question: { az: 'Erasmus+ fürsətini necə tapım?', en: 'How do I find Erasmus+ opportunities?' },
    answer: { az: 'Fürsətlər bölməsində proqram filtrindən Erasmus+ seç. Gənclər mübadiləsi və təlimlər üçün elanın yaş, ölkə və iştirakçı profili tələblərini oxu. Elan göndərən tərəfdaş təşkilat tələb edirsə, göstərilən təşkilatın müraciət qaydasına əməl et.', en: 'Select Erasmus+ in the programme filter under Opportunities. For youth exchanges and training courses, check the age, country and participant requirements. If the listing requires a sending partner organisation, follow that organisation’s application instructions.' },
    link: { to: '/app', label: { az: 'Fürsət axtar', en: 'Find opportunities' } },
  },
  {
    id: 'esc', keywords: ['esc', 'solidarity', 'hemreylik', 'corps'],
    question: { az: 'ESC nədir?', en: 'What is ESC?' },
    answer: { az: 'ESC — Avropa Həmrəylik Korpusu proqramıdır. Fürsətlər bölməsində ESC proqramını seçərək könüllülük elanlarını tapa bilərsən. Hər elanın ölkə, yaş, müddət və xərclər barədə şərtlərini ayrıca oxu; uyğunluğu rəsmi mənbədə təsdiqlə.', en: 'ESC stands for the European Solidarity Corps. Select ESC under Opportunities to find volunteering listings. Read each listing’s country, age, duration and funding conditions separately and confirm eligibility at the official source.' },
    link: { to: '/app', label: { az: 'Fürsətlərə bax', en: 'Browse opportunities' } },
  },
  {
    id: 'tracking', keywords: ['saxla', 'saxlamaq', 'saxladigim', 'izle', 'izlemek', 'save', 'saved', 'track', 'status', 'deadline', 'xatirlatma'],
    question: { az: 'Müraciətlərimi necə izləyim?', en: 'How do I track applications?' },
    answer: { az: 'Fürsəti yadda saxla və Müraciətlərim bölməsinə keç. Hazırlıq siyahını və qeydlərini orada idarə et, müraciət etdikdə statusu dəyiş. E-poçt xülasəsi və son tarix xatırlatmalarını Profil → Parametrlər bölməsindən idarə edə bilərsən.', en: 'Save an opportunity and open My applications. Manage your preparation checklist and notes there, then change the status when you apply. Manage email digests and deadline reminders in Profile → Settings.' },
    link: { to: '/app/tracker', label: { az: 'Müraciətlərimi aç', en: 'Open my applications' } },
  },
  {
    id: 'profile', keywords: ['profil', 'profile', 'about', 'haqqimda', 'maraqlar', 'interests', 'password', 'sifre'],
    question: { az: 'Profilimi necə tamamlayım?', en: 'How do I complete my profile?' },
    answer: { az: 'Profil bölməsində adını, maraqlarını, dil biliklərini və təcrübəni doldur. “Haqqımda” hissəsində təhsilini, bacarıqlarını və hədəflərini konkret yaz. Bu məlumatlar uyğun fürsətləri tapmağa və fərdi AI alətlərinin daha uyğun cavab verməsinə kömək edir.', en: 'Fill in your name, interests, languages and experience under Profile. In About me, describe your education, skills and goals clearly. This helps match opportunities and gives the personalised AI tools useful context.' },
    link: { to: '/app/profile', label: { az: 'Profili aç', en: 'Open profile' } },
  },
];

export function normalizeQuestion(text: string): string {
  return text.toLocaleLowerCase('az').replace(/ı/g, 'i').replace(/ə/g, 'e')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function findAnswer(question: string): Entry | undefined {
  const tokens = new Set(normalizeQuestion(question).split(' '));
  let best: Entry | undefined;
  let bestScore = 0;
  for (const entry of answers) {
    const score = [...new Set(entry.keywords)].reduce((sum, keyword) => {
      const matched = tokens.has(keyword) || (keyword.length >= 4 && [...tokens].some(token => token.startsWith(keyword)));
      return sum + Number(matched);
    }, 0);
    if (score > bestScore) { best = entry; bestScore = score; }
  }
  return best;
}

export function answerById(id: string): Entry | undefined {
  return answers.find(entry => entry.id === id);
}
