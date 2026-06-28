# eglny.com — site source (monorepo)

**Public site:** https://eglny.com · GitHub Pages repo [`cPALSs/eglny`](https://github.com/cPALSs/eglny)

Unified LNY hub — home, get involved, about, **2026 sponsors**, **Build the Festival (LNY only)** at `/build/`.

## Pages

| Path | File |
|------|------|
| `/` | `index.html` |
| `/team.html` | Director recruitment / join the team (from `data/site.json`) |
| `/about.html` | Tết + coalition |
| `/sponsors.html` | 2026 sponsor recognition |
| `/build/?festival=lny2027` | Interactive sponsor builder (LNY only) |
| `/2026/sponsors.html` | Redirects to `/sponsors.html` |

## Content

- **`data/site.json`** — recruitment + about copy ([Open Leadership Roles](../Open%20Leadership%20Roles%20-%20Recruitment%20Copy.md))
- **`data/lny-2027.json`** — Build the Festival data (from `build_lny_budget.py`)
- **`data/lny-2026-sponsors-display.json`** — public sponsor logos/tiers *(reconcile tiers before launch)*

## Local preview

```bash
cd "Projects - Lunar New Year/2027/Marketing/eglny-site"
python3 -m http.server 8765
```

- http://localhost:8765/
- http://localhost:8765/team.html
- http://localhost:8765/build/?festival=lny2027
- http://localhost:8765/sponsors.html

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
