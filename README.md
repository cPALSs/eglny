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
| `/resources/` | Resources hub |
| `/resources/season/` | **Lunar New Year Season** calendar — under **Resources** |
| `/sponsors/` | 2026 sponsor recognition — under **Resources** |
| `/resources/media/` | Press and festival YouTube embeds — under **Resources** |
| `/build/` | Redirect → `/fund-the-festival/` |
| `/2026/sponsors.html` | Legacy 2026 sponsors page |

Legacy redirects (via `clean-urls.js`): `/team.html` → `/team/`, `/about.html` → `/about/`, `/sponsors.html` → `/sponsors/`, `/get-involved.html` → `/team/`.

## Content

- **`data/site.json`** — recruitment + about copy ([Open Leadership Roles](../Open%20Leadership%20Roles%20-%20Recruitment%20Copy.md))
- **`data/lny-2027.json`** — Fund The Festival data (from `build_lny_budget.py`)
- **`data/season-events.json`** — LNY Season list (from LNY market landscape Sheet)
- **`data/lny-2026-sponsors-display.json`** — public sponsor logos/tiers *(reconcile tiers before launch)*

Refresh season events from the landscape Sheet:

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

## Publish

From monorepo root (rsyncs this folder → [`Sites/eglny`](../../../../Sites/eglny); edit **here**, not in `Sites/`):

```bash
git clone git@github.com:cPALSs/eglny.git Sites/eglny   # once
./scripts/publish_eglny_site.sh
cd Sites/eglny && git add -A && git commit -m "Update site" && git push
```

Regenerates LNY JSON via `build_lny_budget.py`, then rsyncs this folder to the publish clone. See [`Sites/README.md`](../../../../Sites/README.md).

## Launch checklist

See [EGLNY Website - Launch Checklist.md](../EGLNY%20Website%20-%20Launch%20Checklist.md) — Cloudflare DNS cutover, GitHub Pages custom domain, sponsor asset migration.

## Link policy

No monorepo paths in public JSON or HTML — [.cursor/rules/github-pages-public-sites.mdc](../../../../.cursor/rules/github-pages-public-sites.mdc)
