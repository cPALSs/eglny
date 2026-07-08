# eglny.com — site source (monorepo)

**Public site:** https://eglny.com · GitHub Pages repo [`cPALSs/eglny`](https://github.com/cPALSs/eglny)

Unified LNY hub — home, team, about, **Production** (Fund The Festival), **Resources** (sponsors + media).

## Pages

| Path | File |
|------|------|
| `/` | `index.html` |
| `/team/` | Director recruitment / join the team (from `data/site.json`) |
| `/about/` | Tết + coalition |
| `/fund-the-festival/` | Interactive sponsor registry (LNY only) — under **Production** |
| `/custom-zones/` | Placeholder redirect → [greatlantern.com/custom-zones/](https://greatlantern.com/custom-zones/) until LNY launches its own page |
| `/resources/` | Resources hub |
| `/resources/season/` | **Lunar New Year Season** calendar — under **Resources** |
| `/sponsors/` | 2026 sponsor recognition — under **Resources** |
| `/resources/media/` | Press and festival YouTube embeds — under **Resources** |
| `/resources/blog/` | **Blog** — SEO-safe planning notes (generated from shared markdown) — under **Resources** |
| `/build/` | Redirect → `/fund-the-festival/` |
| `/2026/sponsors.html` | Legacy 2026 sponsors page |

Legacy redirects (via `clean-urls.js`): `/team.html` → `/team/`, `/about.html` → `/about/`, `/sponsors.html` → `/sponsors/`, `/get-involved.html` → `/team/`.

## Content

- **`data/site.json`** — recruitment + about copy ([Open Leadership Roles](../Open%20Leadership%20Roles%20-%20Recruitment%20Copy.md))
- **`data/lny-2027.json`** — Fund The Festival data (from `build_lny_budget.py`)
- **`data/season-events.json`** — LNY Season list (from LNY market landscape Sheet)
- **`data/lny-2026-sponsors-display.json`** — public sponsor logos/tiers *(reconcile tiers before launch)*
- **`resources/blog/`** — static blog pages (generated; do not edit HTML by hand)

### Blog

Source markdown lives in [`Festival Network/shared/content/blog/`](../../../../Festival%20Network/shared/content/blog/). Rebuild after editing:

```bash
node "Festival Network/scripts/build-festival-site-blog.mjs" --site eglny
# or both sites:
npm run blog:build --prefix "Festival Network"
```

The publish script runs this automatically before rsync.

```bash
node "Festival Network/scripts/export-eglny-season-events.mjs"
```

## Local preview

```bash
cd "Projects - Lunar New Year/2027/Marketing/eglny-site"
python3 -m http.server 8765
```

- http://localhost:8765/
- http://localhost:8765/team/
- http://localhost:8765/fund-the-festival/
- http://localhost:8765/resources/
- http://localhost:8765/resources/season/
- http://localhost:8765/sponsors/
- http://localhost:8765/resources/media/
- http://localhost:8765/resources/blog/

Refresh season events from the landscape Sheet:

From monorepo root (rsyncs this folder → [`Sites/eglny`](../../../../Sites/eglny); edit **here**, not in `Sites/`):

```bash
git clone git@github.com:cPALSs/eglny.git Sites/eglny   # once
./scripts/publish_eglny_site.sh
cd Sites/eglny && git add -A && git commit -m "Update site" && git push
```

Regenerates LNY JSON via `build_lny_budget.py`, then rsyncs this folder to the publish clone. See [`Sites/README.md`](../../../../Sites/README.md).

## SEO

Built automatically on publish (`build-festival-site-seo.mjs` + `build-festival-site-sitemap.mjs`):

- `robots.txt` and `sitemap.xml` at site root
- Canonical, Open Graph, and Twitter meta on all primary pages
- Prerendered static HTML in `<main>` for crawlers (from `data/site.json`)
- Event + Organization JSON-LD on homepage

Optional share image: add `assets/og-default.jpg` (1200×630) — see [`assets/README.md`](assets/README.md).

**Google Search Console** (after property verified + OAuth re-run with webmasters scope):

```bash
node "Festival Network/scripts/search-console-eglny.mjs" submit-sitemap
node "Festival Network/scripts/search-console-eglny.mjs" inspect-urls
```

Manual (UI only): URL Inspection → Request indexing for key pages; link GSC to GA4.

## Launch checklist

See [EGLNY Website - Launch Checklist.md](../EGLNY%20Website%20-%20Launch%20Checklist.md) — Cloudflare DNS cutover, GitHub Pages custom domain, sponsor asset migration.

## Link policy

No monorepo paths in public JSON or HTML — [.cursor/rules/github-pages-public-sites.mdc](../../../../.cursor/rules/github-pages-public-sites.mdc)
