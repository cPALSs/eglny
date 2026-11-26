# LSDS Migration & Custom Code Inventory (`eglny.com`)

Synced to `cPALSs/design-system@7a3cbdd` (`vendor/lsds/lsds.css`, `vendor/lsds/themes/eglny.css`, `vendor/lsds/lsds.iife.js`) plus kerned Vietnamese Metropolis `.woff2` fonts in `assets/fonts/`.

## 1. Removed / Migrated to LSDS

| Area | Before | After | Reduction |
|---|---:|---:|---:|
| `site.css` | 5,732 lines | 4,737 lines | **−995 lines (−17.4%)** |
| `site.js` | 3,982 lines | 3,982 lines | 0 lines (markup class migration; `initNavMenu` and `doc-scroll.js` already delegated to `window.LSDS`) |

### What migrated

- **Nav shell (`.site-nav*` → `.ls-nav*`)**: Removed ~510 lines of duplicated bar, hamburger toggle, backdrop, drawer, link-stack, desktop dropdown submenu, and drawer-footer CSS from `site.css`. Updated `site.js` `renderNav()` / `renderNavLinks()` to emit `.ls-nav*` classes (retaining `.site-nav` on `<nav>` for `fund-the-festival/app.js` detection without editing `fund-the-festival/`).
- **Doc layout, sticky TOC, pager & heading permalinks (`.site-doc-*` & `.host-doc-*` → `.ls-doc-*`)**: Removed ~465 lines of duplicated layout grid, sticky TOC, TOC pager, heading anchor (`#` copy-link + `Copied!`/`Copy failed` states), and Custom Zones `.host-doc-*` duplicate CSS from `site.css`. Updated `site.js` (`renderDocToc`, `wrapDocLayout`, `renderHostToc`, `renderHostActivations`, section templates) and static blog page `resources/blog/planning-sustainable-community-festivals/index.html` to `.ls-doc-*`.
- **Sponsor grid & logo cards (`.sponsor-tier` / `.sponsor-grid` / `.sponsor-card` → `.ls-sponsor-*`)**: Removed ~115 lines of duplicated tier heading, responsive grid, centered homepage flex variant, aspect-ratio card, dark-plate, and centered logo CSS plus legacy `--sponsor-card-*` root aliases from `site.css`. Updated `site.js` `renderSponsorTierHtml()` to emit `.ls-sponsor-*` and `--ls-sponsor-card-bg` / `--ls-sponsor-opacity`.
- **Resets, utilities & tokens**: Removed redundant `* { box-sizing: border-box }` and `.sr-only` (switched `site.js` to `.ls-sr-only`); scoped unlayered `a:not([class*="ls-"])` and `.panel h2:not(.ls-sponsor-tier-heading), .content-section h2:not(.ls-sponsor-tier-heading)` so unlayered site rules do not override `@layer lsds.*` primitives/patterns; replaced hardcoded copy-badge hexes (`#137333`, `#e6f4ea`, `#b42318`, `#fdecea`) via LSDS tokens and `.error-panel` `#f87171` with `var(--ls-destructive)`.

---

## 2. Remaining Custom CSS/JS & Future LSDS Candidates

### Standalone site-specific apps (left untouched)

| File(s) | Purpose | Why custom | Future LSDS candidate? |
|---|---|---|---|
| `fund-the-festival/styles.css`, `fund-the-festival/app.js` | **Fund The Festival** interactive sponsor gift registry (tier cart, revenue progress, modals, pledge builder) | Bespoke multi-state registry & budget-bar app with its own data schema and interactive cart | **Yes** — shares core pattern with Toy Drive's `fund-the-fete` (gift registry cards, funding progress bar, cart/pledge sheet) |
| `assets/menu-viewer/*` (`menu-viewer.css`, `menu-viewer.js`, `menu-cuisine.js`, `menu-filters.js`, `menu-legend.js`) | Interactive festival food menu viewer (cuisine chips, dietary legend, filter sheets) | Dedicated food-directory viewer shared across menu embeds | **Maybe** — filter-chip bar & bottom sheet already overlap `ls-chip` / `ls-sheet` |
| `food/app.js`, `attractions/food/*` | Food menu page mount & legacy attractions food view | Page-specific JSON loader / embed glue | No |
| `kids-village/feed.css`, `kids-village/app.js` | Kids Village activity feed | Page-specific visual feed layout | No |
| `vendors-list/app.js` | Public vendor directory page mount | Page-specific JSON loader | No |
| `hero-orb.js` | Homepage Golden Goat hero orb/ambient visual | Single-page hero art treatment | No |
| `clean-urls.js`, `analytics.js` | Local/GitHub Pages clean-URL helper & GA4 init | Site infrastructure | No |
| `doc-scroll.js` | Thin 23-line compatibility shim (`window.DocScroll` → `window.LSDS.initDocScroll` / `refreshTocPager`) | Preserves `window.DocScroll` API for inline page scripts across ~20 HTML pages | No (remove once inline HTML scripts call `window.LSDS` directly) |

### Major remaining custom sections in `site.css` / `site.js`

| Section | Purpose | Why custom | Future LSDS candidate? |
|---|---|---|---|
| **Nav chrome overrides** (`site.css` `#site-nav`, `.site-nav-symbol`, `.site-nav-logotype`, `.site-nav-social*`, mobile 2×2 section order, opaque mobile bar) | EGLNY lion emblem + SVG-masked logotype (dark cream / light red), social icon pills, 4-quadrant mobile nav ordering | Brand-specific logotype mask and EGLNY's 4-section mobile grid ordering | **Partial** — social icon slot and hover-parent submenu highlight could live in `nav-shell` |
| **Light/dark theme toggle** (`site.js` `initTheme` / `renderThemeControl`, `site.css` `.icon-btn`, `.theme-toggle`) | Persists `eglny-theme` in `sessionStorage` and syncs `data-theme` + `data-ls-scheme` | Explicitly kept untouched; uses EGLNY's existing `eglny-theme` key and circular `.theme-toggle` chrome | **Yes** — `LSDS.initSchemeToggle` already exists; can consolidate once storage key / circular button style aligns |
| **Doc-layout & TOC overrides** (`site.css` hero-to-TOC grid gutter, `.site-doc-toc-filter`, `.ls-doc-toc-link--sub`, `.host-doc-main .doc-heading`) | Aligns page hero with 2-column doc layout; History page's Trung Thu filter checkbox (kept visible on mobile); sub-level TOC indent; Custom Zones flex heading | Page-specific behaviors (History filter, Custom Zones heading badges) | **Partial** — `.ls-doc-toc-link--sub` (nested TOC indent) and hero-gutter alignment are clean LSDS `doc-layout` candidates |
| **Sponsor doc-section spacing** (`site.css` `.page-wrap--doc .ls-sponsor-tier.ls-doc-section`, `.home-sponsors-2027`) | Drops hairlines between consecutive sponsor tiers on `/sponsorship/` and raises `--ls-sponsor-min` on homepage | Layout rhythm specific to EGLNY's multi-year sponsorship page | No (thin CSS var/margin override as intended by LSDS) |
| **Homepage Golden Goat hero, meta pill & co-host lockup** (`site.css`, `site.js` `renderFestivalHero`, `renderFestivalHosts`) | Full-bleed poster banner, red/iridescent date/location/admission bar, cPALSs + VACOS + NVCC host badges | Festival-specific brand hero | No |
| **Footer** (`site.css` `.site-footer*`, `site.js` `renderFooter`) | 4-column desktop / compact mobile sitemap + social + contact + co-host credit | Site-specific sitemap structure | **Yes** — multi-column coalition site footer is shared across EGLNY, Great Lantern, and cPALSs sites |
| **Resource / action card grid** (`site.css` `.resource-card*`, `.vendors-apply-paths`) | 2-column destination cards (Sponsorship, Production, Resources, Vendors Round 1/2 apply paths) | Referenced by static SEO prerender HTML across multiple pages + custom CTA baseline stretch | **Yes** — closely parallels `.ls-card` / `.ls-card-grid`; candidate for incremental migration when prerender templates are updated |
| **Team roster, director lanes & media modals** (`site.css` `.roster-*`, `.lane-*`, `.modal-*`, `site.js` `renderRoster*`, `initRosterMedia`) | Photo/initials cards, Instagram reel & vision modals, volunteer lane cards | Rich EGLNY team/recruiting presentation | No |
| **Vendor booths, inventory table & RFPs** (`site.css` `.site-doc-table*`, `.inventory-table`, `.booth-flow-list`, `site.js` `renderVendorsBoothsPage`, `renderInventoryTable`) | Author-locked booth inventory table, Round 1/2 process list, RFP briefs | Domain-specific vendor ops UI | **Partial** — `.site-doc-table` could adopt experimental `.ls-table` once promoted |
| **Custom Zones** (`site.css` `.host-*`, `.zone-diagram-*`, `site.js` `renderHostActivations`, `renderZoneDiagramSvg`) | Interactive DIY vs. full-service prompt, SVG zone footprint diagrams, add-on carousel, case-study cards | Bespoke sponsorship product page | No |
| **Season calendar, Lion Dance directory, Vendor directory, Media embeds, Poster wall, History & Blog** (`site.css`, `site.js`) | Greater Sacramento LNY season list with certainty legend, troupe directory, vendor avatar directory, lazy YouTube/IG embeds, historical timeline, blog prose | Editorial & community-directory pages specific to `eglny.com` | **Partial** — season calendar certainty list is shared with `greatlantern.com` |
