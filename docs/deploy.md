# Blessed Texts — Cloudflare Pages Deployment

## Build settings

| Setting | Value |
|---------|-------|
| Build command | `npm run build:fast` |
| Output directory | `dist` |
| Node version | 20 |
| Environment | `SKIP_PDF=1`, `PUBLIC_ENABLE_PDF=0` |

Set these as **Environment variables** in the Cloudflare Pages project:

| Variable | Value | Environment |
|----------|--------|-------------|
| `NODE_VERSION` | `20` | Production and Preview |
| `SKIP_PDF` | `1` | Production and Preview |
| `PUBLIC_ENABLE_PDF` | `0` | Production and Preview |
| `PUBLIC_ENABLE_AHREFS` | `1` | **Production only** |
| `PUBLIC_AHREFS_KEY` | Ahrefs Web Analytics key | **Production only** (with `PUBLIC_ENABLE_AHREFS`) |
| `INDEXNOW_KEY` | Same hex key as `indexnow.config.json` | **Production only** (optional until IndexNow is configured) |

## First-time setup (Cloudflare Pages)

1. **Cloudflare Dashboard** → Workers & Pages → **Create** → **Pages** → **Connect to Git**
2. Select this repository and the production branch (`main`)
3. Enter the build settings from the table above
4. **Save and Deploy** — first build may take 10–15+ minutes (prebuild + downloads + Astro)
5. Confirm the `*.pages.dev` preview URL serves `/`, `/og-image.jpg`, and `/sitemap-index.xml`
6. **Custom domains** → add `blessedtxts.com` (and `www` if desired)
7. Update DNS at your registrar per Cloudflare instructions; wait for **SSL Active**

### OneDrive note

If local `npm run build:fast` fails with `UNKNOWN` file errors, pause OneDrive sync or build only via GitHub → Cloudflare. CI on GitHub Actions is unaffected.

## What `build:fast` does

1. **prebuild** — parse Bible source text, build search indexes, copy chapter JSON, generate logo/OG/favicon assets, IndexNow key file (when configured)
2. **downloads:fast** — generate TXT + MD downloads (no PDFs)
3. **astro build** — static site to `dist/`
4. **indexnow-submit** — on production Cloudflare builds with `INDEXNOW_KEY`, POST sitemap URLs to IndexNow API

Downloads are **not** committed to git; they are generated on every deploy.

## Optional full build (with PDFs)

```bash
npm run build:full
```

Set `PUBLIC_ENABLE_PDF=1` to show PDF download links in the UI.

## Legacy URL redirects

`public/_redirects` sends old book/chapter/version paths to the reader or Indexed Bible with HTTP 301. Astro redirect stub pages remain as `noindex` fallbacks.

## Performance notes

- Homepage verse pools load from `/blessings/pools/*.json` (lazy + idle prefetch)
- Bible chapters and search indexes are lazy-loaded by the reader
- `public/_headers` sets long-cache headers for static assets on Cloudflare Pages

## Post-deploy verification checklist

After the custom domain is live:

- [ ] `https://blessedtxts.com/robots.txt` references `sitemap-index.xml`
- [ ] `https://blessedtxts.com/sitemap-index.xml` loads
- [ ] `https://blessedtxts.com/og-image.jpg` returns 1200×630 image
- [ ] `https://blessedtxts.com/favicon.ico` and `/apple-touch-icon.png` load
- [ ] View-source on `/topics/hope/` shows verse text in HTML
- [ ] View-source on `/king-james-bible/read/` shows popular passages in `<noscript>`
- [ ] `https://blessedtxts.com/king-james-bible/genesis/1/` redirects to reader (301 or JS fallback)
- [ ] Google Search Console — add property, submit sitemap
- [ ] [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) — homepage OG preview
- [ ] [Twitter Card Validator](https://cards-dev.twitter.com/validator) — `summary_large_image`
- [ ] View-source on `/` shows Ahrefs analytics script in `<head>` (requires `PUBLIC_ENABLE_AHREFS=1` and `PUBLIC_AHREFS_KEY` on Production)
- [ ] Ahrefs Web Analytics → **Recheck installation** succeeds
- [ ] `https://blessedtxts.com/{indexnow-key}.txt` returns the key (after setting `indexnow.config.json` + `INDEXNOW_KEY`)
- [ ] Cloudflare production build log shows `[indexnow] success (200)` or `(202)` when IndexNow is enabled

## Local verification before deploy

```bash
npm run build:fast
npm run test:smoke
REQUIRE_DIST=1 npm run test:smoke:dist
npm run preview
```

## CI

GitHub Actions runs unit tests, smoke tests, `build:fast`, deploy-budget checks, and Playwright e2e on every push/PR.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build timeout on Cloudflare | Ensure `build:fast` (not `build:full`); check build logs for stuck prebuild |
| `/downloads/` 404 | Build failed during `generate-downloads`; fix prebuild errors |
| OG image missing | Run `npm run assets` or full prebuild; confirm `public/og-image.jpg` exists |
| Wrong site URL in meta | `SITE_URL` in `src/site.config.ts` (used by `astro.config.mjs` and SEO helpers) must match the custom domain |
