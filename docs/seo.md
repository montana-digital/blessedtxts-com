# SEO and AI discovery — Blessed Texts

## Indexable routes

These pages use `BaseLayout` with full meta tags, Open Graph, Twitter Cards, and JSON-LD where noted:

| Path | Notes |
|------|--------|
| `/` | WebSite + Organization schema; crawlable intro |
| `/about/`, `/contact/` | BreadcrumbList |
| `/indexed-bible/` | Hub for all translations; book links go to book pages |
| `/{version}/read/` | Reader + Book schema; popular passages in `<noscript>` |
| `/{version}/{book}/` | Book hub with chapter grid |
| `/{version}/{book}/{chapter}/` | Full chapter HTML; verse ids `#v{n}` |
| `/topics/`, `/topics/{topic}/` | Topic verse excerpts (KJV) linking to chapter pages |
| `/translations/{slug}/` | Translation guides + FAQPage |
| `/downloads/` | Download hub |

## Non-indexable (redirects)

`/{version}/` and `/bible-versions/` use HTTP 301 in `public/_redirects` (Cloudflare Pages) plus Astro `RedirectLayout` (`noindex`) as a fallback.

Unknown book/chapter paths are **404** (not redirects).

## Sitemap

- Generated at build by `@astrojs/sitemap` → `dist/sitemap-index.xml` (split files as needed)
- Filter in [`src/lib/sitemap-filter.mjs`](../src/lib/sitemap-filter.mjs) includes book/chapter pages; excludes version roots and `/bible-versions/`
- `public/robots.txt` must reference `sitemap-index.xml`

## IndexNow

IndexNow submits production sitemap URLs at the end of `build:fast` / `build:full` when `CF_PAGES=1` and `CF_PAGES_BRANCH=main`. Failures are **retried then logged**; they do not fail the deploy.

See [`docs/deploy.md`](deploy.md) for key setup.

## AI discovery

- `public/llms.txt` and `public/.well-known/llms.txt` (identical)
- `public/agents.txt`
- `Content-Signal: search=yes, ai-input=yes, ai-train=yes` in `robots.txt`
- CORS on `/bibles/*`, `/downloads/*`, `/api/*`
- Verse/chapter API: `/api/v1/verse`, `/api/v1/chapter`, OpenAPI at `/api/v1/openapi.json`
- Chapter/book HTML includes `rel="alternate" type="text/markdown"` to `/downloads/...md` (not in the sitemap)
- Dashboard checklist: [`docs/ai-crawl-checklist.md`](ai-crawl-checklist.md)
- Query clusters: [`docs/seo-content-map.md`](seo-content-map.md)

## Adding a new indexable page

1. Use `BaseLayout` with unique `title` and `description` via `pageTitle()`.
2. Add `jsonLd` breadcrumbs when the page is not home.
3. Include at least one `<h1>` and crawler-visible body text (not JS-only).
4. Link from footer (`site.config.ts` `footerNav`) or a related hub page.
5. Rebuild and confirm the URL appears in the generated sitemap.

## Reader deep links

Passage URLs: `/{routeSlug}/read/#{book}-{chapter}-v{verse}`  
Citation URLs: `/{routeSlug}/{book}/{chapter}/#v{verse}`
