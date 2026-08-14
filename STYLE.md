# eglny.com — style conventions

Canonical public site: [eglny.com](https://eglny.com) · source: this folder (`Operations/Sites/eglny`).

Use this when writing nav labels, page titles, section headings, buttons, and body copy.

---

## Brands (locked casing)

| Name | Kind | Always write as | Never |
|------|------|-----------------|-------|
| **Fund The Festival** | Branded **tool** (interactive sponsor registry) | `Fund The Festival` | fund the festival, Fund the Festival, FTF in public UI* |
| **Custom Zones** | Branded **product** (named festival map corners) | `Custom Zones` | custom zones, Custom zones, Custom Zone (unless singular on purpose) |
| **Soul Torrent** | Branded Saturday theatrical product | `Soul Torrent` | soul torrent |
| **Elk Grove Lunar New Year Tết** | Festival / site name | Keep **Tết** with diacritic | Tet / TET in visitor-facing copy |

\* `FTF` is fine in internal notes and code comments, not in public nav or H1s.

Brand names keep this casing **everywhere**: nav, H1, buttons, mid-sentence prose, meta titles.

```text
✓ Build a package in Fund The Festival.
✓ Explore Custom Zones for a named corner on the map.
✗ Build a package in fund the festival.
✗ Explore custom zones for a named corner…
```

URL paths stay kebab-case (`/fund-the-festival/`, `/custom-zones/`) — paths are not brand strings.

---

## Capitalization

### Nav + page titles (H1) — Title Case for destinations

Use **Title Case** for top-level and submenu destinations that are proper names or short page names:

- Home, About, Team, Production, Resources
- Roster, Open Roles, Sponsorship, Volunteering, Media, Blog
- Brands as locked: Fund The Festival, Custom Zones, RFPs

**Exceptions (sentence case in nav)** — descriptive phrases, not product names:

- Vendor booths
- 2026 archive (year + common noun)

Acronyms stay as acronyms: **RFPs**, **LNY**, **FAQ**, **EGLNY**.

### Section headings + TOC — sentence case

In-page `h2` / `h3` and “On this page” labels use **sentence case**:

- Partner with us
- Open lots
- Join the waitlist
- What is a director?
- Day-of help
- Apply & get involved

Still capitalize brands and proper nouns inside them: “Start your Custom Zones inquiry”.

### Browser `<title>`

Prefer the same string as the page H1 (with brand casing). Avoid relying on automatic Title Case transforms to “fix” authored copy — author the final string.

---

## Buttons vs links

| Use | When |
|-----|------|
| **Button** (`.btn`) | Standalone action the reader should take on this page |
| **Text link** | In-prose reference (named page inside a sentence, related lot, footnote) |

### Button hierarchy (one primary per page)

| Class | Role | Examples |
|-------|------|----------|
| `.btn-primary` | **One** conversion per page | Apply on Idealist, Join the waitlist, Email inquiry, Email your proposal |
| `.btn-secondary` | Other important paths | Fund The Festival, path choosers, Register as vendor |
| `.btn-tertiary` | Optional / supporting | Sponsorship packet PDF, Discord, Close, See the registry |

Do not use a bare “→” text link for a CTA that should be a button.

Path-finder controls that only scroll the page (e.g. Custom Zones DIY / Help) are **secondary**, not primary — the page primary is the contact action.

---

## Back links

- Top-level Production destinations (Vendor booths, Custom Zones, RFPs, Sponsorship, …) — **no** “← Production” back link; the main nav is enough.
- Nested detail pages (individual RFPs) — **yes** back to the parent index (`← RFPs`).

---

## Voice (short)

- Direct, concrete, festival-visitor or partner facing.
- Prefer “you” for the reader; avoid org jargon in public UI.
- Vietnamese in public bilingual contexts: follow NAVV / vi-US (not mainland admin defaults) when Vietnamese copy is added.

---

## Checklist for new pages

1. Is the name a **brand**? → locked casing table above.
2. Nav label + H1: Title Case (or brand / sentence-case exception).
3. Section headings: sentence case.
4. Exactly **one** `.btn-primary` visible on the page.
5. Cross-references in muted notes → inline text links, not extra primaries.
6. No hub back-link if the page is already in Production (or Resources) nav.
