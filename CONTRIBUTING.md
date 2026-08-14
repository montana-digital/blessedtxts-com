# Contributing to Blessed Texts

Thanks for helping improve this project. The site is a static [Astro](https://astro.build) app; Bible JSON and search indexes are generated before the Astro build.

## Prerequisites

- Node.js 20
- npm

## Local setup

```bash
npm install
npm run dev:full
```

`dev:full` runs **prebuild** (parse Bible text, search indexes, chapter JSON, assets) then `astro dev`. Run `npm run prebuild` again after changing `data/raw/` or `data/topics/`.

```bash
npm run check
npm test
npm run test:smoke
```

End-to-end tests need a built `dist/`:

```bash
npm run build:fast
npm run test:e2e
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run prebuild` | Parse Bibles, search indexes, copy chapter JSON, generate assets |
| `npm run dev` | Astro dev server (expects prebuild artifacts) |
| `npm run dev:full` | Prebuild + dev server |
| `npm run build:fast` | Production-style build without PDFs (Cloudflare Pages) |
| `npm run check` | `astro check` (TypeScript) |
| `npm test` | Unit tests (Vitest) |
| `npm run test:smoke` | Artifact / SEO smoke checks |
| `npm run test:e2e` | Playwright (needs `dist/`) |

## Project layout

- `src/pages/` — routes
- `src/components/` and `src/layouts/` — UI
- `src/lib/` — shared, build-safe logic
- `src/scripts/` — browser modules
- `scripts/` — Node prebuild pipeline
- `data/raw/` — public-domain Bible source text
- `data/canon.json` — book lists, slugs, and aliases (single source of truth)

Generated files under `src/data/`, `public/bibles/`, `public/search/`, and `public/downloads/` are gitignored.

## Pull requests

- Keep changes focused; match existing naming (`reader-*` scripts, PascalCase components).
- Prefer `@/` imports for files under `src/`.
- Do not commit generated Bible JSON, search indexes, or `.env` / `indexnow.config.json`.
- Manual reader QA: [docs/qa-reader.md](docs/qa-reader.md).

## License

By contributing, you agree that your contributions are licensed under the MIT License.
