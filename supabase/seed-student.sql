-- Student section content (Student plan, 7 ₼): scholarships and universities.
-- Researched September 2026 from the official pages linked in each row.
-- Fees and deadlines change every year: check the official page before relying on them.
-- Run in Supabase: SQL Editor → paste → Run (after supabase/app.sql). Safe to re-run:
-- rows are matched by name and updated.

create unique index if not exists scholarships_name_key on public.scholarships (name);
create unique index if not exists universities_name_key on public.universities (name);

insert into public.scholarships (name, provider, country, levels, fields, coverage, deadline, deadline_note, eligibility, how_to_apply, url, sort)
values
  ('Chevening', 'Böyük Britaniya hökuməti (FCDO)', 'Böyük Britaniya', array['master']::text[], '{}'::text[], 'Tam təqaüd: təhsil haqqı, aylıq yaşayış müavinəti, gediş-dönüş biletləri, viza xərcləri.', '2026-10-06'::date, '2027/28 tədris ili üçün: 6 oktyabr 2026, 11:00 UTC. Müraciət adətən avqustda açılır.', 'Azərbaycan vətəndaşı; bakalavr dərəcəsi; ən azı 2 il iş təcrübəsi; təhsildən sonra ən azı 2 il Azərbaycana qayıtmaq öhdəliyi. Böyük Britaniyada 3 magistr proqramına müraciət etmək lazımdır.', 'chevening.org-da onlayn forma: liderlik, şəbəkə qurma, “niyə UK” və karyera planı haqqında esselər, 2 tövsiyə. Seçilənlər Bakıda müsahibəyə çağırılır.', 'https://www.chevening.org/scholarship/azerbaijan/', 10),
  ('Fulbright Foreign Student Program', 'ABŞ Dövlət Departamenti', 'ABŞ', array['master']::text[], '{}'::text[], 'Təhsil haqqı, aylıq yaşayış təqaüdü, tibbi sığorta və beynəlxalq uçuş.', null::date, 'Hər il ABŞ-ın Bakıdakı səfirliyi elan edir (hazırda 2027–2028 tədris ili üçün müsabiqə).', 'Azərbaycan vətəndaşı; bakalavr dərəcəsi; güclü ingilis dili. Klinik ixtisaslar (tibb, stomatologiya, əczaçılıq, tibb bacısı) uyğun deyil; ictimai səhiyyə mümkündür.', 'Səfirliyin elanındakı onlayn forma, esselər və tövsiyələr; sonra imtahanlar (TOEFL, GRE) və müsahibə.', 'https://az.usembassy.gov/fulbright-foreign-student-program/', 20),
  ('Stipendium Hungaricum', 'Macarıstan hökuməti', 'Macarıstan', array['bachelor', 'master', 'phd']::text[], '{}'::text[], 'Pulsuz təhsil, aylıq təqaüd, yataqxana və ya yaşayış dəstəyi, tibbi sığorta.', null::date, 'Adətən noyabrda açılır, yanvarın ortasında bağlanır (2026/27 dövrü: 15 yanvar 2026).', 'Azərbaycan tərəfdaş ölkədir. Hər ölkə üçün icazə verilən səviyyə və sahələr ikitərəfli sazişlə müəyyən olunur; Azərbaycandakı göndərən tərəfin təsdiqi lazımdır.', 'stipendiumhungaricum.hu portalında müraciət, 2 proqrama qədər seçim; sonra universitetin qəbul imtahanı/müsahibəsi.', 'https://stipendiumhungaricum.hu/country/azerbaijan/', 30),
  ('Türkiye Bursları', 'Türkiyə hökuməti', 'Türkiyə', array['bachelor', 'master', 'phd']::text[], '{}'::text[], 'Təhsil haqqı, aylıq təqaüd, yataqxana, tibbi sığorta, bir dəfəlik gediş-dönüş bileti və 1 illik türk dili kursu.', null::date, 'Adətən yanvar–fevral (2026 dövrü: 10 yanvar – 25 fevral, uzadılmış tarix).', 'Yaş həddi: bakalavr üçün 21, magistr üçün 30, doktorantura üçün 35 yaşdan kiçik; minimum qiymət tələbləri var.', 'turkiyeburslari.gov.tr-də pulsuz onlayn müraciət, bir neçə universitet/proqram seçimi, sonra müsahibə.', 'https://www.turkiyeburslari.gov.tr/', 40),
  ('Global Korea Scholarship (GKS)', 'Koreya hökuməti (NIIED)', 'Cənubi Koreya', array['bachelor', 'master', 'phd']::text[], '{}'::text[], 'Təhsil haqqı, aylıq təqaüd, uçuş, tibbi sığorta və 1 illik Koreya dili kursu.', null::date, 'Magistr/doktorantura: adətən fevral–mart; bakalavr: adətən sentyabr–oktyabr. Səfirlik və universitet yolu var.', 'Azərbaycan vətəndaşları müraciət edə bilər. Magistr/doktorantura üçün 40 yaşdan kiçik; bakalavr üçün 25 yaşdan kiçik.', 'Study in Korea saytındakı elana əsasən səfirlik və ya birbaşa universitet vasitəsilə sənəd təqdimi.', 'https://www.studyinkorea.go.kr/', 50),
  ('Swedish Institute Scholarships for Global Professionals', 'İsveç İnstitutu', 'İsveç', array['master']::text[], '{}'::text[], 'Təhsil haqqı, aylıq yaşayış xərci, sığorta və səyahət qrantı (Azərbaycan üçün 10 000 SEK).', null::date, 'Adətən fevralda (əvvəlcə İsveç universitetinə müraciət etmək lazımdır).', 'Azərbaycan uyğun ölkələrdəndir. İş təcrübəsinin rəsmi sübutu tələb olunur (Azərbaycan üçün minimum saat həddi yoxdur); liderlik təcrübəsi qiymətləndirilir.', 'universityadmissions.se-də magistr proqramına müraciət, sonra si.se-də təqaüd müraciəti.', 'https://si.se/en/apply/scholarships/swedish-institute-scholarships-for-global-professionals/', 60),
  ('DAAD təqaüdləri', 'Almaniya Akademik Mübadilə Xidməti (DAAD)', 'Almaniya', array['master', 'phd']::text[], '{}'::text[], 'Aylıq təqaüd, tibbi sığorta, səyahət müavinəti; proqramdan asılı olaraq digər xərclər.', null::date, 'Proqramdan asılıdır — çox vaxt təhsildən təxminən bir il əvvəl (payız aylarında).', 'Proqramdan asılıdır. Məs. EPOS (inkişafla bağlı magistr proqramları) adətən ən azı 2 il iş təcrübəsi istəyir.', 'DAAD təqaüd bazasında ölkə olaraq Azərbaycanı seç və sənə uyğun proqramın şərtlərinə bax.', 'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/', 70),
  ('Erasmus Mundus Joint Masters', 'Avropa İttifaqı', 'Avropa (bir neçə ölkə)', array['master']::text[], '{}'::text[], 'Tam təqaüd: təhsil haqqı, səyahət və aylıq müavinət; təhsil ən azı 2 Avropa ölkəsində keçir.', null::date, 'Hər proqramın öz son tarixi var, adətən dekabr–fevral.', 'Bütün ölkələrin vətəndaşları; bakalavr dərəcəsi; proqramın öz tələbləri (dil, sahə).', 'Erasmus Mundus kataloqundan proqram seç və birbaşa proqramın konsorsiumuna müraciət et.', 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en', 80),
  ('Xaricdə təhsil üzrə Dövlət Proqramı', 'Azərbaycan Respublikası Elm və Təhsil Nazirliyi', 'Azərbaycan (xaricdə təhsil)', array['bachelor', 'master']::text[], array['cs', 'engineering', 'science', 'medicine', 'education', 'business', 'arts', 'social']::text[], 'Nüfuzlu xarici universitetdə təhsil xərcləri Dövlət Proqramı çərçivəsində qarşılanır (şərtlər proqram qaydalarındadır).', null::date, 'Sənəd qəbulu hər tədris ili üçün ayrıca elan olunur.', 'Azərbaycan vətəndaşı; siyahıdakı nüfuzlu xarici universitetə qəbul (və ya orada təhsil); 15 prioritet ixtisas sahəsi (İT, mühəndislik, statistika, səhiyyə, təhsil, enerji, iqtisadiyyat və s.). Yerlərin ən azı 80%-i magistr üçündür. Məzun olduqdan sonra öhdəliklər var — qaydaları diqqətlə oxu.', 'Nazirliyin elektron sistemində “Şəxsi kabinet” yaradıb sənədləri yükləmək; uyğun namizədlər müsahibəyə çağırılır.', 'https://edu.gov.az/az/2022-2026-ci-iller-uzre-dovlet-proqrami/2022-2026-ci-iller-uzre-dovlet-proqrami2483', 90),
  ('MEXT (Yaponiya hökuməti təqaüdü)', 'Yaponiya Təhsil Nazirliyi', 'Yaponiya', array['bachelor', 'master', 'phd']::text[], '{}'::text[], 'Təhsil haqqı, aylıq təqaüd, gediş-dönüş bileti.', null::date, 'Səfirlik yolu: adətən yazda Yaponiyanın Azərbaycandakı səfirliyi elan edir.', 'Səviyyəyə görə yaş həddi; yazılı imtahan və müsahibə.', 'Səfirliyin elanına əsasən sənədlər, sonra imtahan və müsahibə; universitet yolu da mövcuddur.', 'https://www.studyinjapan.go.jp/en/', 100),
  ('Çin hökuməti təqaüdü (CSC)', 'China Scholarship Council', 'Çin', array['bachelor', 'master', 'phd']::text[], '{}'::text[], 'Tam təqaüd: təhsil haqqı, yataqxana, aylıq təqaüd, tibbi sığorta.', null::date, 'Adətən yanvar–aprel, universitet və ya səfirlik vasitəsilə.', 'Səviyyəyə görə yaş həddi; universitetin qəbul tələbləri.', 'Campus China portalında onlayn müraciət və seçilmiş universitetin tələbləri.', 'https://www.campuschina.org/', 110),
  ('Eiffel Excellence Scholarship', 'Fransa Xarici İşlər Nazirliyi (Campus France)', 'Fransa', array['master', 'phd']::text[], array['law', 'business', 'engineering', 'science', 'social']::text[], 'Aylıq müavinət, səyahət, tibbi sığorta və mədəni tədbirlər.', null::date, 'Namizədi fransız universiteti irəli sürür, adətən yanvarda.', 'Hüquq, iqtisadiyyat və idarəetmə, siyasi elmlər, mühəndislik və elm sahələrində magistr/doktorantura namizədləri.', 'Əvvəlcə fransız universitetinə müraciət et; universitet səni Eiffel proqramına namizəd kimi təqdim edir.', 'https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence', 120)
on conflict (name) do update set
  provider = excluded.provider, country = excluded.country, levels = excluded.levels, fields = excluded.fields,
  coverage = excluded.coverage, deadline = excluded.deadline, deadline_note = excluded.deadline_note,
  eligibility = excluded.eligibility, how_to_apply = excluded.how_to_apply, url = excluded.url, sort = excluded.sort, updated_at = now();

insert into public.universities (name, country, city, fields, levels, language, tuition_min_eur, tuition_max_eur, tuition_note, living_eur_month, app_fee_eur, app_fee_note, min_ielts, exams, requirements, deadline_note, scholarships_note, url, sort)
values
  ('Technical University of Munich (TUM)', 'Almaniya', 'Münhen', array['engineering', 'cs', 'science', 'business']::text[], array['bachelor', 'master']::text[], 'İngilis / Alman', 4000, 12000, 'Qeyri-AB tələbələr (2024/25-dən): bakalavr semestrdə 2 000–3 000 €, magistr 4 000–6 000 €. Üstəlik ~150 € semestr haqqı.', 1200, 0, 'Əksər proqramlar üçün müraciət birbaşa TUMonline-da, rüsumsuz.', 6.5, 'Bakalavr: bəzi proqramlarda qəbul testi/SAT; magistr: bəzi proqramlarda GRE.', 'Azərbaycan attestatı ilə birbaşa bakalavra qəbul adətən mümkün deyil: əvvəlcə Azərbaycanda 1–2 il universitet təhsili və ya Studienkolleg + Feststellungsprüfung lazımdır. Magistr: uyğun bakalavr dərəcəsi.', 'Proqramdan asılı; qış semestri üçün müraciətlər adətən yaz aylarında bağlanır.', 'DAAD, Deutschlandstipendium.', 'https://www.tum.de/en/studies/fees/tuition', 10),
  ('Politecnico di Milano', 'İtaliya', 'Milan', array['engineering', 'arts', 'cs']::text[], array['bachelor', 'master']::text[], 'İngilis / İtalyan', 900, 3900, 'Gəlirdən asılı: təxminən 900–3 900 €/il (qeyri-AB standart məbləğ ~3 900 €).', 1100, 150, 'Müraciət haqqı mərhələdən asılı olaraq ~50–150 €, geri qaytarılmır.', 6.0, 'Bakalavr: SAT və ya Politecnico-nun TOL/TIL testi; dizayn/memarlıq magistri üçün portfolio.', '12 illik orta təhsil; magistr üçün uyğun bakalavr dərəcəsi.', 'Bir neçə müraciət mərhələsi, adətən payızdan yaza qədər.', 'Gəlirə əsaslanan regional (DSU) təqaüdlər, Politecnico mükafatları.', 'https://www.polimi.it/en/prospective-students/how-much-does-it-cost', 20),
  ('University of Debrecen', 'Macarıstan', 'Debrecen', array['medicine', 'engineering', 'business', 'science']::text[], array['bachelor', 'master']::text[], 'İngilis', null, 15600, 'Tibb: 16 900 $/il (2026/27). Digər proqramlar daha ucuzdur.', 600, 140, '150 $ müraciət haqqı; qəbul olunduqda 350 $ giriş haqqı.', null, 'Tibb: biologiya və kimya üzrə giriş imtahanı, müsahibə.', 'Orta məktəb attestatı; tibb üçün biologiya və kimya biliyi.', 'Adətən yaz-yay aylarında, bir neçə mərhələ.', 'Stipendium Hungaricum ilə pulsuz təhsil mümkündür.', 'https://edu.unideb.hu/p/tuition-fee-application-entrance-fee', 30),
  ('Charles University', 'Çexiya', 'Praqa', array['medicine', 'social', 'science', 'humanities', 'law']::text[], array['bachelor', 'master']::text[], 'İngilis / Çex', 1000, 24000, 'İngilisdilli proqramlar ~1 000–24 000 €/il (orta ~6 000 €). Çex dilində təhsil pulsuzdur.', 900, 41, 'Fakültədən asılı: məs. Sosial Elmlər ~940 CZK (~41 €), Tibb 285 €.', null, 'Fakültənin qəbul imtahanı (sahəyə görə).', 'Attestatın/diplomun Çexiyada tanınması (nostrifikasiya) tələb oluna bilər.', 'Adətən fevral–aprel (fakültədən asılı).', 'Çex hökuməti təqaüdləri, fakültə təqaüdləri.', 'https://cuni.cz/UKEN-372.html', 40),
  ('University of Tartu', 'Estoniya', 'Tartu', array['cs', 'science', 'social', 'humanities', 'business']::text[], array['bachelor', 'master']::text[], 'İngilis', null, null, 'Proqramdan asılı. 2026/27-dən qeyri-AB tələbələr üçün ödənişsiz yerlər təklif olunmur, bəzi proqramlarda endirim var.', 700, 100, '100 € (2 proqrama qədər), DreamApply vasitəsilə.', null, 'Motivasiya məktubu, bəzi proqramlarda müsahibə.', 'Magistr üçün uyğun bakalavr dərəcəsi və ingilis dili sertifikatı.', 'Adətən yaz aylarında — proqram səhifəsində yoxla.', 'Məhdud sayda universitet təqaüdü.', 'https://ut.ee/en/content/application-fee', 50),
  ('Middle East Technical University (ODTÜ)', 'Türkiyə', 'Ankara', array['engineering', 'cs', 'science', 'arts', 'business', 'social']::text[], array['bachelor', 'master']::text[], 'İngilis', 1500, 2200, 'Təxminən 1 600–2 400 $/il (fakültədən asılı).', 500, 0, '2026/27 üçün müraciət haqqı yoxdur.', null, 'YÖS, SAT, ACT, IB və ya ABITUR.', 'Qəbul imtahanı nəticəsi + attestat. İngilis dili sertifikatı (məs. TOEFL iBT 75+) olmasa, hazırlıq ili keçirsən.', 'Bakalavr: 2026-cı ildə 1 iyun – 12 iyul.', 'Türkiye Bursları ilə də qəbul mümkündür.', 'https://iso.metu.edu.tr/en/tum-duyurular', 60),
  ('Koç University', 'Türkiyə', 'İstanbul', array['business', 'engineering', 'cs', 'law', 'medicine', 'social', 'humanities']::text[], array['bachelor', 'master']::text[], 'İngilis', 20000, 27000, 'Təxminən 21 500 $/il; tibb ~29 000 $/il.', 800, 0, 'Bakalavr üçün müraciət haqqı yoxdur.', null, 'SAT/ACT, IB, A-Level və ya ekvivalent.', 'Güclü akademik nəticələr və imtahan balı; ingilis dili sertifikatı.', 'Bir neçə müraciət mərhələsi — universitet saytında yoxla.', '25%, 50%, 75% və 100% təqaüdlər qəbul zamanı avtomatik nəzərdən keçirilir (tibb istisna).', 'https://international.ku.edu.tr/undergraduate-programs/tuition-and-scholarships/', 70),
  ('KU Leuven', 'Belçika', 'Leuven', array['engineering', 'business', 'law', 'science', 'humanities']::text[], array['bachelor', 'master']::text[], 'İngilis / Holland', 9500, 9500, 'Qeyri-AB tələbələr üçün təxminən 9 500 €/il (60 kredit); bəzi proqramlarda fərqlidir.', 1000, 90, 'Müraciət haqqı 90 €.', null, 'Bəzi proqramlarda GRE/GMAT.', 'Magistr: uyğun bakalavr dərəcəsi və ingilis dili sertifikatı.', 'Qeyri-AB namizədlər üçün adətən yazdan əvvəl — proqram səhifəsində yoxla.', 'Bəzi fakültələrdə qeyri-AB tələbələr üçün qismən təhsil haqqı güzəşti.', 'https://www.kuleuven.be/english/education/student/fees', 80),
  ('University of Warsaw', 'Polşa', 'Varşava', array['social', 'business', 'humanities', 'cs', 'law']::text[], array['bachelor', 'master']::text[], 'İngilis / Polyak', null, null, 'İngilisdilli proqramlar üçün qeyri-AB tələbələr ödəyir; məbləğ proqramdan asılıdır (Polşada ümumən ~1 000–18 000 €/il).', 800, 20, 'Qəbul (recruitment) haqqı — Polşada adətən 20–50 €.', null, 'Proqramdan asılı.', 'Attestat/diplomun tanınması; ingilis dili sertifikatı.', 'Adətən yaz-yay aylarında.', 'Polşa hökumətinin NAWA təqaüdləri.', 'https://rekrutacja.uw.edu.pl/en/application-and-tuition-fees/', 90),
  ('University of Manchester', 'Böyük Britaniya', 'Mançester', array['business', 'engineering', 'cs', 'science', 'social', 'medicine', 'law', 'humanities']::text[], array['bachelor', 'master']::text[], 'İngilis', 31000, 41000, 'Beynəlxalq tələbələr üçün təxmini 27 000–35 000 £/il (proqramdan asılı).', 1300, 40, 'Bakalavr: UCAS haqqı 34,50 £ (2027 qəbulu, 5 seçimə qədər). Magistr: birbaşa universitetə.', 6.5, 'A-Level/IB; Azərbaycan attestatı ilə adətən Foundation ili tələb olunur.', 'Bakalavr: Foundation ili və ya beynəlxalq diplom; magistr: uyğun bakalavr dərəcəsi.', 'UCAS: əksər bakalavr proqramları üçün 13 yanvar 2027.', 'Chevening (magistr), universitet təqaüdləri.', 'https://www.manchester.ac.uk/study/international/', 100)
on conflict (name) do update set
  country = excluded.country, city = excluded.city, fields = excluded.fields, levels = excluded.levels, language = excluded.language,
  tuition_min_eur = excluded.tuition_min_eur, tuition_max_eur = excluded.tuition_max_eur, tuition_note = excluded.tuition_note,
  living_eur_month = excluded.living_eur_month, app_fee_eur = excluded.app_fee_eur, app_fee_note = excluded.app_fee_note,
  min_ielts = excluded.min_ielts, exams = excluded.exams, requirements = excluded.requirements, deadline_note = excluded.deadline_note,
  scholarships_note = excluded.scholarships_note, url = excluded.url, sort = excluded.sort, updated_at = now();

-- English text, what each scholarship pays for, and its usual application window.
-- Months are set only where the official note names them; otherwise they stay null
-- and the app shows the note instead. Needs the "Student section, v2" part of app.sql.
update public.scholarships set covers = array['tuition', 'stipend', 'flights']::text[], funding = 'full', opens_month = 8, closes_month = 10, en = $j${
  "provider": "UK Government (FCDO)", "country": "United Kingdom",
  "coverage": "Full scholarship: tuition, a monthly living allowance, return flights and visa costs.",
  "deadline_note": "For the 2027/28 academic year: 6 October 2026, 11:00 UTC. Applications usually open in August.",
  "eligibility": "Azerbaijani citizen; bachelor’s degree; at least 2 years of work experience; commitment to return to Azerbaijan for at least 2 years after your studies. You must apply to 3 master’s programmes in the UK.",
  "how_to_apply": "Online form at chevening.org: essays on leadership, networking, “why the UK” and your career plan, plus 2 references. Shortlisted candidates are interviewed in Baku."
}$j$::jsonb where name = 'Chevening';

update public.scholarships set covers = array['tuition', 'stipend', 'insurance', 'flights']::text[], funding = 'full', opens_month = null, closes_month = null, en = $j${
  "provider": "US Department of State", "country": "United States",
  "coverage": "Tuition, a monthly living stipend, health insurance and an international flight.",
  "deadline_note": "Announced every year by the US Embassy in Baku (the current round is for the 2027–2028 academic year).",
  "eligibility": "Azerbaijani citizen; bachelor’s degree; strong English. Clinical fields (medicine, dentistry, pharmacy, nursing) are not eligible; public health is.",
  "how_to_apply": "Online form from the embassy’s announcement, essays and references; then tests (TOEFL, GRE) and an interview."
}$j$::jsonb where name = 'Fulbright Foreign Student Program';

update public.scholarships set covers = array['tuition', 'stipend', 'housing', 'insurance']::text[], funding = 'full', opens_month = 11, closes_month = 1, en = $j${
  "provider": "Government of Hungary", "country": "Hungary",
  "coverage": "Free tuition, a monthly stipend, a dorm place or housing support, and medical insurance.",
  "deadline_note": "Usually opens in November and closes in mid-January (2026/27 round: 15 January 2026).",
  "eligibility": "Azerbaijan is a partner country. The levels and fields open to each country are set by a bilateral agreement; you need approval from the sending partner in Azerbaijan.",
  "how_to_apply": "Apply on the stipendiumhungaricum.hu portal and choose up to 2 programmes; then the university’s entrance exam or interview."
}$j$::jsonb where name = 'Stipendium Hungaricum';

update public.scholarships set covers = array['tuition', 'stipend', 'housing', 'insurance', 'flights', 'language']::text[], funding = 'full', opens_month = 1, closes_month = 2, en = $j${
  "provider": "Government of Türkiye", "country": "Türkiye",
  "coverage": "Tuition, a monthly stipend, a dorm place, medical insurance, one return flight and a 1-year Turkish language course.",
  "deadline_note": "Usually January–February (2026 round: 10 January – 25 February, extended).",
  "eligibility": "Age limits: under 21 for bachelor’s, under 30 for master’s, under 35 for PhD; minimum grade requirements apply.",
  "how_to_apply": "Free online application at turkiyeburslari.gov.tr; choose several universities and programmes, then an interview."
}$j$::jsonb where name = 'Türkiye Bursları';

update public.scholarships set covers = array['tuition', 'stipend', 'flights', 'insurance', 'language']::text[], funding = 'full', opens_month = null, closes_month = null, en = $j${
  "provider": "Government of Korea (NIIED)", "country": "South Korea",
  "coverage": "Tuition, a monthly stipend, flights, medical insurance and a 1-year Korean language course.",
  "deadline_note": "Master’s/PhD: usually February–March; bachelor’s: usually September–October. There is an embassy track and a university track.",
  "eligibility": "Azerbaijani citizens can apply. Under 40 for master’s/PhD; under 25 for bachelor’s.",
  "how_to_apply": "Submit your documents through the embassy or directly to a university, following the announcement on Study in Korea."
}$j$::jsonb where name = 'Global Korea Scholarship (GKS)';

update public.scholarships set covers = array['tuition', 'stipend', 'insurance', 'flights']::text[], funding = 'full', opens_month = null, closes_month = 2, en = $j${
  "provider": "Swedish Institute", "country": "Sweden",
  "coverage": "Tuition, monthly living costs, insurance and a travel grant (10,000 SEK for Azerbaijan).",
  "deadline_note": "Usually in February (you must apply to a Swedish university first).",
  "eligibility": "Azerbaijan is an eligible country. You need official proof of work experience (no minimum number of hours for Azerbaijan); leadership experience is assessed.",
  "how_to_apply": "Apply to a master’s programme on universityadmissions.se, then apply for the scholarship on si.se."
}$j$::jsonb where name = 'Swedish Institute Scholarships for Global Professionals';

update public.scholarships set covers = array['stipend', 'insurance', 'flights']::text[], funding = 'partial', opens_month = null, closes_month = null, en = $j${
  "name": "DAAD scholarships", "provider": "German Academic Exchange Service (DAAD)", "country": "Germany",
  "coverage": "A monthly stipend, health insurance and a travel allowance; other costs depending on the programme.",
  "deadline_note": "Depends on the programme — often about a year before your studies start (in the autumn).",
  "eligibility": "Depends on the programme. For example, EPOS (development-related master’s programmes) usually asks for at least 2 years of work experience.",
  "how_to_apply": "In the DAAD scholarship database, choose Azerbaijan as your country and check the conditions of the programme that fits you."
}$j$::jsonb where name = 'DAAD təqaüdləri';

update public.scholarships set covers = array['tuition', 'stipend', 'flights']::text[], funding = 'full', opens_month = null, closes_month = null, en = $j${
  "provider": "European Union", "country": "Europe (several countries)",
  "coverage": "Full scholarship: tuition, travel and a monthly allowance; you study in at least 2 European countries.",
  "deadline_note": "Each programme has its own deadline, usually December–February.",
  "eligibility": "Citizens of any country; bachelor’s degree; the programme’s own requirements (language, field).",
  "how_to_apply": "Pick a programme from the Erasmus Mundus catalogue and apply directly to its consortium."
}$j$::jsonb where name = 'Erasmus Mundus Joint Masters';

update public.scholarships set covers = array['tuition']::text[], funding = null, opens_month = null, closes_month = null, en = $j${
  "name": "State Programme for Study Abroad", "provider": "Ministry of Science and Education of Azerbaijan", "country": "Azerbaijan (study abroad)",
  "coverage": "Your study costs at a leading foreign university are covered under the State Programme (the conditions are in the programme rules).",
  "deadline_note": "Applications are announced separately for each academic year.",
  "eligibility": "Azerbaijani citizen; admission to (or study at) a leading foreign university on the list; one of 15 priority fields (IT, engineering, statistics, health, education, energy, economics and more). At least 80% of places are for master’s. There are obligations after graduation — read the rules carefully.",
  "how_to_apply": "Create a “Personal account” in the Ministry’s online system and upload your documents; suitable candidates are invited to an interview."
}$j$::jsonb where name = 'Xaricdə təhsil üzrə Dövlət Proqramı';

update public.scholarships set covers = array['tuition', 'stipend', 'flights']::text[], funding = 'full', opens_month = null, closes_month = null, en = $j${
  "name": "MEXT (Japanese Government Scholarship)", "provider": "Japanese Ministry of Education (MEXT)", "country": "Japan",
  "coverage": "Tuition, a monthly stipend and a return flight.",
  "deadline_note": "Embassy track: usually announced in spring by the Embassy of Japan in Azerbaijan.",
  "eligibility": "Age limits depend on the level; written exam and interview.",
  "how_to_apply": "Documents as in the embassy’s announcement, then an exam and an interview; there is also a university track."
}$j$::jsonb where name = 'MEXT (Yaponiya hökuməti təqaüdü)';

update public.scholarships set covers = array['tuition', 'housing', 'stipend', 'insurance']::text[], funding = 'full', opens_month = 1, closes_month = 4, en = $j${
  "name": "Chinese Government Scholarship (CSC)", "country": "China",
  "coverage": "Full scholarship: tuition, a dorm place, a monthly stipend and medical insurance.",
  "deadline_note": "Usually January–April, through a university or the embassy.",
  "eligibility": "Age limits depend on the level; the university’s admission requirements.",
  "how_to_apply": "Apply online on the Campus China portal and meet the chosen university’s requirements."
}$j$::jsonb where name = 'Çin hökuməti təqaüdü (CSC)';

update public.scholarships set covers = array['stipend', 'flights', 'insurance']::text[], funding = 'partial', opens_month = null, closes_month = 1, en = $j${
  "provider": "French Ministry for Europe and Foreign Affairs (Campus France)", "country": "France",
  "coverage": "A monthly allowance, travel, health insurance and cultural activities.",
  "deadline_note": "A French university nominates you, usually in January.",
  "eligibility": "Master’s and PhD candidates in law, economics and management, political science, engineering and sciences.",
  "how_to_apply": "First apply to a French university; the university puts you forward for the Eiffel programme."
}$j$::jsonb where name = 'Eiffel Excellence Scholarship';

-- Universities: English text and, where it is fixed, the month applications close.
update public.universities set closes_month = null, en = $j${
  "country": "Germany", "city": "Munich", "language": "English / German",
  "tuition_note": "Non-EU students (since 2024/25): bachelor’s 2,000–3,000 € per semester, master’s 4,000–6,000 €. Plus a ~150 € semester fee.",
  "app_fee_note": "For most programmes you apply directly on TUMonline, free of charge.",
  "exams": "Bachelor’s: an aptitude test/SAT for some programmes; master’s: GRE for some programmes.",
  "requirements": "Direct bachelor’s admission with an Azerbaijani school certificate is usually not possible: you first need 1–2 years of university in Azerbaijan, or a Studienkolleg + Feststellungsprüfung. Master’s: a relevant bachelor’s degree.",
  "deadline_note": "Depends on the programme; applications for the winter semester usually close in spring.",
  "scholarships_note": "DAAD, Deutschlandstipendium."
}$j$::jsonb where name = 'Technical University of Munich (TUM)';

update public.universities set closes_month = null, en = $j${
  "country": "Italy", "city": "Milan", "language": "English / Italian",
  "tuition_note": "Income-based: about 900–3,900 € a year (standard non-EU amount ~3,900 €).",
  "app_fee_note": "Application fee ~50–150 € depending on the round, non-refundable.",
  "exams": "Bachelor’s: SAT or Politecnico’s TOL/TIL test; a portfolio for design and architecture master’s.",
  "requirements": "12 years of secondary school; a relevant bachelor’s degree for master’s.",
  "deadline_note": "Several application rounds, usually from autumn to spring.",
  "scholarships_note": "Income-based regional (DSU) scholarships, Politecnico awards."
}$j$::jsonb where name = 'Politecnico di Milano';

update public.universities set closes_month = null, en = $j${
  "country": "Hungary", "city": "Debrecen", "language": "English",
  "tuition_note": "Medicine: $16,900 a year (2026/27). Other programmes cost less.",
  "app_fee_note": "$150 application fee; a $350 entrance fee if you are admitted.",
  "exams": "Medicine: entrance exam in biology and chemistry, interview.",
  "requirements": "Secondary school certificate; biology and chemistry knowledge for medicine.",
  "deadline_note": "Usually spring–summer, in several rounds.",
  "scholarships_note": "Free tuition is possible with Stipendium Hungaricum."
}$j$::jsonb where name = 'University of Debrecen';

update public.universities set closes_month = 4, en = $j${
  "country": "Czechia", "city": "Prague", "language": "English / Czech",
  "tuition_note": "English-taught programmes ~1,000–24,000 € a year (average ~6,000 €). Studying in Czech is free.",
  "app_fee_note": "Depends on the faculty: e.g. Social Sciences ~940 CZK (~41 €), Medicine 285 €.",
  "exams": "The faculty’s entrance exam (by field).",
  "requirements": "Your certificate or diploma may need to be recognised in Czechia (nostrification).",
  "deadline_note": "Usually February–April (depends on the faculty).",
  "scholarships_note": "Czech government scholarships, faculty scholarships."
}$j$::jsonb where name = 'Charles University';

update public.universities set closes_month = null, en = $j${
  "country": "Estonia", "city": "Tartu", "language": "English",
  "tuition_note": "Depends on the programme. From 2026/27 there are no tuition-free places for non-EU students; some programmes offer discounts.",
  "app_fee_note": "100 € (up to 2 programmes), through DreamApply.",
  "exams": "Motivation letter; an interview for some programmes.",
  "requirements": "For master’s: a relevant bachelor’s degree and an English certificate.",
  "deadline_note": "Usually in spring — check the programme page.",
  "scholarships_note": "A limited number of university scholarships."
}$j$::jsonb where name = 'University of Tartu';

update public.universities set closes_month = 7, en = $j${
  "name": "Middle East Technical University (METU)", "country": "Türkiye", "city": "Ankara", "language": "English",
  "tuition_note": "About $1,600–2,400 a year (depends on the faculty).",
  "app_fee_note": "No application fee for 2026/27.",
  "exams": "YÖS, SAT, ACT, IB or ABITUR.",
  "requirements": "Entrance exam result + school certificate. Without an English certificate (e.g. TOEFL iBT 75+) you do a preparatory year.",
  "deadline_note": "Bachelor’s: 1 June – 12 July in 2026.",
  "scholarships_note": "Admission with Türkiye Bursları is also possible."
}$j$::jsonb where name = 'Middle East Technical University (ODTÜ)';

update public.universities set closes_month = null, en = $j${
  "country": "Türkiye", "city": "Istanbul", "language": "English",
  "tuition_note": "About $21,500 a year; medicine ~$29,000 a year.",
  "app_fee_note": "No application fee for bachelor’s.",
  "exams": "SAT/ACT, IB, A-Level or equivalent.",
  "requirements": "Strong academic results and test scores; an English certificate.",
  "deadline_note": "Several application rounds — check the university website.",
  "scholarships_note": "25%, 50%, 75% and 100% scholarships are considered automatically on admission (except medicine)."
}$j$::jsonb where name = 'Koç University';

update public.universities set closes_month = null, en = $j${
  "country": "Belgium", "city": "Leuven", "language": "English / Dutch",
  "tuition_note": "About 9,500 € a year for non-EU students (60 credits); different for some programmes.",
  "app_fee_note": "Application fee 90 €.",
  "exams": "GRE/GMAT for some programmes.",
  "requirements": "Master’s: a relevant bachelor’s degree and an English certificate.",
  "deadline_note": "For non-EU applicants usually before spring — check the programme page.",
  "scholarships_note": "Partial tuition reductions for non-EU students in some faculties."
}$j$::jsonb where name = 'KU Leuven';

update public.universities set closes_month = null, en = $j${
  "country": "Poland", "city": "Warsaw", "language": "English / Polish",
  "tuition_note": "Non-EU students pay for English-taught programmes; the amount depends on the programme (in Poland generally ~1,000–18,000 € a year).",
  "app_fee_note": "Recruitment fee — usually 20–50 € in Poland.",
  "exams": "Depends on the programme.",
  "requirements": "Recognition of your certificate or diploma; an English certificate.",
  "deadline_note": "Usually spring–summer.",
  "scholarships_note": "Polish government NAWA scholarships."
}$j$::jsonb where name = 'University of Warsaw';

update public.universities set closes_month = 1, en = $j${
  "country": "United Kingdom", "city": "Manchester", "language": "English",
  "tuition_note": "Estimated £27,000–35,000 a year for international students (depends on the programme).",
  "app_fee_note": "Bachelor’s: UCAS fee £34.50 (2027 entry, up to 5 choices). Master’s: directly to the university.",
  "exams": "A-Level/IB; with an Azerbaijani school certificate a Foundation year is usually required.",
  "requirements": "Bachelor’s: a Foundation year or an international diploma; master’s: a relevant bachelor’s degree.",
  "deadline_note": "UCAS: 13 January 2027 for most bachelor’s programmes.",
  "scholarships_note": "Chevening (master’s), university scholarships."
}$j$::jsonb where name = 'University of Manchester';
