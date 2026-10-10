-- 65 open opportunities for participants from Azerbaijan, found and
-- checked on 10 October 2026. For each one the official page was opened and the
-- deadline and eligibility (Azerbaijan, Eastern Partnership or worldwide) were
-- confirmed there. All deadlines are on or after 13 October 2026.
--
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- Run app.sql first (it adds the sending_org columns).
-- Safe to re-run: rows whose url already exists are skipped.
-- created_at is set one day back so free users see them right away
-- (new opportunities are otherwise Premium-only for 24 hours).

insert into public.opportunities
  (title, program, organizer, kind, country, city, is_online, interests,
   deadline, start_date, end_date, costs, url, description,
   sending_org, sending_org_contact, published, created_at)
select v.title, v.program, v.organizer, v.kind, v.country, v.city, v.is_online, v.interests,
       v.deadline::date, v.start_date::date, v.end_date::date, v.costs, v.url, v.description,
       v.sending_org, v.sending_org_contact, true, now() - interval '1 day'
from (values
  -- SALTO-Youth European Training Calendar: training courses, seminars, online courses (12)
  (
    'Virtual Exchange - DevelopMENs',
    'Erasmus+', 'L''ORMA',
    'online', '', '', true, array['education', 'digital'],
    '2026-10-14', '2026-10-15', '2026-10-15', 'full',
    'https://www.salto-youth.net/tools/european-training-calendar/training/virtual-exchange-developmens.15407/',
    'DevelopMENS layihəsinin yumşaq bacarıqlar, tənqidi düşüncə və media savadlılığı üzrə pulsuz onlayn öyrənmə platformasını tanıdan 1 saatlıq vebinar (15 oktyabr, 16:00–17:00 CET, Zoom). Trenerlər, müəllimlər, gənclər işçiləri və gənclər üçündür. İştirak pulsuzdur.',
    '', ''
  ),
  (
    'Dive in. Foundations of conflict transformation at the interpersonal level',
    'Erasmus+', 'Libre-pensadores de La Sierra de Madrid (LPS)',
    'training', 'İspaniya', 'Guriezo', false, array['peace', 'human_rights'],
    '2026-10-15', '2026-11-02', '2026-11-09', 'full',
    'https://www.salto-youth.net/tools/european-training-calendar/training/dive-in-foundations-of-conflict-transformation-at-the-interpersonal-level.15405/',
    'Münaqişələrin zorakılıqsız transformasiyası, sülh mədəniyyəti və zorakılıqsız ünsiyyət üzrə 25 nəfərlik təlim kursu (Kantabriya). Gənclər işçiləri, gənc liderlər və aktivistlər üçündür. İştirak pulsuzdur: yaşayış və yemək qarşılanır, yol xərci Erasmus+ limitləri daxilində ödənilir.',
    '', ''
  ),
  (
    'Digital Content & Pedagogical Practices',
    'Erasmus+', 'Asociatia Nationala de Dezvoltare Continua a Tineretului din Romania',
    'training', 'Bolqarıstan', 'Bansko', false, array['digital', 'education'],
    '2026-10-16', '2026-11-26', '2026-12-02', 'full',
    'https://www.salto-youth.net/tools/european-training-calendar/training/digital-content-pedagogical-practices.15401/',
    'Gənclər işində və qeyri-formal təhsildə rəqəmsal kontent, süni intellekt və avtomatlaşdırma alətlərindən istifadəni öyrədən təlim kursu. 18 yaşdan yuxarı, Erasmus+ və ya ESC-də fəal QHT-ləri təmsil edən gənclər işçiləri üçündür. İştirak pulsuzdur: yaşayış və yemək qarşılanır, yol xərci Erasmus+ qaydaları ilə məsafədən asılı olaraq 535 avroya qədər ödənilir.',
    '', ''
  ),
  (
    'Webinar - Presentation of the Consent Toolkit',
    'SALTO-Youth', 'Tatami Talks',
    'online', '', '', true, array['human_rights', 'health'],
    '2026-10-19', '2026-10-20', '2026-10-20', 'full',
    'https://www.salto-youth.net/tools/european-training-calendar/training/webinar-presentation-of-the-consent-toolkit.15418/',
    'Consent for Youth layihəsində hazırlanmış, razılıq təhsili, münasibətlər və prevensiya üzrə 15-dən çox praktik alətdən ibarət toolkit-in onlayn təqdimatı (20 oktyabr, 15:00–16:00 CET). Gənclər işçiləri, pedaqoqlar və trenerlər üçündür. İştirak pulsuzdur.',
    '', ''
  ),
  (
    'Advocacy and Lobbying for international youth work',
    'Erasmus+', 'SALTO Eastern Europe and Caucasus, with SALTO EuroMed and the German National Agency for Erasmus+ Youth',
    'training', 'Moldova', 'Kişinyov', false, array['education', 'human_rights'],
    '2026-10-20', '2026-11-17', '2027-04-16', 'partial',
    'https://www.salto-youth.net/tools/european-training-calendar/training/advocacy-and-lobbying-for-international-youth-work.15394/',
    'Beynəlxalq gənclər əməkdaşlığının müdafiəsi və lobbiçilik üzrə təlim: 4 onlayn görüş, 15–20 mart 2027-də Moldovada seminar və aprel ayında yekun onlayn görüş. Erasmus+/ESC-də ən azı 3 layihəni koordinasiya etmiş, 18 yaşdan yuxarı gənclər təşkilatı nümayəndələri üçündür. Yaşayış və yemək qarşılanır; yol xərcini Milli Agentlik və ya regional SALTO ödəyir, iştirak haqqı ölkəyə görə dəyişir.',
    '', ''
  ),
  (
    'Massive Open Online Course on European Solidarity Corps 2026',
    'SALTO-Youth', 'Léargas and SALTO European Solidarity Corps Resource Centre',
    'online', '', '', true, array['education'],
    '2026-10-24', '2026-10-26', '2026-11-30', 'full',
    'https://www.salto-youth.net/tools/european-training-calendar/training/massive-open-online-course-on-european-solidarity-corps-2026.15416/',
    'Avropa Həmrəylik Korpusunun imkanlarını (könüllülük və həmrəylik layihələri, qrant müraciəti, Keyfiyyət Nişanı, humanitar yardım) tanıdan 8 həftəlik pulsuz kütləvi onlayn kurs. Materiallar ingilis dilindədir, çoxu ispan, italyan, alman və türk dillərinə tərcümə olunub. Kursu bitirənlərə Youthpass və rəqəmsal nişanlar verilir.',
    '', ''
  ),
  (
    'IN.PACT Final Event: Connecting People, Sharing Practices, Shaping Participation',
    'SALTO-Youth', 'Asociación Mundus - Un Mundo a tus Pies',
    'online', '', '', true, array['education', 'inclusion'],
    '2026-10-25', '2026-10-28', '2026-10-28', 'full',
    'https://www.salto-youth.net/tools/european-training-calendar/training/in-pact-final-event-connecting-people-sharing-practices-shaping-participation.15426/',
    'Gənclərin iştirakı və fasilitasiya üzrə IN.PACT layihəsinin nəticələrini (iştirakçı laboratoriya təlimatları, onlayn fasilitator kursu, təcrübələr xəritəsi) təqdim edən 2 saatlıq onlayn yekun tədbir və seminar (28 oktyabr, 14:00–16:00 CET, Zoom). Gənclər işçiləri, trenerlər və gənc liderlər üçündür. İştirak pulsuzdur.',
    '', ''
  ),
  (
    'Action for Peace',
    'UWC Spain', 'UWC Spain',
    'seminar', 'İspaniya', 'Toledo', false, array['peace'],
    '2026-10-31', '2026-12-04', '2026-12-08', 'none',
    'https://www.salto-youth.net/tools/european-training-calendar/training/action-for-peace.15413/',
    'UWC Spain-in 2009–2011-ci illərdə doğulmuş gənclər üçün sülh quruculuğu, münaqişə transformasiyası və liderlik mövzusunda ingilis və ispan dillərində 5 günlük proqramı. İştirak haqqı 470 avrodur (yaşayış, yemək və fəaliyyətlər daxil); Madridə qədər yol xərcini iştirakçı ödəyir. Ehtiyacı olanlar üçün 10 təqaüd var.',
    '', ''
  ),
  (
    'Equal Ground Q1: Meaningful Participation — Beyond the Seat at the Table',
    'SALTO-Youth', 'European Network of Refugee, Migrant and Stateless Changemakers (ENRMSC)',
    'online', '', '', true, array['inclusion', 'human_rights'],
    '2026-11-09', '2026-11-10', '2026-11-10', 'full',
    'https://www.salto-youth.net/tools/european-training-calendar/training/equal-ground-q1-meaningful-participation-beyond-the-seat-at-the-table.15397/',
    'Qaçqın, miqrant və vətəndaşlığı olmayan insanların qərarların qəbuluna mənalı iştirakı mövzusunda 2 saatlıq onlayn dialoq seminarı (10 noyabr, 14:00–16:00 CET, Microsoft Teams). Gənclər işçiləri, trenerlər, gənc liderlər və QHT əməkdaşları üçündür. İştirak pulsuzdur.',
    '', ''
  ),
  (
    'Global Solvers Accelerator_GSA_2027',
    'Melton Foundation', 'Melton Foundation',
    'other', 'Almaniya', '', false, array['entrepreneurship', 'environment'],
    '2026-11-15', '2027-04-01', '2027-11-30', 'partial',
    'https://www.salto-youth.net/tools/european-training-calendar/training/global-solvers-accelerator-gsa-2027.15353/',
    'SDG-lərlə bağlı fəal layihəsi olan 20–35 yaşlı dəyişiklik təşəbbüskarları üçün onlayn həmyaşıd öyrənmə proqramı (1 aprel – 30 noyabr 2027), 3–10 iyul 2027-də Almaniyada bir həftəlik əyani Co-Lab ilə. Proqram haqqı 900 ABŞ dollarıdır (ehtiyac olduqda 20–80% təqaüd var); Almaniyadakı görüş üçün yol, yaşayış və yemək xərcləri qarşılanır.',
    '', ''
  ),
  (
    'STAGE — Staging Tools for Awareness, Growth & Expression',
    'Erasmus+', 'Red Europea Los Jóvenes Importan Ahora',
    'training', 'İspaniya', 'Caravaca de la Cruz', false, array['health', 'culture_arts'],
    '2026-11-15', '2027-02-28', '2027-04-25', 'partial',
    'https://www.salto-youth.net/tools/european-training-calendar/training/stage-staging-tools-for-awareness-growth-expression.15417/',
    'Gənclərin psixi sağlamlığı üçün bədən və teatr əsaslı metodları öyrədən iki modullu təlim kursu (28 fevral–7 mart və 18–25 aprel 2027, aralıqda onlayn supervizya). Gənclər işçiləri, gənc liderlər və trenerlər üçündür. Yaşayış və yemək qarşılanır, yol xərci limit daxilində ödənilir; iştirak haqqı hər modul üçün 150 avrodur, imkanı az olanlar azaddır.',
    '', ''
  ),
  (
    'Democracy Reloading Webinars 2026: Developing youth participation in municipal decisions',
    'Erasmus+', 'Democracy Reloading Partnership (co-organiser: Bureau International Jeunesse)',
    'online', '', '', true, array['human_rights', 'education'],
    '2026-11-22', '2026-11-25', '2026-11-25', 'full',
    'https://www.salto-youth.net/tools/european-training-calendar/training/democracy-reloading-webinars-2026-developing-youth-participation-in-municipal-decisions.14419/',
    'Bələdiyyə qərarlarında gənclərin iştirakının inkişafına həsr olunmuş onlayn vebinar seriyası; seriyanın qalan sonuncu vebinarı 25 noyabr 2026-cı ildə 15:00–16:30 (CET) arasında keçiriləcək. Gənclər işçiləri, gənc liderlər, gənclər siyasəti üzrə mütəxəssislər və bələdiyyə əməkdaşları üçündür. İştirak pulsuzdur, iş dili ingilis dilidir.',
    '', ''
  ),
  -- European Solidarity Corps volunteering (European Youth Portal) (16)
  (
    'Youth and Sports Volunteers in Taekwondo (Training Camp)',
    'European Solidarity Corps', 'TURKIYE TAEKWONDO FEDERASYONU',
    'volunteering', 'Türkiyə', 'Ankara', false, array['sports', 'health'],
    '2026-10-13', '2026-11-10', '2026-11-26', 'full',
    'https://youth.europa.eu/solidarity/opportunity/54753_en',
    'Ankarada Türkiyə Taekvondo Federasiyasının milli komanda təlim düşərgələrində 16 könüllü üçün komanda könüllülüyü: məşq sahələrinin və avadanlığın hazırlanması, logistika, idmançılara və məşqçilərə dəstək. Təcrübə tələb olunmur. Yaşayış, yemək və ya yemək pulu, gündəlik cib pulu verilir, yol xərcləri layihə qaydalarına uyğun ödənilir.',
    '', ''
  ),
  (
    'ESC Creative Rural Lab – Purchena',
    'European Solidarity Corps', 'AYUNTAMIENTO DE PURCHENA',
    'volunteering', 'İspaniya', 'Purchena', false, array['culture_arts', 'digital', 'education'],
    '2026-10-15', '2026-12-01', '2027-11-30', 'full',
    'https://youth.europa.eu/solidarity/opportunity/54502_en',
    'Purchena kəndində 12 aylıq ESC layihəsi: beş könüllü kitabxana, məktəblər, uşaq mərkəzi və yerli təşkilatlarla birgə yaradıcı, rəqəmsal və təhsil emalatxanaları keçirəcək. 18–30 yaş, yaxşı ingilis və ən azı əsas ispan dili tələb olunur. Yaşayış, yemək və cib pulu verilir, yol xərcləri ESC qaydalarına görə ödənilir, sığorta və dil dəstəyi daxildir.',
    '', ''
  ),
  (
    'You FuTuRe (30 DAYS TEAM VOLUNTEERING)',
    'European Solidarity Corps', 'SORGUN GENCLIK DERNEGI',
    'volunteering', 'Türkiyə', 'Sorgun', false, array['environment', 'education'],
    '2026-10-15', null, null, 'full',
    'https://youth.europa.eu/solidarity/opportunity/54701_en',
    'Sorgunda (Yozgat) 30 günlük komanda könüllülüyü: 10 nəfərlik komanda fəlakətlərə hazırlıq, iqlim dəyişikliyi və ilk yardım üzrə təlim keçir, sonra yerli uşaqlar, gənclər və böyüklər üçün maarifləndirici tədbirlər təşkil edir. Paylaşılan mənzildə yaşayış, gündə 6 avro cib pulu və 6 avro yemək pulu verilir, yol xərcləri ödənilir.',
    '', ''
  ),
  (
    '2-Month Short-Term Volunteering in Sorgun',
    'European Solidarity Corps', 'SORGUN GENCLIK DERNEGI',
    'volunteering', 'Türkiyə', 'Sorgun', false, array['education', 'culture_arts', 'environment'],
    '2026-10-15', '2026-11-01', '2026-12-25', 'full',
    'https://youth.europa.eu/solidarity/opportunity/54751_en',
    'Sorgun Gənclik Dərnəyində (SORGED) 2 aylıq qısamüddətli könüllülük: gənclər üçün emalatxanalar, dil klubları, idman tədbirləri və maarifləndirmə kampaniyaları, sosial media və foto-video məzmun hazırlanması. Paylaşılan mənzildə yaşayış, gündə 6 avro cib pulu və 6 avro yemək pulu verilir, yol xərcləri ESC məsafə kalkulyatoruna görə ödənilir.',
    '', ''
  ),
  (
    'Broaden our horizons 2026/27',
    'European Solidarity Corps', 'CENTRUM INICJATYW MIEDZYKULTUROWYCH HORYZONTY',
    'volunteering', 'Polşa', 'Poznan', false, array['education', 'culture_arts', 'human_rights'],
    '2026-10-15', '2026-09-11', '2027-09-09', 'full',
    'https://youth.europa.eu/solidarity/opportunity/50513_en',
    'Poznanda mədəniyyətlərarası təşkilatda 30 həftəlik könüllülük: uşaqlar, böyüklər və yaşlılar üçün qeyri-formal təhsil və dil dərsləri, mədəni tədbirlərin təşkili, sosial media və ofis işləri. Müraciət üçün infopakdakı Google formu doldurulmalıdır. Yataqxanada fərdi otaq, gündə 10 avro cib və yemək pulu, yerli nəqliyyat kartı verilir, yol xərcləri ESC limitləri daxilində ödənilir.',
    '', ''
  ),
  (
    'Creative Connections 2.0',
    'European Solidarity Corps', 'Fondatsiya "Tsennosti, dobrodeteli, integritet"',
    'volunteering', 'Bolqarıstan', 'Sofiya', false, array['culture_arts', 'inclusion', 'education'],
    '2026-10-17', '2026-11-10', '2027-03-14', 'full',
    'https://youth.europa.eu/solidarity/opportunity/47384_en',
    'Sofiyada 22 həftəlik könüllülük: incəsənət vasitəsilə sosial inklüziya, tolerantlıq və mədəniyyətlərarası anlaşma mövzusunda tədbir və emalatxanaların təşkili. 18–30 yaş, işçi səviyyədə ingilis dili tələb olunur. Paylaşılan mənzil, gündə 5 avro yemək və 7 avro cib pulu verilir, yol xərcləri məsafəyə görə limit daxilində ödənilir.',
    '', ''
  ),
  (
    'EcoSpark: ESC volunteering in Timișoara (call for Albania, Azerbaijan, Georgia, Moldova, Serbia)',
    'European Solidarity Corps', 'Asociatia Alternativa Eco',
    'volunteering', 'Rumıniya', 'Timişoara', false, array['environment', 'education', 'inclusion'],
    '2026-10-19', '2026-10-12', '2027-10-11', 'full',
    'https://youth.europa.eu/solidarity/opportunity/54726_en',
    'Timişoarada 6–12 aylıq ESC könüllülüyü: məktəb və bağçalarda qeyri-formal təhsil, ekoloji kampaniyalar, sosial inklüziya və rəqəmsal təhsil. Bu elan Albaniya, Azərbaycan, Gürcüstan, Moldova və Serbiyadan olan 18–30 yaşlı, ən azı B1 ingilis dili bilənlər üçündür. Yaşayış, gündə 5 avro yemək və 4 avro cib pulu, yerli nəqliyyat, sığorta və rumın dili kursu təmin edilir, yol xərci 211–395 avro ödənilir.',
    '', ''
  ),
  (
    'Volunteer for nature 2027',
    'European Solidarity Corps', 'Udruga Biom',
    'volunteering', 'Xorvatiya', 'Zaqreb', false, array['environment'],
    '2026-10-25', '2027-03-01', '2027-11-19', 'full',
    'https://youth.europa.eu/solidarity/opportunity/54644_en',
    'Zaqrebdə təbiəti mühafizə təşkilatında uzunmüddətli könüllülük: quşlar üzrə və digər sahə işləri, maarifləndirmə tədbirləri, təhsil məzmunu və ofis işləri. 18–30 yaş, ingilis və ya xorvat dili, çətin ərazidə işləmək üçün fiziki hazırlıq tələb olunur. Paylaşılan mənzil, ayda təxminən 510 avro cib və yemək pulu verilir, bütün yol xərcləri ödənilir.',
    '', ''
  ),
  (
    'AGESDER Volunteers: long-term, January–May 2027 (Niğde)',
    'European Solidarity Corps', 'Avrupa Gençlik Eğitim ve Spor Derneği',
    'volunteering', 'Türkiyə', 'Niğdə', false, array['education', 'inclusion'],
    '2026-10-31', '2027-01-03', '2027-05-28', 'full',
    'https://youth.europa.eu/solidarity/opportunity/54036_en',
    'Niğdədə AGESDER dərnəyində 146 günlük uzunmüddətli könüllülük: ingilis dili danışıq klubu, təşkilatın Instagram hesabı üçün məzmun, öz maraq sahəsində fəaliyyətlər və sosial məsuliyyət layihələri. Yetkinlik yaşına çatmış olmaq tələb olunur. Yaşayış, yemək və nəqliyyat xərcləri layihə tərəfindən qarşılanır.',
    '', ''
  ),
  (
    'Join InterAktion - support youth exchanges and trainings for inclusion, human rights & sustainability',
    'European Solidarity Corps', 'InterAktion - Verein für ein interkulturelles Zusammenleben (via LOGO jugendmanagement gemeinnützige gmbh)',
    'volunteering', 'Avstriya', 'Qrats', false, array['inclusion', 'human_rights', 'education'],
    '2026-11-01', '2027-01-04', '2027-12-31', 'partial',
    'https://youth.europa.eu/solidarity/opportunity/54337_en',
    'Qratsda InterAktion təşkilatında 44 həftəlik könüllülük: xüsusilə az imkanlı gənclər üçün emalatxanalara, təlimlərə və gənclər mübadilələrinə dəstək, kiçik tədbirlər və şəxsi layihə. Müraciət www.logo.at/esc saytındakı sistem vasitəsilə edilir. Tələbə yataqxanasında fərdi otaq, ayda 330 avro yemək və 210 avro cib pulu verilir.',
    '', ''
  ),
  (
    'Individual volunteering at Gaziantep Islamic Science and Technology University',
    'European Solidarity Corps', 'Gaziantep Islam Science and Technology University',
    'volunteering', 'Türkiyə', 'Qaziantep', false, array['inclusion', 'environment', 'education'],
    '2026-11-10', '2026-11-30', '2027-01-25', 'partial',
    'https://youth.europa.eu/solidarity/opportunity/54633_en',
    'Qaziantep İslam Elm və Texnologiya Universitetində 8 həftəlik könüllülük: tələbələr, yerli icma və qaçqınlarla mədəniyyətlərarası, ekoloji və idman fəaliyyətləri. 18–30 yaş, əsas ingilis dili tələb olunur. Paylaşılan yaşayış, aylıq yemək pulu, gündə 6 avro cib pulu, yerli nəqliyyat və türk dili dəstəyi təmin edilir.',
    '', ''
  ),
  (
    'Deep into Life III 12/2026',
    'European Solidarity Corps', 'GRUENER GRASHALM e.V.',
    'volunteering', 'Almaniya', 'Fahren (Zurow)', false, array['environment', 'education'],
    '2026-11-14', '2026-12-01', '2026-12-26', 'partial',
    'https://youth.europa.eu/solidarity/opportunity/54434_en',
    'Almaniyanın Fahren kəndində 18–30 yaşlı gənclər üçün komanda könüllülüyü: landşaft baxımı, ağac emalı, layihə ərazisinə qulluq və liderlik təlimləri. Təcrübə tələb olunmur, müraciət yalnız səhifədəki Google formu ilə qəbul edilir. Yaşayış və yemək tam təmin edilir, Deutschlandticket ilə yerli və regional nəqliyyatdan istifadə mümkündür.',
    '', ''
  ),
  (
    'Long-term volunteering in Kindergarten "Namins"/LATVIA',
    'European Solidarity Corps', 'EUROPEAN ASSOCIATION WORLD-OUR HOME',
    'volunteering', 'Latviya', 'Rezekne', false, array['education'],
    '2026-11-15', '2025-12-15', '2027-11-25', 'full',
    'https://youth.europa.eu/solidarity/opportunity/48943_en',
    'Rezekne şəhərindəki ''Namiņš'' uşaq bağçasında 48 həftəlik könüllülük: müəllimlərə kömək, uşaqlarla iş və Latviya təhsil sistemi ilə tanışlıq, iş günü 6 saatdır. Ən azı B1 ingilis dili tələb olunur. Mənzil təmin edilir, ayda 150 avro yemək pulu, gündə 5 avro cib pulu verilir, yol xərci 309 avroya qədər ödənilir.',
    '', ''
  ),
  (
    'EcoSpark: ESC volunteering in Timișoara',
    'European Solidarity Corps', 'Asociatia Alternativa Eco',
    'volunteering', 'Rumıniya', 'Timişoara', false, array['environment', 'education', 'inclusion'],
    '2026-11-16', '2026-09-18', '2027-09-17', 'full',
    'https://youth.europa.eu/solidarity/opportunity/54360_en',
    'Timişoarada 6–12 aylıq ESC könüllülüyü: məktəb və bağçalarda qeyri-formal təhsil, ekoloji kampaniyalar, sosial inklüziya və rəqəmsal təhsil, mədəni tədbirlər. 18–30 yaş, ən azı B1 ingilis dili və könüllülük təcrübəsi tələb olunur. Yaşayış, gündə 5 avro yemək və 4 avro cib pulu, yerli nəqliyyat, sığorta və rumın dili kursu təmin edilir, yol xərci 211–395 avro ödənilir.',
    '', ''
  ),
  (
    'AGESDER Volunteers: 2 months, February–April 2027 (Niğde)',
    'European Solidarity Corps', 'Avrupa Gençlik Eğitim ve Spor Derneği',
    'volunteering', 'Türkiyə', 'Niğdə', false, array['education', 'inclusion'],
    '2026-12-31', '2027-02-17', '2027-04-16', 'full',
    'https://youth.europa.eu/solidarity/opportunity/54038_en',
    'Niğdədə AGESDER dərnəyində 59 günlük qısamüddətli könüllülük (fevral–aprel 2027): ingilis dili danışıq klubu, Instagram üçün məzmun, öz maraq sahəsində fəaliyyətlər və sosial məsuliyyət layihələri. Yetkinlik yaşına çatmış olmaq tələb olunur. Yaşayış, yemək və nəqliyyat xərcləri layihə tərəfindən qarşılanır.',
    '', ''
  ),
  (
    'AGESDER Volunteers: 2 months, May–July 2027 (Niğde)',
    'European Solidarity Corps', 'Avrupa Gençlik Eğitim ve Spor Derneği',
    'volunteering', 'Türkiyə', 'Niğdə', false, array['education', 'inclusion'],
    '2027-02-28', '2027-05-04', '2027-07-01', 'full',
    'https://youth.europa.eu/solidarity/opportunity/54043_en',
    'Niğdədə AGESDER dərnəyində 59 günlük qısamüddətli könüllülük (may–iyul 2027): ingilis dili danışıq klubu, Instagram üçün məzmun, öz maraq sahəsində fəaliyyətlər və sosial məsuliyyət layihələri. Yetkinlik yaşına çatmış olmaq tələb olunur. Yaşayış, yemək və nəqliyyat xərcləri layihə tərəfindən qarşılanır.',
    '', ''
  ),
  -- Council of Europe, EU and UN calls, contests and online courses (9)
  (
    'JINR INTEREST Programme, Wave 15 (online research projects)',
    'JINR', 'Joint Institute for Nuclear Research (JINR) University Centre',
    'online', '', '', true, array['education', 'digital'],
    '2026-10-16', '2026-10-26', '2026-12-04', 'full',
    'https://www.jinr.ru/posts/registration-for-wave-15-of-interest-programme-opened/',
    'Birləşmiş Nüvə Tədqiqatları İnstitutunun (Dubna) onlayn tədqiqat proqramı: iştirakçılar institut mütəxəssislərinin rəhbərliyi ilə seçdikləri elmi layihə üzərində işləyirlər. 31 yaşadək elm, mühəndislik və İT ixtisasları üzrə bakalavr, magistr və doktorantlar üçündür, iş dili ingilis dilidir. İştirak ödənişsizdir, iştirakçılara ödəniş edilmir.',
    '', ''
  ),
  (
    'HEY Tutored Online Course on Environment',
    'Council of Europe', 'North-South Centre of the Council of Europe',
    'online', '', '', true, array['environment', 'human_rights'],
    '2026-10-18', '2026-10-28', '2026-11-24', 'full',
    'https://www.coe.int/en/web/north-south-centre/-/applications-open-for-the-hey-tutored-online-course-on-environment',
    'İnsan hüquqları ilə ətraf mühit arasındakı əlaqəni (iqlim ədaləti, iqlim məhkəmələri, vəkillik) öyrədən təlimçi müşayiətli onlayn kurs, ingilis dilində. Avropa Şurasının 46 üzv ölkəsindən, eləcə də Afrika və Yaxın Şərqdən 30 yaşadək fəal gənclər üçündür, 50 nəfər seçilir. İştirak pulsuzdur.',
    '', ''
  ),
  (
    'HSC Youth Ambassador Program 2027 (Hamburg Sustainability Conference)',
    'Hamburg Sustainability Conference', 'Hamburg Sustainability Conference (joint initiative of BMZ, UNDP, the City of Hamburg and the Michael Otto Foundation)',
    'other', 'Almaniya', 'Hamburq', false, array['environment', 'entrepreneurship'],
    '2026-10-19', '2026-12-07', '2027-06-01', 'full',
    'https://www.sustainability-conference.org/en/hsc27youthform',
    'Hamburq Davamlılıq Konfransının gənc səfirlər proqramı: dekabrda tərəfdaş ölkədə dəyirmi masalar və 31 may - 1 iyun 2027-ci ildə Hamburqda konfransda iştirak. OECD-nin ODA alan ölkələrindən olan və orada yaşayan, davamlılıq sahəsində layihəsi olan 18-30 yaşlı gənclər üçündür, ingilis dili tələb olunur. İştirak tam maliyyələşdirilir: yol və yaşayış xərcləri qarşılanır.',
    '', ''
  ),
  (
    'World Food Day Poster Contest 2026 (ages 5–19)',
    'FAO', 'Food and Agriculture Organization of the United Nations (FAO)',
    'online', '', '', true, array['environment', 'culture_arts'],
    '2026-11-06', null, null, 'full',
    'https://www.fao.org/world-food-day/contest/en',
    'FAO-nun Ümumdünya Ərzaq Günü ilə bağlı "Innovate today. Nourish tomorrow." mövzusunda plakat müsabiqəsi, işlər onlayn forma ilə yüklənir. Dünyanın istənilən yerində yaşayan 5-19 yaşlı uşaq və gənclər üçündür, 16-19 yaş üçün ayrıca kateqoriya var. Qaliblərə sertifikat və hədiyyə paketi verilir, iştirak pulsuzdur.',
    '', ''
  ),
  (
    'EU4Digital Academy: Cybersecurity online course (in Azerbaijani)',
    'EU4Digital', 'EU4Digital Facility (EU-funded), course by MinnaLearn',
    'online', '', '', true, array['digital'],
    '2026-12-31', null, null, 'full',
    'https://euneighbourseast.eu/opportunities/azerbaijani-cybersecurity-course-now-available-from-eu4digital-academy/',
    'Aİ-nin maliyyələşdirdiyi EU4Digital Akademiyasının kibertəhlükəsizlik üzrə öz tempində keçilən onlayn kursu, Azərbaycan dilində mövcuddur və təxminən beş saat çəkir. Mütəxəssis olmayanlar, fərdlər və kiçik bizneslər üçündür, kurs ödənişsizdir və bitirənlərə rəqəmsal nişan verilir.',
    '', ''
  ),
  (
    'EU4Digital Academy: Digital Marketing Essentials online course (in Azerbaijani)',
    'EU4Digital', 'EU4Digital Facility (EU-funded), course by the Digital Marketing Institute',
    'online', '', '', true, array['digital', 'entrepreneurship'],
    '2026-12-31', null, null, 'full',
    'https://euneighbourseast.eu/opportunities/eu4digital-academys-digital-marketing-essentials-now-available-in-eastern-partner-languages/',
    'Rəqəmsal marketinqin əsasları üzrə öz tempində keçilən, altı saatadək çəkən onlayn kurs, Azərbaycan dilində də mövcuddur. Şərq Tərəfdaşlığı ölkələrinin vətəndaşları üçün qeydiyyatla ödənişsizdir və sonda EU4Digital sertifikatı verilir. İstəyə görə əlavə DMI imtahanı 40 avrodur.',
    '', ''
  ),
  (
    'eCommerce in EU Marketplaces: self-paced online course (in Azerbaijani)',
    'EU4Digital', 'EU4Digital Facility (EU-funded)',
    'online', '', '', true, array['entrepreneurship', 'digital'],
    '2026-12-31', null, null, 'full',
    'https://euneighbourseast.eu/opportunities/ecommerce-in-eu-marketplaces-self-paced-online-course-in-armenian-azerbaijani-georgian-romanian-and-ukrainian/',
    'Aİ bazarlarında (eMAG, Amazon, eBay) onlayn satışa başlamağı, ƏDV və gömrük qaydalarını izah edən 10 saatlıq öz tempində keçilən onlayn kurs, Azərbaycan dilində mövcuddur. Vətəndaşlar və kiçik və orta sahibkarlar üçündür, kurs ödənişsizdir və atingi platformasında qeydiyyat tələb edir.',
    '', ''
  ),
  (
    'Introduction to the Green Economy: e-learning course (in Azerbaijani)',
    'EU4Environment', 'UNEP and UNITAR under the EU-funded EU4Environment programme',
    'online', '', '', true, array['environment', 'education'],
    '2026-12-31', null, null, 'full',
    'https://euneighbourseast.eu/opportunities/new-e-learning-course-introduction-to-the-green-economy-in-azerbaijan/',
    'UNEP və UNITAR-ın EU4Environment proqramı çərçivəsində hazırladığı 10 saatlıq "Yaşıl iqtisadiyyata giriş" onlayn kursu, öz tempində keçilir və beş moduldan ibarətdir. Siyasətçilər, biznes və geniş ictimaiyyət üçün açıqdır, ödənişsizdir və bitirənlərə sertifikat verilir.',
    '', ''
  ),
  (
    'EU4Culture: online grant writing course for creative professionals',
    'EU4Culture', 'EU4Culture (EU-funded; Goethe-Institut-led consortium), hosted on cases.media',
    'online', '', '', true, array['culture_arts', 'education'],
    '2027-12-31', null, null, 'full',
    'https://euneighbourseast.eu/opportunities/eu4culture-online-grant-writing-course-for-creative-professionals-from-eastern-partner-countries/',
    'Mədəni layihələr üçün qrant müraciəti yazmağı öyrədən Aİ-nin maliyyələşdirdiyi onlayn video kurs: qrant növləri, büdcə hazırlığı, donorlarla ünsiyyət və hesabat mövzularını əhatə edir. İngilis dilində videolardır, Azərbaycan dilində altyazı var. Kurs 2027-ci ilin sonunadək cases.media platformasında pulsuzdur.',
    '', ''
  ),
  -- International programmes, conferences and fellowships (8)
  (
    'JINR START Programme – Winter Session 2027 (Dubna)',
    'JINR', 'Joint Institute for Nuclear Research (JINR)',
    'other', 'Rusiya', 'Dubna', false, array['education', 'digital'],
    '2026-10-16', '2027-02-14', '2027-06-26', 'full',
    'https://start.jinr.ru/?session_id=10',
    'Birləşmiş Nüvə Tədqiqatları İnstitutunda (Dubna) 6–8 həftəlik elmi təcrübə proqramı; seçilənlər 14 fevral – 26 iyun 2027 aralığında dəvət olunur. 30 yaşdan kiçik, bakalavrın son kurslarından doktoranturanın 1-ci ilinədək olan və JINR-in elm sahələrində təhsil alan tələbələr üçündür. Yataqxana pulsuzdur, gündəlik 2000 rubl ödənilir, yol, viza və sığorta xərcləri kompensasiya olunur.',
    '', ''
  ),
  (
    'AIxBio Fellowship – Winter 2027',
    'AIxBio Fellowship', 'ERA, in partnership with the Cambridge Biosecurity Hub',
    'other', 'Böyük Britaniya', 'Kembric', false, array['health', 'digital'],
    '2026-10-19', '2027-01-18', '2027-03-26', 'partial',
    'https://www.aixbiosecurity.com/fellowship',
    'Kembricdə süni intellekt və biotəhlükəsizliyin kəsişməsində 10 həftəlik tam ştatlı təqaüd proqramı; tədqiqat, yerləşdirmə və təsisçi istiqamətləri var. 18 yaşdan yuxarı hər kəs müraciət edə bilər, rəsmi tədqiqat təcrübəsi tələb olunmur. Ümumilikdə 10 000 funt təqaüd verilir, yol və viza xərcləri qarşılanır, iş saatlarında yemək təmin olunur.',
    '', ''
  ),
  (
    'AI Safety Research Fellowship 2027',
    'Pivotal Research', 'Pivotal Research',
    'other', 'Böyük Britaniya', 'London', false, array['digital'],
    '2026-11-01', '2027-01-18', '2027-04-30', 'full',
    'https://www.pivotal-research.org/fellowships/ai-safety-fellowship',
    'Londonda (LISA) süni intellekt təhlükəsizliyi üzrə 15 həftəlik tam ştatlı, əyani tədqiqat təqaüdü, həftəlik fərdi mentorluqla. 18 yaşdan yuxarı hər kəs müraciət edə bilər; əsas meyar motivasiya və bacarıqdır, Böyük Britaniyaya giriş tələblərini iştirakçı özü təmin etməlidir. 15 000–18 000 funt təqaüd, Londondan kənarda yaşayanlara aylıq 1800 funt mənzil dəstəyi, London səfəri və iş günlərində nahar və şam yeməyi təmin olunur.',
    '', ''
  ),
  (
    'Global Leadership Challenge 2026 (University of Oxford & St. Gallen Symposium)',
    'Global Leadership Challenge', 'University of Oxford (Oxford Character Project) and St. Gallen Symposium',
    'online', '', '', true, array['education', 'entrepreneurship'],
    '2026-11-05', '2026-12-10', '2026-12-14', 'unknown',
    'https://www.leadership-challenge.org/applynow',
    'Oksford Universiteti və St. Gallen Simpoziumunun birgə onlayn liderlik müsabiqəsi: iştirakçılar 10–14 dekabr 2026 tarixlərində təxminən beş yarımgün qlobal problemlər üzrə komanda layihələri üzərində işləyir. Magistr və doktorantlar, həmçinin bakalavr təhsilini bitirmiş 21–30 yaşlı gənc mütəxəssislər üçündür. Ən yaxşı üç komanda 2027-ci ilin aprelində 56-cı St. Gallen Simpoziumuna bütün xərcləri qarşılanmaqla dəvət olunur.',
    '', ''
  ),
  (
    'USTC International Winter Camp 2027',
    'USTC', 'University of Science and Technology of China (USTC)',
    'other', 'Çin', 'Hefey', false, array['education', 'culture_arts'],
    '2026-11-08', '2026-12-19', '2027-01-01', 'partial',
    'https://ic.ustc.edu.cn/?abroad=179',
    'Çin Elm və Texnologiya Universitetində (Hefey) beynəlxalq qış düşərgəsi. Çin vətəndaşı olmayan bakalavr və magistr tələbələri üçündür; əvvəllər USTC düşərgəsində iştirak edənlər müraciət edə bilməz. Proqram haqqı 3000 yuandır (təhsil, yaşayış və ekskursiyalar daxil; sığorta və yol xərcləri daxil deyil); seçilmiş tələbələrə USTC Fellowship ilə yol, sığorta, yaşayış və təqaüd dəstəyi verilə bilər.',
    '', ''
  ),
  (
    'EPFL Summer Research Program in Life Sciences 2027',
    'EPFL', 'EPFL School of Life Sciences',
    'other', 'İsveçrə', 'Lozanna', false, array['education', 'health'],
    '2026-11-15', '2027-07-05', '2027-08-27', 'full',
    'https://www.epfl.ch/schools/sv/education/summer-research-program/',
    'EPFL Həyat Elmləri Məktəbinin laboratoriyalarında 8 həftəlik yay tədqiqat proqramı. Biologiya, biofizika, kimya, biomühəndislik, bioinformatika və əlaqəli sahələrdə bakalavr və ya magistraturanın 1-ci ilində oxuyan tələbələr üçündür (doktorantlar müraciət edə bilməz). Yaşayış və gündəlik xərcləri qarşılayan 3600 CHF təqaüd verilir, uçuş xərcləri 1000 CHF-dək kompensasiya olunur, viza üçün kömək göstərilir.',
    '', ''
  ),
  (
    'Hansen Leadership Institute 2027',
    'Hansen Leadership Institute', 'Hansen Leadership Institute (Fred J. Hansen Foundation)',
    'other', 'ABŞ', '', false, array['peace', 'education'],
    '2027-01-15', '2027-06-29', '2027-07-20', 'full',
    'https://hansenleadershipinstitute.org/',
    'ABŞ-da üç həftəlik liderlik proqramı: dünyanın müxtəlif, o cümlədən münaqişə bölgələrindən olan gənc liderləri beynəlxalq əməkdaşlıq və sülh mövzusunda bir araya gətirir. 1 iyul 2027 tarixinə 20–25 yaşında olan, ən azı bir il universitetdə oxumuş və ya 2025–2026-cı illərdə məzun olmuş gənclər üçündür. Beynəlxalq aviabilet, yaşayış, yemək və proqram xərcləri fond tərəfindən qarşılanır; pasport xərcləri və cib pulu iştirakçıya aiddir.',
    '', ''
  ),
  (
    'Global Ideas Competition – 56th St. Gallen Symposium 2027',
    'St. Gallen Symposium', 'International Students'' Committee (ISC), St. Gallen Symposium',
    'other', 'İsveçrə', 'Sankt-Qallen', false, array['entrepreneurship', 'education'],
    '2027-02-01', '2027-04-27', '2027-04-29', 'full',
    'https://symposium.org/initiatives/global-ideas-competition/',
    'Magistratura və doktorantura tələbələri üçün beynəlxalq ideya müsabiqəsi: "What could we solve, if we could agree?" sualına həll təklifi və qısa video təqdim olunur, yalnız fərdi müraciət qəbul edilir. 1997-ci il və sonra doğulanlar müraciət edə bilər. Seçilənlər 56-cı St. Gallen Simpoziumuna "Leaders of Tomorrow" kimi dəvət olunur: iştirak pulsuzdur, yol, yemək və yaşayış qarşılanır, üç qalib 20 000 CHF mükafatı bölüşür.',
    '', ''
  ),
  -- Online volunteering, courses and competitions (18)
  (
    'Online Video Editor & Content Creator',
    'UN Volunteers', 'Rousto Charity, Tajikistan',
    'online', '', '', true, array['digital', 'education'],
    '2026-10-15', null, null, 'full',
    'https://app.unv.org/opportunities/1784888021272922',
    'Tacikistandakı Rousto Charity təşkilatının onlayn dərs yazılarından sosial şəbəkələr üçün qısa tanıtım videoları, xülasə videolar və subtitrlər hazırlamaq; 3 könüllü. Video montaj təcrübəsi (Premiere Pro, DaVinci Resolve və s.) və ingilis dili tələb olunur, portfolio arzuolunandır. Həftədə 11–15 saat, 12 həftə; 18 yaşdan yuxarı, iştirak pulsuzdur.',
    '', ''
  ),
  (
    'Support Digital Outreach for the Africa Volunteer Conference 2026',
    'UN Volunteers', 'Ministry of Youth and Gender Affairs, Botswana',
    'online', '', '', true, array['digital'],
    '2026-10-16', null, null, 'full',
    'https://app.unv.org/opportunities/1784888021272974',
    'Afrika Könüllülük Konfransı 2026 üçün rəqəmsal təşviq kampaniyası: təsdiqlənmiş materialları şəxsi sosial şəbəkələrdə paylaşmaq, mesajları yerli auditoriyaya uyğunlaşdırmaq və izləyicilərlə ünsiyyət qurmaq; 500 könüllü. Ən azı bir sosial şəbəkədə aktiv hesab və səlis ingilis dili tələb olunur. Həftədə 16–20 saat, 12 həftə; 18 yaşdan yuxarı, iştirak pulsuzdur.',
    '', ''
  ),
  (
    'Illustrate the content of a digital campaign for UNICEF@80',
    'UN Volunteers', 'UNICEF Algeria',
    'online', '', '', true, array['culture_arts'],
    '2026-10-18', null, null, 'full',
    'https://app.unv.org/opportunities/1784888021272952',
    'UNICEF Əlcəzair üçün UNICEF-in 80 illiyinə həsr olunmuş 10 orijinal rəqəmsal illüstrasiya hazırlamaq; 2 könüllü. Portfolio linki mütləqdir; Procreate, Illustrator, Photoshop kimi alətlərlə təcrübə və ingilis dili tələb olunur, fransız dili üstünlükdür. Həftədə 16–20 saat, 12 həftə; 18 yaşdan yuxarı, iştirak pulsuzdur.',
    '', ''
  ),
  (
    'Translation and Proofreading of First Responder Training from English to Russian',
    'UN Volunteers', 'UN Department of Safety and Security (UNDSS), Training and Development Section',
    'online', '', '', true, array['health'],
    '2026-10-19', null, null, 'full',
    'https://app.unv.org/opportunities/1784888021273025',
    'BMT Təhlükəsizlik Departamentinin (UNDSS) ilk yardım kursu IFAK 2.1 materiallarının (təxminən 30 000 söz) ingilis dilindən rus dilinə tərcüməsi və redaktəsi; 2 könüllü. Rus dili ana dili səviyyəsində, güclü ingilis dili tələb olunur, tərcümə təcrübəsi üstünlükdür. Həftədə 11–15 saat, 4 həftə; 18 yaşdan yuxarı, iştirak pulsuzdur.',
    '', ''
  ),
  (
    'Data Visualization and Storytelling',
    'UN Volunteers', 'UN Women Europe and Central Asia Regional Office (ECARO)',
    'online', '', '', true, array['digital', 'inclusion'],
    '2026-10-21', null, null, 'full',
    'https://app.unv.org/opportunities/1784888021273043',
    'BMT Qadınlar təşkilatının Avropa və Mərkəzi Asiya regional ofisi üçün gender statistikasını infoqrafika və vizual materiallara çevirmək, 16 günlük kampaniyaya dəstək. Dizayn, data vizuallaşdırma və ya kommunikasiya üzrə bakalavr dərəcəsi, ən azı 1 il təcrübə (Flourish, Datawrapper, Canva, Figma və s.) və səlis ingilis dili tələb olunur. Həftədə 16–20 saat, 12 həftə; 18 yaşdan yuxarı, pulsuz.',
    '', ''
  ),
  (
    'Data Analysis',
    'UN Volunteers', 'UN Women Europe and Central Asia Regional Office (ECARO)',
    'online', '', '', true, array['human_rights', 'digital'],
    '2026-10-21', null, null, 'full',
    'https://app.unv.org/opportunities/1784888021273040',
    'BMT Qadınlar təşkilatının Avropa və Mərkəzi Asiya regional ofisi üçün qadınlara qarşı zorakılıq və ədalətə çıxış üzrə məlumatları toplamaq, təhlil etmək və statistik xülasələr hazırlamaq. Statistika, iqtisadiyyat, data elmi və ya sosial elmlər üzrə bakalavr dərəcəsi, ən azı 2 il təcrübə və səlis ingilis dili tələb olunur. Həftədə 16–20 saat, 12 həftə; 18 yaşdan yuxarı, pulsuz.',
    '', ''
  ),
  (
    'Support Digital Advocacy for Innovation, Learning, Empowerment and AI for Good',
    'UN Volunteers', 'Action Lab for Development Association (ACTLAB)',
    'online', '', '', true, array['digital', 'education'],
    '2026-10-22', null, null, 'full',
    'https://app.unv.org/opportunities/1784888021273100',
    'Action Lab for Development-in təhsil, MoralityCode AI və məsuliyyətli süni intellekt təşəbbüsünə aid təsdiqlənmiş materiallarını sosial şəbəkələrdə paylaşmaq və onlayn icmalarla ünsiyyət qurmaq üçün 100 onlayn könüllü axtarılır. Səlis ingilis dili tələb olunur, fransız dili üstünlükdür. Həftədə 1–5 saat, 12 həftə; 18 yaşdan yuxarı, iştirak pulsuzdur.',
    '', ''
  ),
  (
    'Support Partnerships and Resource Mobilization Initiatives',
    'UN Volunteers', 'UN Office for Digital and Emerging Technologies (ODET)',
    'online', '', '', true, array['digital'],
    '2026-10-23', null, null, 'full',
    'https://app.unv.org/opportunities/1784888021272976',
    'BMT-nin ODET ofisi üçün 2027 BMT Texnologiyalar Konfransı və Açıq Mənbə təşəbbüsü üzrə potensial tərəfdaşların xəritələnməsi, sponsorluq paketləri və tərəfdaşlıq materiallarının hazırlanması; 3 könüllü. Araşdırma, tərəfdaşlıq və ünsiyyət bacarıqları və səlis ingilis dili tələb olunur. Həftədə 16–20 saat, 12 həftə; 18 yaşdan yuxarı, iştirak pulsuzdur.',
    '', ''
  ),
  (
    'Volunteer Online Green & Digital Skills Training Support',
    'UN Volunteers', 'UNDP Istanbul International Center for Private Sector in Development (IICPSD)',
    'online', '', '', true, array['environment', 'education', 'digital'],
    '2026-10-23', null, null, 'full',
    'https://app.unv.org/opportunities/1784888021272214',
    'UNDP-nin İstanbul Özəl Sektor İnkişafı Mərkəzi üçün 4 həftəlik Yaşıl və Rəqəmsal Bacarıqlar Təlim Proqramında təlim materialları hazırlamaq və onlayn sessiya aparmaq; 4 könüllü. Mühəndislik, enerji, davamlılıq, İT və ya oxşar sahədə ali təhsil, mövzu üzrə bilik və ingilis dili tələb olunur, türk dili üstünlükdür. Həftədə 6–10 saat, 3 həftə; 18 yaşdan yuxarı, iştirak pulsuzdur.',
    '', ''
  ),
  (
    'Build, Ship, Shape: Amazon Developer Hackathon',
    'Amazon Developer', 'Amazon Developer (administered by Devpost)',
    'online', '', '', true, array['digital'],
    '2026-10-23', null, null, 'full',
    'https://amazonappdev2026.devpost.com/',
    'Amazon Developer onlayn hakatonu: Fire TV, Alexa+ və digər Amazon developer alətləri ilə işlək tətbiq hazırlamaq və ya mövcud tətbiqi əhəmiyyətli dərəcədə yeniləmək. Yaşadığı ölkədə həddi-buluğ yaşına çatmış şəxslər fərdi və ya komanda ilə qatıla bilər; mükafat fondu 138 000 ABŞ dolları, iştirak pulsuzdur.',
    '', ''
  ),
  (
    'OpenCV AI Competition 2026, powered by AWS',
    'OpenCV', 'Open Source Vision Foundation (OpenCV) with Amazon Web Services',
    'online', '', '', true, array['digital'],
    '2026-10-26', null, null, 'unknown',
    'https://opencv26.devpost.com/',
    'OpenCV və AWS-in onlayn kompüter görməsi müsabiqəsi: OpenCV 5 və AWS ilə görmə əsaslı süni intellekt tətbiqi qurmaq, texniki hesabat və demo təqdim etmək. Devpost səhifəsində iştirakçıların yaşadığı ölkədə həddi-buluğ yaşına çatmış olması göstərilib; nağd mükafatlar cəmi 20 250 ABŞ dolları.',
    '', ''
  ),
  (
    'The GitLab Transcend Life After Code Hackathon',
    'GitLab', 'GitLab Inc. (administered by Devpost)',
    'online', '', '', true, array['digital'],
    '2026-10-27', null, null, 'full',
    'https://gitlab-transcend.devpost.com/',
    'GitLab-ın onlayn hakatonu: GitLab Duo Agent Platform ilə kod yazıldıqdan sonrakı proseslərin (CI/CD, yerləşdirmə və s.) süni intellektlə avtomatlaşdırılmasını göstərən layihə qurmaq. Yaşadığı ölkədə həddi-buluğ yaşına çatmış şəxslər üçündür, bəzi ölkələr istisnadır (Azərbaycan siyahıda yoxdur); mükafat fondu 45 000 ABŞ dolları, iştirak pulsuzdur.',
    '', ''
  ),
  (
    'Nebius x NVIDIA Global AI Hackathon',
    'Nebius x NVIDIA', 'Nebius B.V. with NVIDIA (administered by Devpost)',
    'online', '', '', true, array['digital'],
    '2026-10-30', null, null, 'full',
    'https://nebiusglobalaihackathon.devpost.com/',
    'Nebius və NVIDIA-nın onlayn süni intellekt hakatonu: Nebius Token Factory və ya Nebius AI Cloud üzərində işləyən və ən azı bir NVIDIA açıq mənbə modelindən istifadə edən tətbiq və ya agent yaratmaq. Yaşadığı ölkədə həddi-buluğ yaşına çatmış şəxslər fərdi və ya komanda ilə qatıla bilər; mükafat fondu 50 000 ABŞ dolları, iştirak pulsuzdur.',
    '', ''
  ),
  (
    'Bennington Young Creators Awards',
    'Bennington College', 'Bennington College (USA)',
    'online', '', '', true, array['culture_arts', 'education'],
    '2026-11-01', null, null, 'full',
    'https://www.bennington.edu/events/bennington-young-creators-awards',
    'Bennington College-in 9–12-ci sinif şagirdləri üçün beynəlxalq müsabiqəsi: yaradıcı yazı, incəsənət, musiqi, elm və innovasiya kateqoriyalarında işlər onlayn təqdim olunur. İştirak pulsuzdur, mükafatlar 2000 ABŞ dollarınadək nağd pul və Bennington-da təhsil alanlar üçün təqaüddür. Müəllim və ya mentorun dəstəyi tələb olunur.',
    '', ''
  ),
  (
    'PayPal AI Hackathon',
    'PayPal', 'PayPal Inc. (administered by Devpost)',
    'online', '', '', true, array['digital', 'entrepreneurship'],
    '2026-11-12', null, null, 'full',
    'https://paypalaihackathon.devpost.com/',
    'PayPal-ın onlayn hakatonu: PayPal developer platformasını (pulsuz sandbox) süni intellekt aləti ilə inteqrasiya edən işlək tətbiq və ya prototip hazırlamaq. Yaşadığı ölkədə həddi-buluğ yaşına çatmış şəxslər fərdi və ya komanda ilə qatıla bilər; mükafat fondu 67 500 ABŞ dolları, iştirak pulsuzdur.',
    '', ''
  ),
  (
    'Unearthodox’s Exploration Co-Lab 2027',
    'Unearthodox', 'Unearthodox',
    'online', '', '', true, array['environment', 'entrepreneurship'],
    '2026-11-16', '2027-03-01', '2027-12-31', 'unknown',
    'https://apply.younoodle.com/showcase/competition/edges_of_possibility_2027',
    'Təbiət və cəmiyyət problemlərinin kök səbəblərinə yönələn erkən mərhələli təşəbbüslər üçün 10 aylıq onlayn inkubasiya proqramı (mart–dekabr 2027). Seçilənlər 10 000 CHF qrant, kouçinq və həmyaşıd öyrənmə alır; ideya mərhələsini keçmiş təşəbbüs və ingilis dili tələb olunur, qrup zəngləri UTC−6 ilə UTC+6 arasında keçirilir.',
    '', ''
  ),
  (
    'The Earth Prize 2027',
    'The Earth Prize', 'The Earth Foundation',
    'online', '', '', true, array['environment', 'entrepreneurship', 'education'],
    '2027-01-10', null, null, 'unknown',
    'https://www.theearthprize.org/2027',
    '13–19 yaşlı şagirdlər üçün qlobal ekoloji davamlılıq müsabiqəsi: komandalar ətraf mühit problemlərinə həll layihəsi hazırlayıb onlayn təqdim edir. Qeydiyyat 10 yanvar 2027-dək, layihələrin təqdimatı 31 yanvar 2027-dək açıqdır; ümumi mükafat fondu 104 500 ABŞ dolları, yeddi regional qalibin hər biri 10 000 dollar alır.',
    '', ''
  ),
  (
    'Diamond Challenge 2027',
    'Diamond Challenge', 'Horn Entrepreneurship, University of Delaware',
    'online', '', '', true, array['entrepreneurship'],
    '2027-01-14', null, null, 'unknown',
    'https://diamondchallenge.org/competition/',
    '14–18 yaşlı lisey şagirdləri üçün biznes və sosial innovasiya müsabiqəsi: 2–4 nəfərlik komandalar yazılı konsepsiya və pitch videosunu onlayn platformada təqdim edir. Komandanın 21 yaşdan yuxarı bir məsləhətçisi olmalıdır; mükafat fondu 100 000 dollardan çoxdur, finalçılar ABŞ-da keçirilən Limitless World Summit-də şəxsən iştirak etməlidir.',
    '', ''
  ),
  -- In Azerbaijan (2)
  (
    'Azərbaycan Kibertəhlükəsizlik Mərkəzi: Technion ilə 6 aylıq təlim, yeni dalğa',
    'Azərbaycan Kibertəhlükəsizlik Mərkəzi', 'Azərbaycan Kibertəhlükəsizlik Mərkəzi (İnnovasiya və Rəqəmsal İnkişaf Agentliyi və Technion Texnologiya İnstitutu)',
    'training', 'Azərbaycan', '', false, array['digital', 'education'],
    '2026-11-08', null, null, 'full',
    'https://idda.az/az/xeberler/azerbaycan-kibertehlukesizlik-merkezinin-yeni-telim-dalgasina-qeydiyyat-basladi',
    'Technion Texnologiya İnstitutunun müəllimlərinin keçirdiyi 6 aylıq kibertəhlükəsizlik təlimi (Red Team və Blue Team qrupları). 17 yaşdan yuxarı, ingilis dili və baza İKT bilikləri olan Azərbaycan vətəndaşları üçündür, seçim imtahan və müsahibə ilə aparılır. Seçilən 60 nəfər təlimdə tam təqaüdlə iştirak edir və Technion sertifikatı alır.',
    '', ''
  ),
  (
    'AIR Center Autumn Call for Papers for young researchers',
    'AIR Center', 'Center for Analysis of International Relations and Multiculturalism (AIR Center)',
    'other', '', '', true, array['peace', 'education'],
    '2026-11-22', null, null, 'full',
    'https://aircenter.az/en/post/new-topic-added-to-the-autumn-call-for-papers-2255',
    'AIR Center-in gənc tədqiqatçılar üçün payız məqalə müsabiqəsi. Mövzular: TRIPP (Zəngəzur) dəhlizinin iqtisadi imkanları və Azərbaycanın xarici siyasətində “güc vasitəsilə sülh” yanaşması. Yalnız 29 yaşadək Azərbaycan vətəndaşları iştirak edə bilər; məqalə ingilis dilində, 2500-3000 söz həcmində e-poçtla göndərilir. Ən yaxşı üç məqalənin müəlliflərinə sertifikat və qonorar verilir, məqalələr Mərkəzin saytında dərc olunur.',
    '', ''
  )
) as v(title, program, organizer, kind, country, city, is_online, interests,
       deadline, start_date, end_date, costs, url, description, sending_org, sending_org_contact)
where not exists (select 1 from public.opportunities o where o.url = v.url);
