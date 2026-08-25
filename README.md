# Blessed Texts

**[Live website](https://blessedtxts.com)**

Free online Bible reader and random verse generator. Search Scripture, browse by topic, bookmark verses, and download TXT, MD, or PDF files. Translations: King James (KJV), World English Bible (WEB), and Webster (1833).

**Stack:** Astro 5, TypeScript, static output on [Cloudflare Pages](https://developers.cloudflare.com/pages/).

## Setup

Node.js 20 is required.

```bash
npm install
npm run dev:full
```

Production-style build (no PDFs):

```bash
npm run build:fast && npm run preview
```

| Script | Purpose |
|--------|---------|
| `npm run dev:full` | Prebuild Bible data + Astro dev server |
| `npm run build:fast` | Cloudflare Pages build (`dist/`, Node 20) |
| `npm run check` | TypeScript (`astro check`) |
| `npm test` | Unit tests |
| `npm run test:smoke` | Build-artifact and SEO smoke checks |
| `npm run test:e2e` | Playwright (run `build:fast` first) |

Cloudflare Pages: build command `npm run build:fast`, output directory `dist`, Node 20. Full deploy settings, env vars, and IndexNow: [docs/deploy.md](docs/deploy.md).

SEO and crawler notes: [docs/seo.md](docs/seo.md). How to contribute: [CONTRIBUTING.md](CONTRIBUTING.md).

## Architecture

Prebuild scripts parse `data/raw/` into chapter JSON and search indexes. Astro generates static pages (including one HTML document per book and chapter); the reader hydrates the full Bible in the browser from `/bibles/`. Shared logic lives in `src/lib/`; DOM modules in `src/scripts/`. Verse lookup is also available at `/api/v1/` via Cloudflare Pages Functions.

## Bible texts

Public-domain editions used by this site (redistributors may include the same `data/raw/` files):

- **King James (KJV)** — Pure Cambridge Edition; text courtesy of [BibleProtector](https://www.bibleprotector.com) (`data/raw/kjv.txt`)
- **World English Bible (WEB)** — [worldenglish.bible](https://worldenglish.bible/) (`data/raw/web.txt`)
- **Webster Bible (WBT)** — Noah Webster, 1833, public domain (`data/raw/worldbibletext.txt`)

The application code is MIT-licensed ([LICENSE](LICENSE)). Bible source texts remain in the public domain under their original terms.
