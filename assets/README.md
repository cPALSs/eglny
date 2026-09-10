# Site assets

## Lion dance group avatars (`lion-dance/`)

Cached Instagram profile pictures for `/resources/lion-dance/`. Named after the handle (`eastern_ways.jpg`, `redlotus-official.jpg`). Do not hotlink Instagram CDN URLs — they expire. Re-download from the live profile if an avatar goes stale.

## Social share image

## Social share image

## Social share image

`og-default.jpg` (1200×630) is the Open Graph / Twitter card for eglny.com. Current art is the 2027 Crane Child graphic. After replacing this file, run the festival SEO build so `?v=` cache-busts Facebook/Slack scrapers.

## Menu viewer (`menu-viewer/`)

Guest food-menu UI copied from Festival Network food-curation-engine:

`Operations/Festival Network/shared/tools/food-curation-engine/menu-viewer.{js,css}` (+ `menu-filters.js`, `menu-legend.js`, `menu-cuisine.js`).

Used by `/food-menu/`. Re-copy when the engine viewer changes. Data: `../data/food-menu.json` (publish from `lny-2026-applicants.json` via `publish_public_menu(..., items_source="capability")`).

Browse tabs: **By cuisine** (default; snacks double-list under cuisine + Snacks; Drinks last) · **By vendor** · **By diet**. Optional item `note` renders as a muted second line.