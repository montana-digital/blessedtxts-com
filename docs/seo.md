# SEO and AI discovery — Blessed Texts

## Indexable routes

These pages use `BaseLayout` with full meta tags, Open Graph, Twitter Cards, and JSON-LD where noted:

| Path | Notes |
|------|--------|
| `/` | WebSite + Organization schema |
| `/about/`, `/contact/` | BreadcrumbList |
| `/indexed-bible/` | Hub for all translations |
| `/{version}/read/` | Reader + Book schema; Genesis 1 in `<noscript>`; popular-passage links visible |
| `/topics/`, `/topics/{topic}/` | Topic verse excerpts (KJV) |
| `/translations/{slug}/` | Translation guides |
| `/downloads/` | Download hub |

## Non-indexable (redirects)

Legacy paths under `/{version}/`, `/{version}/{book}/`, `/{version}/{book}/{chapter}/`, and `/bible-versions/` use HTTP 301 rules in `public/_redirects` (Cloudflare Pages) and minimal Astro HTML with `noindex` as a fallback.

Reader pages include popular passage chapter text inside `<noscript>` for crawlers without JavaScript (Genesis 1 plus passages from `POPULAR_PASSAGES` in `reader-ssr.ts`).

## Sitemap

- Generated at build by `@astrojs/sitemap` → `dist/sitemap-index.xml`
- Filter in [`src/lib/sitemap-filter.mjs`](../src/lib/sitemap-filter.mjs) (imported by `astro.config.mjs`) excludes redirect URL patterns
- `public/robots.txt` must reference `sitemap-index.xml` (not a manual `public/sitemap.xml`)

## IndexNow (Bing and other search engines)

IndexNow notifies participating engines when indexable URLs change. This site uses a **build-time** integration (static hosting on Cloudflare Pages).

### Setup

1. In [Bing Webmaster Tools](https://www.bing.com/webmasters) → **IndexNow**, generate an API key (or use `openssl rand -hex 16`).
2. Set the key in [`indexnow.config.json`](../indexnow.config.json) (`key` field, 8–128 hex characters).
3. In Cloudflare Pages → **Environment variables** → **Production**, add `INDEXNOW_KEY` with the **same** value (`INDEXNOW_KEY` overrides the config file at build time).
4. Deploy from `main`. Prebuild writes `public/{key}.txt` (file body is the key only, no trailing newline).
5. After deploy, open `https://blessedtxts.com/{key}.txt` and confirm it returns the key string.

### What runs on deploy

| Step | Script | When |
|------|--------|------|
| Key file | `scripts/ensure-indexnow-key.mjs` | `prebuild` (skipped if key is missing or still the placeholder) |
| URL submit | `scripts/indexnow-submit.mjs` | End of `build:fast` / `build:full`, only when `CF_PAGES=1` and `CF_PAGES_BRANCH=main` |

Submissions POST the production sitemap URLs to `https://api.indexnow.org/indexnow`.

### First deploy with a new key

Submit runs **during** the build, before the new `dist` is live. The first production deploy with a new key may get **403** from IndexNow until `{key}.txt` is on the live site. **Redeploy once** or run manually after deploy:

```bash
npm run build:fast
cross-env CF_PAGES=1 CF_PAGES_BRANCH=main INDEXNOW_KEY=yourkey node scripts/indexnow-submit.mjs
```

### Key rotation

1. Update `indexnow.config.json` and Cloudflare `INDEXNOW_KEY`.
2. Remove the old `public/{oldKey}.txt` from the repo if it was committed.
3. Redeploy production.

Preview deployments do **not** run IndexNow submit (production branch only).

## AI discovery

- `public/llms.txt` — preferred URLs and citation guidance for LLM crawlers
- Referenced in `public/robots.txt` comments; linked from About (not the site footer)
- All bots allowed in `robots.txt`; no GPTBot blocks

## Adding a new indexable page

1. Use `BaseLayout` with unique `title` and `description` via `pageTitle()`.
2. Add `jsonLd` breadcrumbs when the page is not home.
3. Include at least one `<h1>` and crawler-visible body text (not JS-only).
4. Link from footer (`site.config.ts` `footerNav`) or a related hub page.
5. Rebuild and confirm the URL appears in `dist/sitemap-0.xml`.

## Reader deep links

Passage URLs: `/{routeSlug}/read/#{book}-{chapter}-v{verse}`  
On load, `reader-init.ts` calls `navigate()` for the hash so shared links open the correct passage.
