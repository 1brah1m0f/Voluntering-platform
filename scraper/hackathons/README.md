# Hakaton scraper-i

Könüllülük scraper-indən ayrıdır. **AI çağırmır, 0 token sərf edir.**

```bash
python3 scrape.py --category hackathons --list-sources
python3 scrape.py --category hackathons --source all --dry-run --limit 3
python3 scrape.py --category hackathons --scope local --dry-run --limit 3
python3 scrape.py --category hackathons --source lablab --dry-run --limit 5
```

Əsas ayarlar: **[catalog.json](catalog.json)**.

| Mənbə | Rejim | Qeyd |
| --- | --- | --- |
| [lablab.ai](https://lablab.ai/event) | Elan toplayıcı | AI hakatonları; hər tədbirin ölkə şərtləri ayrıdır |
| [TAIKAI](https://taikai.network/hackathons) | Elan toplayıcı | Açıq HTML siyahıları |
| [Devfolio](https://devfolio.co/hackathons) | Elan toplayıcı | İctimai tədbir subdomenləri; robots qaydalarına əməl edilir |
| [MLH](https://mlh.io/seasons/2027/events) | Elan toplayıcı | 2027 mövsümü; yalnız MLH-nin öz domenlərindəki elanlar |
| [Devpost](https://devpost.com/hackathons) | Manual | Siyahı JavaScript ilə yüklənir; işlək avtomatik adapter deyil |
| [DoraHacks](https://dorahacks.io/hackathon) | Manual | HTTP yoxlamasında 405; ayrıca inteqrasiya lazımdır |
| [İDDA](https://idda.az/az/news) | Manual, yerli | JavaScript xəbərləri; qəbul elanı ayrıca yoxlanmalıdır |
| [Technest](https://technest.idda.az/) | Proqram məlumatı, yerli | Hər proqram və təlim hakaton deyil; məlumatlar review-a ayrılır |

`listing` adapteri saytın bütün elanlarını avtomatik bazaya import etdiyini
bildirmir. Saytın əlçatanlığı `source-status.json`-da göstərilir. Mövsümi MLH
URL-si növbəti mövsümdə kataloqda yenilənməlidir.

## Nəticələr

Fayllar **`scraper/output/hackathons/`** qovluğundadır:

- `drafts.json` — ölkə uyğunluğu və məlumat formatı yoxlanılmış qaralamalar.
- `review.json` — ölkə şərtləri, tarix, təşkilatçı, format və ya komanda sayı
  məlum olmayan elanlar, həmçinin ümumi proqram məlumatları.
- `source-status.json` — oxunan, uyğun keçidi olmayan, manual və əlçatmaz mənbələr.
- `summary.json` — saylar və token istifadəsi.

Sadəcə “online” yazılması Azərbaycandan iştiraka icazə demək deyil. Azərbaycan,
bütün ölkələr və ya dəstəklənən ölkə qrupu üzrə təsdiq tələb olunur. Bütün şəxsi
şərtlər (yaş, tələbə statusu və s.) iştirakçı tərəfindən ayrıca yoxlanmalıdır.
Bu rejimdə yerli mənbə olması avtomatik ölkə uyğunluğu yaratmır.

İlkin parser yalnız səhifənin açıq JSON-LD Event məlumatını və göstərilən
qeydiyyat/komanda şərtlərini istifadə edir; tarix və komanda ölçüsü uydurmur.
**Mövcud hakaton cədvəli `deadline <= start_date <= end_date` tələb edir.**
Hakatonun təqdimetmə müddəti başlanğıcdan sonradırsa, tarix dəyişdirilmir,
elan review-a ayrılır. JSON-LD olmayan elanlar da yoxlama tələb edir.

## Mövcud hakaton bölməsinə yazma

Supabase ayarları qurulduqda `--dry-run` parametrini çıxartmaq yalnız tam
qaralamaları **`hackathons` cədvəlinə `published=false`** olaraq yazır.
Könüllülük üçün `opportunities` cədvəlinə yazmır. Mövcud hakaton bölməsi
admin preview olaraq qalır; scraper onun giriş qaydalarını dəyişmir.

Natamam qeydləri `review.json`-dan yoxlayıb tətbiqin `HackathonInput` formatında
ayrıca JSON massivinə çevirə bilərsən. Raw review faylı birbaşa import edilmir.
Yoxlanılmış faylı əvvəlcə sına:

```bash
python3 scrape.py --category hackathons --import-reviewed reviewed-hackathons.json --dry-run
```

Bazaya yazmaq üçün eyni əmrdən `--dry-run` parametrini çıxart. Bütün fayl yazmadan
əvvəl validasiya olunur; `published=true`, keçmiş son tarix, səhv tarix ardıcıllığı,
komanda hədləri və natamam məcburi məlumatlar qəbul edilmir. Bazada olan URL-lər
buraxılır. Bu sessiyada canlı bazaya yazma aparılmayıb.

GitHub Actions workflow-u `volunteering`, `hackathons` və ya `both` seçimini
dəstəkləyir. Dəyişikliklər repozitoriyaya göndərildikdən sonra işləyəcək.
