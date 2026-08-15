# Site assets

## Social share image

Add `og-default.jpg` here (1200×630 recommended). The SEO build script will automatically emit `og:image` and `twitter:image` tags when this file exists.

## Menu viewer (`menu-viewer/`)

Guest food-menu UI copied from Festival Network food-curation-engine:

`Operations/Festival Network/shared/tools/food-curation-engine/menu-viewer.{js,css}` (+ `menu-filters.js`, `menu-legend.js`, `menu-cuisine.js`).

Used by `/food-menu/`. Re-copy when the engine viewer changes. Data: `../data/food-menu.json` (publish from `lny-2026-applicants.json` via `publish_public_menu(..., items_source="capability")`).

Browse tabs: **By cuisine** (default; snacks double-list under cuisine + Snacks; Drinks last) · **By vendor** · **By diet**. Optional item `note` renders as a muted second line.