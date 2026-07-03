# eglny.com — site source (monorepo)

**Public site:** https://eglny.com · GitHub Pages repo [`cPALSs/eglny`](https://github.com/cPALSs/eglny)

Unified LNY hub — home, team, about, **2026 sponsors**, **Fund The Festival (LNY only)** at `/fund-the-festival/`.

## Pages

| Path | File |
|------|------|
| `/` | `index.html` |
| `/team/` | Director recruitment / join the team (from `data/site.json`) |
| `/about/` | Tết + coalition |
| `/sponsors/` | 2026 sponsor recognition |
| `/fund-the-festival/` | Interactive sponsor registry (LNY only) |
| `/build/` | Redirect → `/fund-the-festival/` |
| `/2026/sponsors.html` | Legacy 2026 sponsors page |

Legacy redirects (via `clean-urls.js`): `/team.html` → `/team/`, `/about.html` → `/about/`, `/sponsors.html` → `/sponsors/`, `/get-involved.html` → `/team/`.

## Content

- **`data/site.json`** — recruitment + about copy ([Open Leadership Roles](../Open%20Leadership%20Roles%20-%20Recruitment%20Copy.md))
- **`data/lny-2027.json`** — Fund The Festival data (from `build_lny_budget.py`)
- **`data/lny-2026-sponsors-display.json`** — public sponsor logos/tiers *(reconcile tiers before launch)*

## Local preview

```bash
cd "Projects - Lunar New Year/2027/Marketing/eglny-site"
python3 -m http.server 8765
```

- http://localhost:8765/
- http://localhost:8765/team/
- http://localhost:8765/fund-the-festival/
- http://localhost:8765/sponsors/

## Publish

```bash
git clone git@github.com:cPALSs/eglny.git ~/eglny   # once
/Users/bao/cPALSs/scripts/publish_eglny_site.sh ~/eglny
cd ~/eglny && git add -A && git commit -m "Update site" && git push
```

Regenerates LNY JSON via `build_lny_budget.py`, then rsyncs this folder to the publish repo.

## Launch checklist

See [EGLNY Website - Launch Checklist.md](../EGLNY%20Website%20-%20Launch%20Checklist.md) — Cloudflare DNS cutover, GitHub Pages custom domain, sponsor asset migration.

## Link policy

No monorepo paths in public JSON or HTML — [.cursor/rules/github-pages-public-sites.mdc](../../../../.cursor/rules/github-pages-public-sites.mdc)
