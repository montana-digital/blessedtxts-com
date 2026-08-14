# Bible Reader — Manual QA Checklist

Run after `npm run build:fast` and `npm run preview`, or verify on staging/production.

## Setup

- [ ] `npm run prebuild` completes without errors (builds sharded keywords + slim MiniSearch index)
- [ ] `npm run build:fast` completes without errors
- [ ] `npm test` passes (unit)
- [ ] `npm run test:smoke` passes (search artifacts, manifests)
- [ ] `npm run test:e2e` passes (requires built `dist/`)
- [ ] Deploy includes `public/search/keywords-{version}/` shards and `index-*.min.json` (~11 MB each, not the old ~21 MB index)

## Reader — all three translations

For each: KJV (`/king-james-bible/read/`), WEB (`/world-english-bible/read/`), Webster (`/websters-bible/read/`):

- [ ] Page loads with 66 book headings in main column
- [ ] Sidebar shows Topics, Books, Chapters, Bookmarks sections
- [ ] Scrolling loads chapter text (no permanent "Loading…")
- [ ] Header shows epic title, one-sentence version facts, and **Bible Translation** dropdown (current translation selected)
- [ ] Search label highlights active translation name; search input and result **← / →** are on one row
- [ ] Verse toolbar hidden until a verse is selected; shows ref + three actions
- [ ] Chapter download bar (TXT / MD / PDF) appears when a chapter is active; downloads match visible chapter

## Navigation

- [ ] Sidebar book link jumps to book (`#genesis`)
- [ ] Sidebar chapter link jumps to chapter (`#genesis-1`)
- [ ] After load, sidebar/search/bookmark navigation to `#john-3-v16` shows “Loading Bible verses…” modal until passage loads, then scrolls to verse centered between site header and verse toolbar, highlights briefly, then stays selected with toolbar
- [ ] Reload starts at top (no hash restore from localStorage); hash/sidebar/search navigation scrolls after interaction
- [ ] Selecting a verse updates URL hash (`#genesis-1-v1`); deselect returns to chapter hash

## Search (tiered)

Single-token keywords use **keyword shards only** (no MiniSearch index, no verse-id-map). References use **verse-id-map + reference-map** (no MiniSearch). Phrases / fuzzy use slim index + verse-id-map (~29 MB total).

- [ ] Keyword search returns results (e.g. `faith`, `beginning`) — Network tab: shard under `/search/keywords-{version}/`, **not** `index-*.min.json` or `verse-id-map-*.json`
- [ ] Autocomplete suggests tokens while typing (reader sidebar + version hub search)
- [ ] Synonym expansion works (e.g. `afraid` finds fear-related verses)
- [ ] Reference `Jn 3:16` jumps to John 3:16 — loads verse-id-map, not full MiniSearch index
- [ ] Reference `Genesis 1` jumps to Genesis 1:1 (chapter-only ref)
- [ ] Reference `Ps 23:1` jumps to Psalms 23:1
- [ ] Fast typing does not flash stale results from an earlier query
- [ ] Prev / Next cycles through multiple results
- [ ] Rapid search Prev / Next (5×) does not leave “Loading Bible verses…” modal stuck open

## Topics

- [ ] Each topic button (Hope, Love, Faith, etc.) lists verses
- [ ] First topic verse shows loading modal (if not cached), then scrolls into view centered in reading band
- [ ] Prev / Next works on topic results
- [ ] Topics load verse-id-map only (no MiniSearch index in Network tab)

## Bookmarks

- [ ] Tap/click a verse — selection border + toolbar appears
- [ ] Toolbar **Add to Bookmarks** — verse appears in sidebar; subtle left accent on verse
- [ ] Reload page — bookmark still listed
- [ ] Click bookmark link — jumps to verse
- [ ] Toolbar **Remove bookmark** — bookmark removed from sidebar
- [ ] **Copy** puts verse text + ref on clipboard
- [ ] **Save as image** downloads PNG with translation, ref, watermark `blessedtxts.com`

## Bible translation (dropdown)

- [ ] Navigate to `#romans-8-v28` on KJV (sidebar/search after load)
- [ ] **Bible Translation** dropdown shows full names; KJV is selected
- [ ] Select World English Bible — lands at top on new translation; navigate to same passage hash, verse visible
- [ ] Select Webster Bible — same pattern on `/websters-bible/read`, verse visible after navigation
- [ ] Toolbar divider appears below download bar, above Bible text

## Legacy URLs

- [ ] `/king-james-bible/genesis/1/#v16` → `/king-james-bible/read#genesis-1-v16`

## Error handling

- [ ] With dev server but no prebuild: visitor-safe copy (“Scripture data could not be loaded…”) and Retry — not a blank page. Locally run `npm run prebuild` then refresh.
- [ ] Block `/search/*.json` in DevTools Network — search shows error in results area

## Mobile (≤900px)

- [ ] **Books & topics** opens off-canvas drawer (sidebar is not stacked above content)
- [ ] Drawer closes on backdrop tap or Escape
- [ ] Back-to-top button appears after scrolling; does not overlap verse toolbar
- [ ] Search, autocomplete, topic buttons, and verse toolbar buttons are tappable (44px min)
- [ ] On narrow screens (≤600px), search input and result **← / →** stack without horizontal overflow
- [ ] Chapter download remains usable in drawer layout

## Downloads

- [ ] Full Bible TXT / MD / PDF links work from reader page
- [ ] Per-chapter TXT / MD / PDF from chapter download bar match the active chapter

### PDF appearance (chapter downloads)

PDFs are pre-generated at build time (PDFKit), not exported from the live reader DOM. After changing PDF layout, regenerate artifacts before QA.

**Expected layout (white, print-friendly):**

1. Translation title (gold, e.g. Webster Bible)
2. `Free from https://blessedtxts.com` (muted link)
3. Book name (dark, gold underline rule)
4. Chapter label matching the reader (gold, e.g. **Genesis 1** — not "Chapter 1")
5. Verses: gold verse numbers, dark body text, **same left margin on every verse** (no staircase indent)

**Regenerate commands:**

```bash
npm run downloads:sample   # Quick QA: webster/genesis/1.pdf, kjv/john/3.pdf
npm run downloads          # Full set (~3,500 chapter PDFs, 30+ min); omit SKIP_PDF
npm run downloads:kjv      # One translation (helps on OneDrive sync issues)
npm run downloads:web
npm run downloads:webster
npm run downloads:fast     # TXT + MD only (SKIP_PDF=1)
```

If `npm run downloads` fails with `UNKNOWN` open errors, pause OneDrive sync and retry, or run per-translation commands above.

Production deploy (`npm run build:fast`) skips PDF generation; only PDFs committed under `public/downloads/` are served. Commit regenerated PDFs after `npm run downloads` or `downloads:sample`.

**Spot-check:** Open `public/downloads/webster/genesis/1.pdf` — verses 1, 2, and 21 should align on the left.

## Automated regression (local)

```bash
npm test
npm run test:smoke
npm run build:fast
npm run test:e2e
```

E2E covers: keyword network guard (no index / verse map), reference search (`Jn 3:16`, `Genesis 1`), verse toolbar + bookmarks, mobile drawer, translation dropdown + hash, topics.
