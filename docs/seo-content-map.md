# SEO content map — Blessed Texts

Query clusters we can serve with current public-domain KJV, WEB, and Webster texts. Hubs stay unique; chapter pages carry the verse corpus.

## Hubs (thicken, do not duplicate)

| URL | Role |
|-----|------|
| `/` | Verse generator + crawlable intro |
| `/indexed-bible/` | Book index for all three translations |
| `/topics/`, `/topics/{topic}/` | “Bible verses about X” |
| `/translations/{slug}/` | Translation history, license, FAQ |
| `/downloads/` | TXT / Markdown (and optional PDF) |
| `/{version}/read/` | Full searchable reader (human app) |

## Money pages (chapter and book HTML)

Every book and chapter for King James, World English, and Webster:

- Book: `/{version}/{book}/`
- Chapter: `/{version}/{book}/{chapter}/` with verse ids `#v{n}`

These URLs target queries such as “John 3:16 KJV”, “Psalm 23 WEB”, and “Genesis 1 Webster”. There are no per-verse URLs.

Version roots `/{version}/` stay 301 to the Indexed Bible (noindex). `/bible-versions/` stays 301 to About.

## Topic clusters

Existing: hope, comfort, love, faith, strength, peace, forgiveness, wisdom, fear, joy.

Added: prayer, anxiety, healing, salvation, children, marriage, money, patience, humility, thanksgiving, sorrow, anger, guidance, protection.

Each topic page uses a unique lead paragraph plus King James excerpts.

## Agent surfaces

- `/llms.txt` and `/.well-known/llms.txt` (identical)
- `/bibles/{version}/{book}/{chapter}.json` (CORS)
- `/downloads/{version}/...` TXT and Markdown (CORS)
- `GET /api/v1/verse` and `GET /api/v1/chapter` (OpenAPI at `/api/v1/openapi.json`)
