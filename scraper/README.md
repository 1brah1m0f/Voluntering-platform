# Openly Scraper & Opportunity Pipeline

Avtomatlaşdırılmış könüllülük və təlim elanları toplayıcı modulu (SALTO-Youth, Erasmus+ və s.).

## Necə işləyir?
1. **Collector (`sources/`):** Hədəf portallardan (məs. SALTO-Youth) son elanları çəkir.
2. **Normalizer (`normalizer.py`):** Xam mətn və HTML-i Google Gemini AI (və ya daxili parser) vasitəsilə Openly formatına uyğunlaşdırır.
3. **Database (`db.py`):** Dublikatları yoxlayır və yeni elanları `published = False` (təsdiq gözləyən qaralama) olaraq Supabase bazasına qeyd edir.

## Quraşdırma

```bash
cd scraper
pip install -r requirements.txt
cp .env.example .env
```

`.env` faylında Supabase və Gemini API açarlarını daxil edin.

## İşə salma

```bash
# Test üçün (bazaya yazmadan, sadəcə terminalda nəticəni görmək üçün):
python run.py --dry-run --limit 3

# Real işə salma (bütün tapılan yeni elanları qaralama kimi bazaya yazmaq):
python run.py --source salto --limit 10
```
