-- Real opportunities open to participants from Azerbaijan, taken from the
-- SALTO-Youth European Training Calendar (checked 29 September 2026: each
-- listing names Azerbaijan among the participating countries).
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- Safe to re-run: rows whose url already exists are skipped.
-- created_at is set one day back so free users see them right away
-- (new opportunities are otherwise Premium-only for 24 hours).

insert into public.opportunities
  (title, program, organizer, kind, country, city, is_online, interests,
   deadline, start_date, end_date, costs, url, description, published, created_at)
select v.title, v.program, '', v.kind, v.country, v.city, v.is_online, v.interests,
       v.deadline::date, v.start_date::date, v.end_date::date, v.costs, v.url, v.description, true,
       now() - interval '1 day'
from (values
  (
    'Online Training Course for Youth Centre Coordinators',
    'SALTO-Youth', 'online', '', '', true, array['inclusion', 'education'],
    '2026-10-09', '2026-10-12', '2026-10-31', 'full',
    'https://www.salto-youth.net/tools/european-training-calendar/training/online-training-course-for-youth-centre-coordinators.15368/',
    'İnklüziv gənclər mərkəzləri yaratmaq və idarə etmək üzrə onlayn kurs. Gənclər işçiləri, trenerlər, gənc liderlər və layihə menecerləri üçündür. İştirak pulsuzdur.'
  ),
  (
    'Final conference "Innovators lab: GenZs Game-Based Peacebuilding"',
    'Erasmus+', 'seminar', 'Bolqarıstan', 'Pernik', false, array['peace', 'education'],
    '2026-10-10', '2026-11-02', '2026-11-04', 'partial',
    'https://www.salto-youth.net/tools/european-training-calendar/training/final-conference-innovators-lab-genzs-game-based-peacebuilding.15360/',
    'Oyun əsaslı sülh quruculuğu metodlarını təqdim edən və 80 iştirakçını bir araya gətirən yekun konfrans. İştirak pulsuzdur: yaşayış və bütün yeməklər qarşılanır, yol xərci 120 avroya qədər ödənilir. Gənclər işçiləri, trenerlər və gənc liderlər üçündür.'
  ),
  (
    'Wellness Navigators - Webinar Series',
    'SALTO-Youth', 'online', '', '', true, array['health'],
    '2026-10-16', '2026-10-29', '2027-02-28', 'full',
    'https://www.salto-youth.net/tools/european-training-calendar/training/wellness-navigators-webinar-series.15262/',
    'Gənclərin rifahı (bədən, zehin, emosiyalar, əlaqələr) mövzusunda 6 pulsuz onlayn vebinar: praktik alətlər və təcrübi fəaliyyətlər. Gənclər işçiləri, trenerlər və mentorlar üçündür.'
  ),
  (
    'Online Partner Matching Lab for Youth Exchanges',
    'Erasmus+', 'online', '', '', true, array['education', 'inclusion'],
    '2026-10-18', '2026-11-04', '2026-11-04', 'full',
    'https://www.salto-youth.net/tools/european-training-calendar/training/online-partner-matching-lab-for-youth-exchanges.15361/',
    'Erasmus+ gənclər mübadiləsi üçün tərəfdaş təşkilat tapmağa kömək edən pulsuz onlayn görüş. Gənclər işçiləri, QHT əməkdaşları, könüllülər və gənclər üçündür.'
  ),
  (
    '"European Network for Mental Health of Youth" Partnership Building Activity',
    'Erasmus+', 'seminar', 'Polşa', 'Varşava', false, array['health'],
    '2026-10-18', '2026-11-21', '2026-11-29', 'partial',
    'https://www.salto-youth.net/tools/european-training-calendar/training/european-network-for-mental-health-of-youth-partnership-building-activity.15365/',
    'Gənclərin psixi sağlamlığı üzrə təcrübə mübadiləsi, beynəlxalq şəbəkələşmə və birgə Erasmus+ layihələri hazırlamaq üçün 7 günlük görüş. İştirak pulsuzdur: yaşayış, yemək və yerli nəqliyyat qarşılanır. 18 yaşdan yuxarı gənclər işçiləri və gənc liderlər üçündür.'
  ),
  (
    'Create with Makey Makey: Turning Everyday Objects into Interactive Learning',
    'SALTO-Youth', 'online', '', '', true, array['digital', 'education'],
    '2026-10-26', '2026-11-01', '2026-11-30', 'none',
    'https://www.salto-youth.net/tools/european-training-calendar/training/create-with-makey-makey-turning-everyday-objects-into-interactive-learning.15330/',
    'Makey Makey və STEAM yanaşmasını gənclərlə işə necə tətbiq etməyi öyrədən onlayn kurs (5E modeli). İştirak haqqı 50 avrodur. Gənclər işçiləri, müəllimlər və STEAM fasilitatorları üçündür.'
  ),
  (
    'Sustainable Project Management',
    'SALTO-Youth', 'online', '', '', true, array['environment', 'entrepreneurship'],
    '2026-10-29', '2026-11-05', '2026-11-26', 'full',
    'https://www.salto-youth.net/tools/european-training-calendar/training/sustainable-project-management.15391/',
    'Layihə idarəçiliyində ekoloji, sosial və iqtisadi davamlılıq mövzusunda 4 həftəlik pulsuz onlayn kurs. Gənclər işçiləri, trenerlər və layihə menecerləri üçündür.'
  ),
  (
    'Mental health in youth work Training Course',
    'SALTO-Youth', 'training', 'Belçika', 'Brüssel', false, array['health'],
    '2026-10-31', '2027-03-22', '2027-03-26', 'partial',
    'https://www.salto-youth.net/tools/european-training-calendar/training/mental-health-in-youth-work-training-course.15390/',
    'Gənclər işçilərinə gənclərin psixi sağlamlığını dəstəkləməyi və stiqmasız mühit yaratmağı öyrədən təlim kursu. İştirak pulsuzdur: yaşayış və yemək təşkilatçılar tərəfindən, yol xərci isə göndərən Milli Agentlik tərəfindən qarşılanır.'
  ),
  (
    'Strengthening Mentoring in the European Solidarity Corps. Training of Trainers and Multipliers',
    'European Solidarity Corps', 'training', 'Fransa', 'Paris', false, array['education'],
    '2026-11-04', '2027-02-08', '2027-02-13', 'partial',
    'https://www.salto-youth.net/tools/european-training-calendar/training/strengthening-mentoring-in-the-european-solidarity-corps-training-of-trainers-and-multipliers.15355/',
    'Avropa Həmrəylik Korpusu layihələrində mentorluğu gücləndirmək üçün trenerlər və mentorlar üçün təlim (15 yanvar 2027-də onlayn başlanğıc). Yaşayış və yemək qarşılanır; iştirak haqqı ölkəyə görə dəyişir.'
  ),
  (
    'Heritage Revised — New Media Approaches to Heritage Awareness in Youth Work',
    'SALTO-Youth', 'training', 'Rumıniya', '', false, array['culture_arts', 'digital'],
    '2027-05-31', '2027-08-23', '2027-08-29', 'none',
    'https://www.salto-youth.net/tools/european-training-calendar/training/heritage-revised-new-media-approaches-to-heritage-awareness-in-youth-work.15241/',
    'Mədəni irs təhsilində VR və AR kimi yeni texnologiyalardan istifadəni öyrədən təlim kursu. İştirak haqqı 70 avrodur; yaşayış, yemək və yol xərcləri qarşılanmır.'
  )
) as v(title, program, kind, country, city, is_online, interests, deadline, start_date, end_date, costs, url, description)
where not exists (select 1 from public.opportunities o where o.url = v.url);

-- Remove the test row from earlier, if it is still there:
delete from public.opportunities where title like 'TEST:%';
