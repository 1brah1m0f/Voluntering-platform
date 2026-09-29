// Demo-mode sample of the Student section (a few real rows from supabase/seed-student.sql).
// The full catalogue lives only in the database, readable by Student-plan users.
import type { Scholarship, University } from '../types';

export const DEMO_SCHOLARSHIPS: Omit<Scholarship, 'id'>[] = [
  {
    "sort": 10,
    "name": "Chevening",
    "provider": "Böyük Britaniya hökuməti (FCDO)",
    "country": "Böyük Britaniya",
    "levels": [
      "master"
    ],
    "fields": [],
    "coverage": "Tam təqaüd: təhsil haqqı, aylıq yaşayış müavinəti, gediş-dönüş biletləri, viza xərcləri.",
    "deadline": "2026-10-06",
    "deadline_note": "2027/28 tədris ili üçün: 6 oktyabr 2026, 11:00 UTC. Müraciət adətən avqustda açılır.",
    "eligibility": "Azərbaycan vətəndaşı; bakalavr dərəcəsi; ən azı 2 il iş təcrübəsi; təhsildən sonra ən azı 2 il Azərbaycana qayıtmaq öhdəliyi. Böyük Britaniyada 3 magistr proqramına müraciət etmək lazımdır.",
    "how_to_apply": "chevening.org-da onlayn forma: liderlik, şəbəkə qurma, “niyə UK” və karyera planı haqqında esselər, 2 tövsiyə. Seçilənlər Bakıda müsahibəyə çağırılır.",
    "url": "https://www.chevening.org/scholarship/azerbaijan/"
  },
  {
    "sort": 30,
    "name": "Stipendium Hungaricum",
    "provider": "Macarıstan hökuməti",
    "country": "Macarıstan",
    "levels": [
      "bachelor",
      "master",
      "phd"
    ],
    "fields": [],
    "coverage": "Pulsuz təhsil, aylıq təqaüd, yataqxana və ya yaşayış dəstəyi, tibbi sığorta.",
    "deadline": null,
    "deadline_note": "Adətən noyabrda açılır, yanvarın ortasında bağlanır (2026/27 dövrü: 15 yanvar 2026).",
    "eligibility": "Azərbaycan tərəfdaş ölkədir. Hər ölkə üçün icazə verilən səviyyə və sahələr ikitərəfli sazişlə müəyyən olunur; Azərbaycandakı göndərən tərəfin təsdiqi lazımdır.",
    "how_to_apply": "stipendiumhungaricum.hu portalında müraciət, 2 proqrama qədər seçim; sonra universitetin qəbul imtahanı/müsahibəsi.",
    "url": "https://stipendiumhungaricum.hu/country/azerbaijan/"
  },
  {
    "sort": 40,
    "name": "Türkiye Bursları",
    "provider": "Türkiyə hökuməti",
    "country": "Türkiyə",
    "levels": [
      "bachelor",
      "master",
      "phd"
    ],
    "fields": [],
    "coverage": "Təhsil haqqı, aylıq təqaüd, yataqxana, tibbi sığorta, bir dəfəlik gediş-dönüş bileti və 1 illik türk dili kursu.",
    "deadline": null,
    "deadline_note": "Adətən yanvar–fevral (2026 dövrü: 10 yanvar – 25 fevral, uzadılmış tarix).",
    "eligibility": "Yaş həddi: bakalavr üçün 21, magistr üçün 30, doktorantura üçün 35 yaşdan kiçik; minimum qiymət tələbləri var.",
    "how_to_apply": "turkiyeburslari.gov.tr-də pulsuz onlayn müraciət, bir neçə universitet/proqram seçimi, sonra müsahibə.",
    "url": "https://www.turkiyeburslari.gov.tr/"
  }
];

export const DEMO_UNIVERSITIES: Omit<University, 'id'>[] = [
  {
    "sort": 10,
    "name": "Technical University of Munich (TUM)",
    "country": "Almaniya",
    "city": "Münhen",
    "fields": [
      "engineering",
      "cs",
      "science",
      "business"
    ],
    "levels": [
      "bachelor",
      "master"
    ],
    "language": "İngilis / Alman",
    "tuition_min_eur": 4000,
    "tuition_max_eur": 12000,
    "tuition_note": "Qeyri-AB tələbələr (2024/25-dən): bakalavr semestrdə 2 000–3 000 €, magistr 4 000–6 000 €. Üstəlik ~150 € semestr haqqı.",
    "living_eur_month": 1200,
    "app_fee_eur": 0,
    "app_fee_note": "Əksər proqramlar üçün müraciət birbaşa TUMonline-da, rüsumsuz.",
    "min_ielts": 6.5,
    "exams": "Bakalavr: bəzi proqramlarda qəbul testi/SAT; magistr: bəzi proqramlarda GRE.",
    "requirements": "Azərbaycan attestatı ilə birbaşa bakalavra qəbul adətən mümkün deyil: əvvəlcə Azərbaycanda 1–2 il universitet təhsili və ya Studienkolleg + Feststellungsprüfung lazımdır. Magistr: uyğun bakalavr dərəcəsi.",
    "deadline_note": "Proqramdan asılı; qış semestri üçün müraciətlər adətən yaz aylarında bağlanır.",
    "scholarships_note": "DAAD, Deutschlandstipendium.",
    "url": "https://www.tum.de/en/studies/fees/tuition"
  },
  {
    "sort": 30,
    "name": "University of Debrecen",
    "country": "Macarıstan",
    "city": "Debrecen",
    "fields": [
      "medicine",
      "engineering",
      "business",
      "science"
    ],
    "levels": [
      "bachelor",
      "master"
    ],
    "language": "İngilis",
    "tuition_min_eur": null,
    "tuition_max_eur": 15600,
    "tuition_note": "Tibb: 16 900 $/il (2026/27). Digər proqramlar daha ucuzdur.",
    "living_eur_month": 600,
    "app_fee_eur": 140,
    "app_fee_note": "150 $ müraciət haqqı; qəbul olunduqda 350 $ giriş haqqı.",
    "min_ielts": null,
    "exams": "Tibb: biologiya və kimya üzrə giriş imtahanı, müsahibə.",
    "requirements": "Orta məktəb attestatı; tibb üçün biologiya və kimya biliyi.",
    "deadline_note": "Adətən yaz-yay aylarında, bir neçə mərhələ.",
    "scholarships_note": "Stipendium Hungaricum ilə pulsuz təhsil mümkündür.",
    "url": "https://edu.unideb.hu/p/tuition-fee-application-entrance-fee"
  },
  {
    "sort": 60,
    "name": "Middle East Technical University (ODTÜ)",
    "country": "Türkiyə",
    "city": "Ankara",
    "fields": [
      "engineering",
      "cs",
      "science",
      "arts",
      "business",
      "social"
    ],
    "levels": [
      "bachelor",
      "master"
    ],
    "language": "İngilis",
    "tuition_min_eur": 1500,
    "tuition_max_eur": 2200,
    "tuition_note": "Təxminən 1 600–2 400 $/il (fakültədən asılı).",
    "living_eur_month": 500,
    "app_fee_eur": 0,
    "app_fee_note": "2026/27 üçün müraciət haqqı yoxdur.",
    "min_ielts": null,
    "exams": "YÖS, SAT, ACT, IB və ya ABITUR.",
    "requirements": "Qəbul imtahanı nəticəsi + attestat. İngilis dili sertifikatı (məs. TOEFL iBT 75+) olmasa, hazırlıq ili keçirsən.",
    "deadline_note": "Bakalavr: 2026-cı ildə 1 iyun – 12 iyul.",
    "scholarships_note": "Türkiye Bursları ilə də qəbul mümkündür.",
    "url": "https://iso.metu.edu.tr/en/tum-duyurular"
  }
];
