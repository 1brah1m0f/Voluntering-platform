# Könüllülük mənbələri

Yoxlama tarixi: **18 oktyabr 2026**. 46 mənbə: **23 beynəlxalq, 23 yerli**.

Bu siyahı dünyadakı bütün platformaların tam inventarı deyil. Rəsmi proqramlar,
elan paylaşan platformalar və ödənişli host mübadiləsi xidmətləri də əhatə olunur.
Ölkə uyğunluğu və cari qəbul statusu hər elan üzrə ayrıca yoxlanılır.

**Canlı sınaq:** `python3 scrape.py --source all --dry-run --limit 1`.
24 mənbədən səhifə oxundu; 4 mənbədə uyğun qəbul keçidi tapılmadı, 3 mənbə
əlçatmaz oldu, 15 mənbə manual statusundadır. 18 ümumi proqram səhifəsi və
5 əlavə yoxlama tələb edən elan ayrıldı; 1 tarixli elan qaralama JSON-a çevrildi.
AI çağırışı və bazaya yazma edilmədi. Bu nəticə bütün arxivi əhatə etmir.

`listing`: elan toplayan adapter; `program`: ümumi proqram məlumatı;
`manual`: avtomatik yığım hazır deyil. “Oxundu” statusu yeni qəbulun açıq
olduğunu və ya bütün şəxsi şərtlərin uyğunluğunu bildirmir.

[İstifadə təlimatı](README.md) · [Dəyişdirilən kataloq](sources/catalog.json)

## Beynəlxalq mənbələr

| ID | Mənbə | Rejim | Son yoxlama | Qeyd |
| --- | --- | --- | --- | --- |
| `salto` | [SALTO-Youth](https://www.salto-youth.net/tools/european-training-calendar/browse/) | `listing` | Oxundu |  |
| `youthop` | [Youth Opportunities](https://www.youthop.com/exchange-programs) | `listing` | Oxundu | Youth exchanges, training and related international opportunities; includes the previous source. |
| `opportunitydesk` | [Opportunity Desk — Volunteering](https://opportunitydesk.org/category/jobs-and-internships/volunteering/) | `listing` | Oxundu |  |
| `esc` | [European Youth Portal / ESC](https://youth.europa.eu/go-abroad/volunteering/opportunities_en) | `manual` | Əl ilə / ayrıca inteqrasiya | Elan siyahısı JavaScript tətbiqindədir; avtomatik import hazır deyil. Rəsmi portalda Azərbaycan filtri ilə yoxla. |
| `unv` | [UN Volunteers / UVP](https://app.unv.org/) | `manual` | Əl ilə / ayrıca inteqrasiya | JavaScript portalı. Milli, beynəlxalq və onlayn tapşırıqlar; hər tapşırığın uyğunluğu ayrıca yoxlanmalıdır. |
| `eurodesk` | [Eurodesk Opportunity Finder](https://programmes.eurodesk.eu/volunteering/) | `manual` | Əl ilə / ayrıca inteqrasiya | Avtomatik sorğu Cloudflare tərəfindən bloklandı; rəsmi kataloqdan yoxlama. |
| `aiesec` | [AIESEC Global Volunteer](https://aiesec.org/global-volunteer) | `program` | Oxundu | Proqram məlumatıdır; iştirak haqqı və yaş/ölkə şərtləri layihəyə görə dəyişir. |
| `workaway` | [Workaway](https://www.workaway.info/) | `program` | Oxundu | Host mübadiləsi; üzvlük haqqı ola bilər, iş/viza və host şərtlərini yoxla. |
| `wwoof` | [WWOOF](https://wwoof.net/) | `program` | Oxundu | Orqanik fermalar üzrə mübadilə; milli təşkilat və üzvlük şərtləri var. |
| `helpx` | [HelpX](https://www.helpx.net/) | `program` | Əlçatmaz | Host mübadiləsi kataloqu; üzvlük və viza şərtlərini ayrıca yoxla. Cannot verify robots.txt (HTTP 200) |
| `icye` | [ICYE](https://www.icye.org/volunteering/) | `program` | Oxundu | Qısa/uzunmüddətli proqramlar; milli tərəfdaş və ödəniş şərtləri dəyişir. |
| `alliance` | [Alliance of European Voluntary Service Organisations](https://www.alliance-network.eu/international-volunteering/) | `program` | Oxundu | İş düşərgələri və tərəfdaş təşkilatlar şəbəkəsi; ümumi proqram səhifəsidir. |
| `idealist` | [Idealist / VolunteerMatch](https://www.idealist.org/en/volunteer) | `manual` | Əl ilə / ayrıca inteqrasiya | VolunteerMatch Idealist-ə yönləndirilir; elan üzrə uzaqdan/ölkə uyğunluğu yoxlanmalıdır. |
| `sci` | [Service Civil International / Workcamps](https://workcamps.sci.ngo/) | `manual` | Əl ilə / ayrıca inteqrasiya | Cloudflare bloklaması; düşərgələrin tərəfdaş və ölkə şərtləri ayrıca yoxlanmalıdır. |
| `volunteerworld` | [Volunteer World](https://www.volunteerworld.com/en) | `manual` | Əl ilə / ayrıca inteqrasiya | Cloudflare bloklaması. Ödənişli layihələr də ola bilər. |
| `worldpackers` | [Worldpackers](https://www.worldpackers.com/) | `manual` | Əl ilə / ayrıca inteqrasiya | Cloudflare bloklaması. Üzvlük əsasında host mübadiləsi. |
| `goabroad` | [GoAbroad — Volunteer Abroad](https://www.goabroad.com/volunteer-abroad) | `manual` | Əl ilə / ayrıca inteqrasiya | Cloudflare bloklaması. Üçüncü tərəf proqramları və mümkün ödənişlər. |
| `vso` | [VSO](https://www.vsointernational.org/volunteering) | `program` | Oxundu | Peşəkar könüllülük; rolun təcrübə və ölkə şərtləri ayrıca yoxlanmalıdır. |
| `ivhq` | [International Volunteer HQ](https://www.volunteerhq.org/) | `program` | Oxundu | Proqram ödənişləri ola bilər. Açıq elan kimi avtomatik dərc edilmir. |
| `globalvolunteers` | [Global Volunteers](https://globalvolunteers.org/) | `program` | Əlçatmaz | Proqram ödənişləri ola bilər; konkret tarix və şərtlər ayrıca təsdiqlənməlidir. No usable article text; may require JavaScript |
| `ifrc` | [IFRC / Red Cross Red Crescent](https://www.ifrc.org/get-involved/volunteer-us) | `manual` | Əl ilə / ayrıca inteqrasiya | Cloudflare bloklaması; könüllülük milli cəmiyyətlər vasitəsilə təşkil olunur. |
| `ymca` | [World YMCA](https://www.ymca.int/get-involved/) | `program` | Oxundu | Beynəlxalq və milli üzv təşkilat proqramları; konkret qəbul elanı deyil. |
| `youthforeurope` | [Youth for Europe](https://youthforeurope.eu/international-volunteering-opportunities/) | `listing` | Oxundu | Elan paylaşan platforma; iştirak və ödəniş şərtləri hər layihə üzrə yoxlanmalıdır. |

## Yerli mənbələr

| ID | Mənbə | Rejim | Son yoxlama | Qeyd |
| --- | --- | --- | --- | --- |
| `dost` | [Könüllü DOST](https://konullu.dost.gov.az/konullu-ol) | `program` | Oxundu | Altproqramların yaş və qəbul şərtləri ayrıdır; proqram səhifəsi açıq qəbul zəmanəti deyil. |
| `dost_news` | [DOST qəbul elanları](https://konullu.dost.gov.az/xeberler) | `listing` | Oxundu |  |
| `asan` | [ASAN Könüllülük Məktəbi](https://konullu.asanschool.az/) | `manual` | Əl ilə / ayrıca inteqrasiya | Rəsmi ASAN saytı bu qeydiyyat portalına keçid verir. Əlçatanlığı brauzerdə yoxlanmalıdır. |
| `asan_news` | [ASAN elanları](https://asan.gov.az/media/announcements) | `listing` | Skan edilən səhifədə uyğun çağırış yoxdur |  |
| `bir` | [BİR Könüllü](https://konullu.edu.az/) | `manual` | Əl ilə / ayrıca inteqrasiya | Elm və Təhsil Nazirliyinin göstərdiyi rəsmi qeydiyyat ünvanı; yoxlamada TLS xətası. |
| `eco` | [Ekokönüllülər / ETSN](https://eco.gov.az/az/konullu_fealiyyet) | `program` | Əlçatmaz | Rəsmi könüllü fəaliyyət və qeydiyyat səhifəsi. Cannot verify robots.txt (HTTP 200) |
| `kob` | [KOB Könüllüləri](https://smb.gov.az/az/nav/kob-konulluleri-proqrami) | `program` | Oxundu | KOB Master 1/2 və seçim meyarları; ehtiyaca uyğun qəbul. |
| `migration` | [Miqrasiya Könüllüsü](https://migration.gov.az/az/form/3) | `program` | Oxundu | Dövlət Miqrasiya Xidmətinin könüllü müraciət forması. |
| `customs` | [Könüllü gömrükçü](https://customs.gov.az/az/muracietler/volunteer) | `program` | Oxundu | Dövlət Gömrük Komitəsinin rəsmi proqram səhifəsi. |
| `baku` | [Bakı Şəhər Halqası könüllüləri](https://www.bakucitycircuit.com/az/volunteers) | `program` | Oxundu | Formula 1 könüllülük proqramı; mövsümi qəbul, açıq tarix ayrıca təsdiqlənməlidir. |
| `family` | [Ailəm Könüllüləri — elanlar](https://family.gov.az/az/news?category=elanlar) | `listing` | Oxundu |  |
| `media` | [MEDİA Könüllüləri](https://media.gov.az/layiheler/media-konulluleri/) | `program` | Oxundu | Medianın İnkişafı Agentliyinin könüllülük proqramı. |
| `diaspora` | [Diaspor Könüllüləri](https://diaspor.gov.az/az/news-detail/konulluler-proqrami-na-qebul-elan-edilir-6418) | `manual` | Əl ilə / ayrıca inteqrasiya | Rəsmi keçmiş qəbul elanı; TLS xətası, hazırkı qəbul ayrıca təsdiqlənməlidir. |
| `agrar` | [Aqrar İnkişaf Könüllüləri — xəbərlər](https://agro.gov.az/az/news) | `listing` | Skan edilən səhifədə uyğun çağırış yoxdur |  |
| `regional` | [Regional İnkişaf İctimai Birliyi](https://riib.az/) | `program` | Oxundu | Regional layihələr və könüllülük şəbəkəsi; proqram səviyyəsində baxış. |
| `redcrescent` | [Azərbaycan Qızıl Aypara Cəmiyyəti](https://redcrescent.org.az/be-a-volunter) | `program` | Oxundu | Humanitar könüllülük; təşkilatın qəbul şərtləri ayrıca yoxlanmalıdır. |
| `diplomacy` | [Diplomatiya Könüllüləri](https://mfa.gov.az/az/category/fealiyyet-haqqinda-melumat) | `manual` | Əl ilə / ayrıca inteqrasiya | XİN-in rəsmi proqram məlumatı; illik qəbul elanını izləmək lazımdır. TLS xətası. |
| `akti` | [Azərbaycan Könüllü Təşkilatları İttifaqı](https://konullu.az/) | `manual` | Əl ilə / ayrıca inteqrasiya | Könüllü təşkilatlarının çətir şəbəkəsi; yoxlamada əlaqə xətası. |
| `reforms` | [İslahat Könüllüləri](https://volunteer.ereforms.gov.az/az/xeber) | `listing` | Skan edilən səhifədə uyğun çağırış yoxdur | İİTKM-nin rəsmi könüllülük proqramı; yalnız qəbul elanları götürülür. |
| `tourism` | [Turizm Könüllüləri](https://www.tourism.gov.az/voluntourism) | `program` | Oxundu | Dövlət Turizm Agentliyinin rəsmi könüllülük proqramı; qəbul statusu ayrıca yoxlanmalıdır. |
| `nakhchivan_tourism` | [Naxçıvan Turizm Könüllüləri](https://ntourism.gov.az/konulluluk) | `manual` | Əl ilə / ayrıca inteqrasiya | Naxçıvan Turizm Departamentinin rəsmi qeydiyyat məlumatı; yoxlamada TLS xətası. |
| `justice` | [Ədliyyə Könüllüləri](https://justice.gov.az/az/volunteering) | `program` | Oxundu | Ədliyyə Nazirliyinin könüllü-təcrübə proqramı; ixtisas və seçim şərtlərini yoxla. |
| `food` | [Könüllü Qida Nəzarətçisi / AQTA](https://afsa.gov.az/az/agentlik/konulluluk/konulluluk-xeberler) | `listing` | Skan edilən səhifədə uyğun çağırış yoxdur | AQTA-nın könüllülük xəbərləri; yalnız açıq qəbul elanları emala buraxılır. |

## Yeni mənbə əlavə etmək

`sources/catalog.json` daxilində unikal `id`, `name`, `scope`, `url`, `mode` ver.
`listing` üçün konkret elan URL-lərini seçən `link_pattern` tələb olunur.
Ümumi yenilik saytlarında `volunteer_only` və `recruitment_only` filtrlərindən istifadə et.
Robot qaydalarını və real elan nümunəsini yoxlamadan mənbəni işlək sayma.

## Araşdırma üçün əsas istinadlar

- [European Youth Portal / ESC](https://youth.europa.eu/go-abroad/volunteering/opportunities_en)
- [UN Volunteers — iştirak yolları](https://www.unv.org/become-volunteer)
- [DOST — könüllülük proqramı](https://dost.gov.az/page/konullu-dost-proqrami)
- [ASAN — rəsmi saytdakı ASAN Könüllülük Məktəbi keçidi](https://asan.gov.az/)
- [BİR Könüllü — Elm və Təhsil Nazirliyinin rəsmi məlumatı](https://edu.gov.az/az/news-and-updates/16156-1)
- [Turizm Könüllüləri — rəsmi proqram](https://www.tourism.gov.az/voluntourism)
- [MEDİA Könüllüləri — rəsmi proqram](https://media.gov.az/layiheler/media-konulluleri/)
- [Azərbaycanın Şərq Tərəfdaşlığında iştirakı — Aİ Şurası](https://www.consilium.europa.eu/en/policies/eastern-partnership/)
