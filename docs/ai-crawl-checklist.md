# AI crawl and citation checklist — Blessed Texts

Public-domain Scripture: we **want** search indexing, live AI answers (`ai-input`), and training use. Do not copy Cloudflare’s default “search yes, training no” managed robots.txt.

## Dashboard (blessedtxts.com zone)

- [ ] **AI Crawl Control:** Allow **Search**, **Agent**, and **Training** on all pages.
- [ ] Do **not** enable **Block AI bots**.
- [ ] Before **15 September 2026**, confirm mixed-purpose crawlers (Googlebot, Bingbot, Applebot) are not blocked as Training.
- [ ] **Bot Preference Sync / managed robots.txt:** off, or aligned with `search=yes, ai-input=yes, ai-train=yes`.
- [ ] If the zone is **Pro or above:** enable **Markdown for Agents** after chapter HTML is live, then spot-check:

```bash
curl -sI https://blessedtxts.com/king-james-bible/john/3/ -H "Accept: text/markdown"
curl -s https://blessedtxts.com/king-james-bible/john/3/ -H "Accept: text/markdown" | head
```

- [ ] Google Search Console: submit `https://blessedtxts.com/sitemap-index.xml` after the chapter-page deploy; watch coverage for accidental `noindex` or leftover 301s.
- [ ] Optional later: WAF rate limit on `/api/*` if abuse appears. No API keys; the corpus is public domain.
- [ ] Optional later: Cloudflare AI Search over `/downloads/**/*.md` and a public MCP wrapper around `/api/v1/*`.

## Production curls (after deploy)

```bash
curl -sI https://blessedtxts.com/robots.txt
curl -s https://blessedtxts.com/robots.txt
curl -sI https://blessedtxts.com/llms.txt
curl -sI https://blessedtxts.com/.well-known/llms.txt
curl -sI https://blessedtxts.com/agents.txt
curl -sI https://blessedtxts.com/sitemap-index.xml
curl -s https://blessedtxts.com/king-james-bible/john/3/ | findstr /i "For God so loved"
curl -sI "https://blessedtxts.com/api/v1/verse?ref=John+3:16&version=kjv"
```

On Unix, replace `findstr` with `grep`. Chapter HTML must contain verse text in the body (not only a JavaScript reader shell).

`robots.txt` must include:

```txt
Content-Signal: search=yes, ai-input=yes, ai-train=yes
```

## Local API

`npm run preview` (Astro) does **not** run Pages Functions. `/api/v1/*` is covered by unit tests. For a manual Function check:

```bash
npx wrangler pages dev dist
```
