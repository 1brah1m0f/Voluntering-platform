import type { Lang } from '../../i18n';

// Study-abroad roadmap for the Student section: four phases, counted back from
// the start of studies. Step ids are stored in profiles.roadmap when ticked.

export interface RoadmapStep {
  id: string;
  title: string;
  text: string;
}

export interface RoadmapPhase {
  when: string;
  title: string;
  steps: RoadmapStep[];
}

export const FIELDS: Record<string, Record<Lang, string>> = {
  cs: { az: 'Kompüter elmləri və İT', en: 'Computer science & IT' },
  engineering: { az: 'Mühəndislik', en: 'Engineering' },
  business: { az: 'Biznes və iqtisadiyyat', en: 'Business & economics' },
  medicine: { az: 'Tibb və səhiyyə', en: 'Medicine & health' },
  law: { az: 'Hüquq', en: 'Law' },
  social: { az: 'Sosial elmlər, beynəlxalq münasibətlər', en: 'Social sciences & IR' },
  science: { az: 'Təbiət elmləri', en: 'Natural sciences' },
  arts: { az: 'Memarlıq, dizayn, incəsənət', en: 'Architecture, design & arts' },
  humanities: { az: 'Humanitar elmlər', en: 'Humanities' },
  education: { az: 'Təhsil', en: 'Education' },
};

export const LEVELS: Record<string, Record<Lang, string>> = {
  bachelor: { az: 'Bakalavr', en: 'Bachelor' },
  master: { az: 'Magistr', en: 'Master' },
  phd: { az: 'Doktorantura', en: 'PhD' },
};

const AZ: RoadmapPhase[] = [
  {
    when: '18–12 ay əvvəl',
    title: 'İstiqaməti müəyyən et',
    steps: [
      { id: 'goal', title: 'Ölkəni və ixtisası seç', text: 'Nə oxumaq istədiyini, hansı dildə və hansı büdcə ilə oxuya biləcəyini yaz. Universitetlər bölməsində ixtisasa görə süz və 2–3 ölkə üzərində dayan.' },
      { id: 'language', title: 'Dil imtahanına hazırlaş', text: 'Əksər ingilisdilli proqramlar IELTS 6.0–7.0 və ya TOEFL iBT 80–100 istəyir. İmtahanı müraciətdən ən azı 2–3 ay əvvəl ver ki, lazım gəlsə təkrar edə biləsən.' },
      { id: 'tests', title: 'Lazım olan standart imtahanları öyrən', text: 'Bakalavr üçün bəzi universitetlər SAT/ACT və ya öz testini (məs. YÖS) istəyir; magistr üçün bəzən GRE/GMAT. Hər universitetin tələbini qeyd et.' },
      { id: 'budget', title: 'Büdcəni hesabla', text: 'İllik xərc = təhsil haqqı + yaşayış + müraciət haqları + viza + bilet. Planlayıcıda universitetlərin təxmini xərcini müqayisə et.' },
    ],
  },
  {
    when: '12–9 ay əvvəl',
    title: 'Siyahı və sənədlər',
    steps: [
      { id: 'shortlist', title: '5–8 universitetlik siyahı qur', text: 'Bir neçə “xəyal”, bir neçə “uyğun” və ən azı bir “etibarlı” seçim olsun. Hər birinin son tarixini və müraciət haqqını qeyd et.' },
      { id: 'scholarships', title: 'Təqaüdlərin son tarixlərini yaz', text: 'Təqaüdlərin çoxu universitetə qəbuldan əvvəl bağlanır (məs. Chevening oktyabrda, Stipendium Hungaricum yanvarda). Təqvimini buna görə qur.' },
      { id: 'documents', title: 'Sənədləri hazırla', text: 'Attestat/diplom, qiymət cədvəli (transkript), pasport. Çox ölkə notarial tərcümə və apostil istəyir — bunlar vaxt aparır, erkən başla.' },
      { id: 'references', title: 'Tövsiyə məktublarını istə', text: 'Səni yaxşı tanıyan 2–3 müəllim və ya rəhbərə 1–2 ay əvvəldən yaz; onlara CV-ni və proqram haqqında qısa məlumat göndər.' },
    ],
  },
  {
    when: '9–6 ay əvvəl',
    title: 'Müraciət',
    steps: [
      { id: 'essay', title: 'Motivasiya məktubunu yaz', text: 'Hər universitet üçün uyğunlaşdır: niyə bu proqram, nə etmisən, gələcək planın. Bələdçilərdəki məktub qaydalarına bax.' },
      { id: 'cv', title: 'Akademik CV hazırla', text: 'Təhsil, layihələr, könüllülük, mükafatlar, dillər. Europass formatı Avropa üçün rahatdır.' },
      { id: 'submit', title: 'Müraciətləri göndər', text: 'Hər portalda (UCAS, uni-assist, DreamApply, universitetin öz sistemi) sənədləri yüklə və müraciət haqqını ödə. Qəbzləri saxla.' },
      { id: 'interview', title: 'Müsahibəyə hazırlaş', text: 'Bəzi universitetlər və təqaüdlər müsahibə keçirir. Motivasiyanı və planlarını qısa, konkret danışmağı məşq et.' },
    ],
  },
  {
    when: '6–0 ay əvvəl',
    title: 'Qəbul və yola düşmə',
    steps: [
      { id: 'decide', title: 'Təklifləri müqayisə et və qərar ver', text: 'Xərc, təqaüd, proqramın keyfiyyəti və şəhəri müqayisə et. Qəbulu təsdiqlə, lazım olsa depozit ödə.' },
      { id: 'visa', title: 'Vizaya müraciət et', text: 'Adətən qəbul məktubu, maliyyə sübutu (bank çıxarışı və ya təqaüd məktubu), sığorta və yaşayış məlumatı lazımdır. Görüş vaxtını erkən götür.' },
      { id: 'housing', title: 'Yaşayış yeri tap', text: 'Yataqxana yerləri tez bitir — universitetin yataqxana müraciətini qəbul məktubundan dərhal sonra et.' },
      { id: 'arrival', title: 'Bilet və gəliş', text: 'Oriyentasiya həftəsinə vaxtında çat. Sənədlərin əsli və nüsxələrini, sığortanı və ilk ay üçün pulu yanında saxla.' },
    ],
  },
];

const EN: RoadmapPhase[] = [
  {
    when: '18–12 months before',
    title: 'Set your direction',
    steps: [
      { id: 'goal', title: 'Choose a country and a field', text: 'Write down what you want to study, in which language, and on what budget. Filter the universities by field and narrow down to 2–3 countries.' },
      { id: 'language', title: 'Prepare for a language test', text: 'Most English-taught programmes ask for IELTS 6.0–7.0 or TOEFL iBT 80–100. Take the test at least 2–3 months before applying so you can retake it if needed.' },
      { id: 'tests', title: 'Check which standardised tests you need', text: 'Some universities want SAT/ACT or their own test (e.g. YÖS) for bachelor’s; some master’s programmes want GRE/GMAT. Note each university’s requirement.' },
      { id: 'budget', title: 'Work out your budget', text: 'Yearly cost = tuition + living + application fees + visa + flights. Compare estimated costs in the Planner.' },
    ],
  },
  {
    when: '12–9 months before',
    title: 'Shortlist and documents',
    steps: [
      { id: 'shortlist', title: 'Build a shortlist of 5–8 universities', text: 'Include a few reach, a few match and at least one safe choice. Note each deadline and application fee.' },
      { id: 'scholarships', title: 'Write down scholarship deadlines', text: 'Many scholarships close before university admission (e.g. Chevening in October, Stipendium Hungaricum in January). Plan your calendar around them.' },
      { id: 'documents', title: 'Prepare your documents', text: 'School certificate/diploma, transcript, passport. Many countries want notarised translations and an apostille — these take time, start early.' },
      { id: 'references', title: 'Ask for recommendation letters', text: 'Write to 2–3 teachers or supervisors who know you well, 1–2 months ahead; send them your CV and a short note about the programme.' },
    ],
  },
  {
    when: '9–6 months before',
    title: 'Apply',
    steps: [
      { id: 'essay', title: 'Write your motivation letter', text: 'Tailor it to each university: why this programme, what you have done, your plans. See the letter rules in our guides.' },
      { id: 'cv', title: 'Prepare an academic CV', text: 'Education, projects, volunteering, awards, languages. The Europass format works well for Europe.' },
      { id: 'submit', title: 'Submit your applications', text: 'Upload documents on each portal (UCAS, uni-assist, DreamApply, the university’s own system) and pay the fee. Keep the receipts.' },
      { id: 'interview', title: 'Prepare for interviews', text: 'Some universities and scholarships interview candidates. Practise explaining your motivation and plans briefly and concretely.' },
    ],
  },
  {
    when: '6–0 months before',
    title: 'Admission and departure',
    steps: [
      { id: 'decide', title: 'Compare offers and decide', text: 'Compare cost, scholarships, programme quality and the city. Accept your place and pay a deposit if required.' },
      { id: 'visa', title: 'Apply for your visa', text: 'You usually need the admission letter, proof of funds (bank statement or scholarship letter), insurance and accommodation details. Book the appointment early.' },
      { id: 'housing', title: 'Find accommodation', text: 'Dorm places go fast — apply for university housing right after you get your admission letter.' },
      { id: 'arrival', title: 'Flights and arrival', text: 'Arrive in time for orientation week. Keep originals and copies of your documents, your insurance and money for the first month with you.' },
    ],
  },
];

export const ROADMAP: Record<Lang, RoadmapPhase[]> = { az: AZ, en: EN };

export type StudentTab = 'roadmap' | 'scholarships' | 'universities' | 'plan';

/** Where a step's "Open" link goes: a tab of the Student page, or another page. */
export const STEP_LINKS: Record<string, { tab: StudentTab } | { to: string }> = {
  goal: { tab: 'universities' },
  budget: { tab: 'plan' },
  shortlist: { tab: 'universities' },
  scholarships: { tab: 'scholarships' },
  essay: { to: '/guides/motivation-letter' },
  submit: { tab: 'plan' },
  decide: { tab: 'universities' },
  visa: { to: '/guides/visa-documents' },
};
export const ROADMAP_STEP_COUNT = AZ.reduce((n, p) => n + p.steps.length, 0);
