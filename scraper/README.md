# Könüllülük mənbələri və scraper

Əsas giriş: **[scrape.py](../scrape.py)**. Mənbələri dəyişmək üçün
**[sources/catalog.json](sources/catalog.json)** faylını aç.
Tam siyahı və yoxlama qeydləri: **[SOURCES.md](SOURCES.md)**.

Kataloqda 46 mənbə var: 23 beynəlxalq və 23 yerli. Bu, araşdırılmış mənbələrin
siyahısıdır; dünyadakı bütün saytların tam siyahısı deyil.

- `listing` — konkret elan səhifələrini toplayan 10 adapter.
- `program` — ümumi proqram/qeydiyyat məlumatını toplayan 21 adapter.
- `manual` — JavaScript, giriş, bloklama və ya əlaqə problemi səbəbindən ayrıca
  inteqrasiya/yoxlama tələb edən 15 mənbə. Bunlar işlək avtomatik scraper sayılmır.

Sayt sonradan quruluşunu dəyişə və ya əlçatmaz ola bilər. Hər icranın real
nəticəsi `output/source-status.json` faylında qeyd edilir.

## Hakatonlar

Ayrıca **[hakaton rejimi](hackathons/README.md)** əlavə olunub:

```bash
python3 scrape.py --category hackathons --list-sources
python3 scrape.py --category hackathons --source all --dry-run --limit 3
```

Onun 8 mənbəsi və nəticələri könüllülük kataloqundan ayrıdır.
Nəticələr `scraper/output/hackathons/` daxilindədir.

## İşə salma

Əmrləri layihənin əsas qovluğundan işlət:

```bash
python3 -m pip install -r scraper/requirements.txt
python3 scrape.py --list-sources
python3 scrape.py --list-sources --scope local
python3 scrape.py --source all --dry-run --limit 3
python3 scrape.py --scope local --dry-run --limit 5
python3 scrape.py --scope global --dry-run --limit 5
python3 scrape.py --source opportunitydesk --pages 3 --dry-run --limit 10
```

`--limit` hər mənbədən götürülən elan səhifələrinin maksimum sayıdır; qəbul
edilən elanların sayı deyil. `--pages` aşkar edilmiş növbəti səhifə keçidlərini
izləyir (1–5 səhifə); bir icrada bütün arxiv skan edilmir. Limit 1–50-dir.
Proqram məlumatı adapterləri bir səhifə oxuyur, `manual` mənbələr şəbəkəyə çıxmır.
Əvvəlki `python3 scraper/run.py ...` əmri də işləyir.

Bazaya yazmaq üçün `scraper/.env.example` faylını `scraper/.env` olaraq kopyala
və Supabase ayarlarını daxil et. Sonra `--dry-run` parametrini çıxar.
Yeni elanlar `published = false` qaralama kimi saxlanılır; canlı saytda dərc
etmək üçün admin təsdiqi lazımdır.

## Filtrlər və token istifadəsi

1. Açıq HTML səhifələri `robots.txt`, gözləmə müddəti, sorğu və səhifə limitləri
   ilə oxunur. Kənar domenə keçid və form göndərişi edilmir.
2. Eyni URL-lər təmizlənir. Qəbul xəbərlərini oxuyan yerli mənbələrdə adi tədbir
   xəbərləri ayrıca filtr edilir.
3. İştirak şərtlərində Azərbaycan, bütün ölkələr və ya Şərq Tərəfdaşlığı ölkələri
   göstərilirsə ölkə uyğunluğu təsdiqlənir. Azərbaycan istisna edilirsə elan keçilir.
   [Aİ Şurası Azərbaycanı Şərq Tərəfdaşlığı ölkəsi kimi göstərir](https://www.consilium.europa.eu/en/policies/eastern-partnership/).
   Yerli rəsmi qəbul elanlarında ayrıca ölkə məhdudiyyəti yoxdursa yerli mənbə
   nəzərə alınır. Yaş, ixtisas, dil, viza və digər şəxsi şərtlər yenə yoxlanmalıdır.
4. Tarixsiz və ya ölkə uyğunluğu qeyri-müəyyən elanlar yoxlama faylına gedir.
   Keçmiş son tarixli elanlar buraxılır. Son tarix uydurulmur.
5. Bazada olan URL-lər AI emalından əvvəl buraxılır.
6. Yalnız bundan sonra normalizasiya və qaralama yaratma işləyir.

**Standart rejim 0 AI token sərf edir**, açar olsa belə. Gemini yalnız
`--use-ai` əlavə edilsə və `GEMINI_API_KEY` qurulsa işləyir. `--dry-run` bazaya
YAZMAĞI söndürür; `--use-ai` ilə birlikdə token sərfi mümkündür. Normal bazaya
qoşulma varsa dublikatları yoxlamaq üçün oxu sorğusu edilə bilər.

Üzvlük və ya proqram ödənişi tələb edən Workaway, WWOOF, IVHQ kimi mənbələr
kataloqa daxildir; onları avtomatik olaraq “tam maliyyələşən” elan saymırıq.

## Hesabatlar

Hər icrada `scraper/output/` daxilində:

| Fayl | Məzmun |
| --- | --- |
| `source-catalog.json` | Seçilmiş mənbələr və rəsmi keçidlər |
| `source-status.json` | Oxunan, əlçatmaz və əl ilə yoxlanacaq mənbələr |
| `programs-review.json` | Daimi proqram məlumatları; açıq qəbul zəmanəti deyil |
| `eligibility-review.json` | Ölkə uyğunluğu/tarixi məlum olmayan və emal xətalı elanlar |
| `summary.json` | Elan, dublikat, keçmiş tarix, yoxlama və import sayları |
| `opportunities_*.json` | `--dry-run`/`--save-json` zamanı normalizasiya edilmiş qaralamalar |

Proqram səhifələri son tarixsiz olduğuna görə AI-yə və `opportunities` cədvəlinə
avtomatik göndərilmir. Mövcud `programs-review.json` və `eligibility-review.json`
hər icrada yenilənir; keçmiş nəticələri saxlamaq üçün ayrıca kopyala.

GitHub Actions gündəlik bütün mənbələri tokensiz rejimdə yoxlayır. Manual işə
salınmada mənbə/scope seçmək olar. Hesabatlar 14 günlük artifact kimi saxlanılır.
Workflow dəyişiklikləri repozitoriyaya göndərildikdən sonra qüvvəyə minir.

## Kod və yoxlama

- `sources/catalog.json` — provayderlər, URL-lər, selector/path qaydaları.
- `sources/html.py` — ümumi HTML oxuyucu və səhifələmə.
- `eligibility.py` — Azərbaycan uyğunluğu.
- `dates.py` — mənbədə göstərilən son tarixin çıxarılması.
- `normalizer.py` — yerli qaydalar və istəyə bağlı Gemini.
- `run.py` — ardıcıllıq və hesabatlar.
- `db.py` — mövcud Supabase yazma və dublikat yoxlaması.

```bash
python3 -m unittest discover -s scraper/tests -v
```
