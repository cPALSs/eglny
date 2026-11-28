import { WARNING_EMOJI, tagEmojiMeta, setupIconLegendToggle, buildIconLegendHtml } from "./menu-legend.js";
import {
  FILTER_GROUPS,
  FILTER_LABELS,
  renderFilterGroupsHtml,
  attachFilterHandlers,
  filterMatchesTag,
} from "./menu-filters.js";
import {
  CUISINE_ORDER,
  CUISINE_LABELS,
  cuisineChipLabel,
  MEAL_CUISINE_IDS,
  DISH_TYPE_ORDER,
  DISH_TYPE_LABELS,
  DRINK_SUBCATEGORY_ORDER,
  DRINK_SUBCATEGORY_LABELS,
  cuisineSectionsForItem,
  classifyCuisines,
  dishTypeSectionsForItem,
  classifyDrinkSubcategory,
  ITEM_NOTE_MAX_LEN,
} from "./menu-cuisine.js";

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderBadge(meta, className) {
  return `<button type="button" class="tag ${className} diet-badge" aria-label="${escapeHtml(meta.label)}">
    <span class="tag-emoji" aria-hidden="true">${meta.emoji}</span>
    <span class="tag-tip" role="tooltip">${escapeHtml(meta.label)}</span>
  </button>`;
}

function renderDietaryBadges(item) {
  const warnings = item.dietary_warnings || [];
  const tags = item.dietary_tags || [];
  if (!warnings.length && !tags.length) return "";

  const parts = [];
  const seenTagLabels = new Set();
  for (const w of warnings) {
    const meta = WARNING_EMOJI[w];
    if (meta) parts.push(renderBadge(meta, "tag-warn"));
  }
  for (const t of tags) {
    const meta = tagEmojiMeta(t);
    if (!meta || seenTagLabels.has(meta.label)) continue;
    seenTagLabels.add(meta.label);
    parts.push(renderBadge(meta, "tag-safe"));
  }
  return parts.length ? `<span class="dietary-badges">${parts.join("")}</span>` : "";
}

function setupDietBadgeHandlers(root) {
  root.addEventListener("click", (e) => {
    const badge = e.target.closest(".diet-badge");
    if (badge) {
      e.preventDefault();
      e.stopPropagation();
      const wasOpen = badge.classList.contains("is-open");
      root.querySelectorAll(".diet-badge.is-open").forEach((b) => b.classList.remove("is-open"));
      if (!wasOpen) badge.classList.add("is-open");
      return;
    }
    root.querySelectorAll(".diet-badge.is-open").forEach((b) => b.classList.remove("is-open"));
  });
}

function itemMatchesFilter(item, vendor, f) {
  const tags = new Set([...(item.dietary_tags || []), ...(vendor.dietary || [])]);
  for (const t of tags) {
    if (filterMatchesTag(f, t)) return true;
  }
  return false;
}

function itemMatchesFilters(item, vendor, activeFilters) {
  if (activeFilters.size === 0) return true;
  for (const f of activeFilters) {
    if (!itemMatchesFilter(item, vendor, f)) return false;
  }
  return true;
}

function itemMatchesQuery(item, vendor, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const hay = [
    item.name,
    item.note,
    item.options,
    vendor.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function filteredVendors(menu, activeFilters, query) {
  return menu.vendors
    .map((v) => ({
      ...v,
      items: v.items.filter((i) => itemMatchesFilters(i, v, activeFilters) && itemMatchesQuery(i, v, query)),
    }))
    .filter((v) => v.items.length);
}

function hasBoothLabel(vendor) {
  return Boolean(String(vendor.booth_label ?? "").trim());
}

/** Assigned booths first (F01, V02, …); unassigned vendors A→Z by name. */
export function compareVendorsByLocation(a, b) {
  const aAssigned = hasBoothLabel(a);
  const bAssigned = hasBoothLabel(b);
  if (aAssigned && bAssigned) {
    return String(a.booth_label).localeCompare(String(b.booth_label), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }
  if (aAssigned !== bAssigned) return aAssigned ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

function sortVendorsByLocation(vendors) {
  return [...vendors].sort(compareVendorsByLocation);
}

function truncateField(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.length > ITEM_NOTE_MAX_LEN ? `${text.slice(0, ITEM_NOTE_MAX_LEN - 1)}…` : text;
}

const PLACEHOLDER_VARIANT_COUNT = 6;

function hashString(value) {
  let h = 2166136261;
  const s = String(value || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable key for placeholder rings: one variant per vendor booth, not per dish. */
function placeholderVariantKey(item, vendor) {
  const vid = vendor?.id ?? item?.vendorId ?? item?.vendor_id;
  if (vid != null && String(vid).trim() !== "") return String(vid).trim();
  const vname = String(item?.vendorName ?? vendor?.name ?? "").trim();
  return vname;
}

function placeholderVariant(item, vendor = null) {
  return hashString(placeholderVariantKey(item, vendor)) % PLACEHOLDER_VARIANT_COUNT;
}

/** Site-root-relative paths in JSON → absolute from site root. */
function resolveImageSrc(src) {
  const raw = String(src || "").trim();
  if (!raw) return "";
  if (/^(https?:|data:|\/)/i.test(raw)) return raw;
  return `/${raw.replace(/^\.\//, "")}`;
}

function renderItemThumb(item, vendorContext = null) {
  const src = resolveImageSrc(item?.image);
  const title = String(item?.name || "Dish");
  const vendor = String(item?.vendorName || vendorContext?.name || "");
  const credit = String(item?.image_credit || "");
  const alt = String(item?.image_alt || title);
  const variant = placeholderVariant(item, vendorContext);

  if (src) {
    return `<button type="button" class="item-thumb has-photo" data-dish-src="${escapeHtml(src)}" data-dish-alt="${escapeHtml(alt)}" data-dish-title="${escapeHtml(title)}" data-dish-vendor="${escapeHtml(vendor)}" data-dish-credit="${escapeHtml(credit)}" aria-label="${escapeHtml(`View photo of ${title}`)}">
      <span class="item-thumb-frame" aria-hidden="true"><img class="item-thumb-img" src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async" /></span>
    </button>`;
  }

  // Decorative only — no lightbox (placeholder zoom isn't useful).
  return `<span class="item-thumb is-placeholder item-thumb--v${variant}" aria-hidden="true">
    <span class="item-thumb-frame item-thumb-placeholder"></span>
  </span>`;
}

/** Culture chip(s) on the dish line (not a filter). Dual tags = fusion. Named drinks keep culture (e.g. Vietnamese coffee); skip unclassified Other. */
function renderCuisineChip(item, vendor = null) {
  const vendorCtx = vendor || { name: item?.vendorName, id: item?.vendorId };
  const cuisines = classifyCuisines(item, vendorCtx).filter(
    (c) => c && c !== "other" && MEAL_CUISINE_IDS.includes(c) && cuisineChipLabel(c)
  );
  if (!cuisines.length) return "";
  return cuisines
    .map((c) => `<span class="item-cuisine">${escapeHtml(cuisineChipLabel(c))}</span>`)
    .join("");
}

/** DOM id for a vendor card (`vendor-{id}`). */
function vendorCardId(vendorId) {
  const id = String(vendorId || "").trim();
  return id ? `vendor-${id}` : "";
}

function shortOptionsPreview(text) {
  if (text.length <= ITEM_NOTE_MAX_LEN) return null;
  let cut = text.slice(0, ITEM_NOTE_MAX_LEN);
  const lastBreak = Math.max(cut.lastIndexOf(", "), cut.lastIndexOf(" "));
  if (lastBreak > ITEM_NOTE_MAX_LEN * 0.55) {
    cut = cut.slice(0, lastBreak);
  }
  return cut.replace(/[,;\s]+$/, "");
}

function renderOptionsHtml(options, previewOverride) {
  const full = String(options || "").trim();
  if (!full) return "";
  const short = previewOverride ? String(previewOverride).trim() : shortOptionsPreview(full);
  if (!short || short === full) {
    return `<span class="item-options-text">${escapeHtml(full)}</span>`;
  }
  return `<span class="item-options-text" data-expandable><span class="item-options-short">${escapeHtml(short)}</span><span class="item-options-full" hidden>${escapeHtml(full)}</span> <button type="button" class="item-options-toggle" aria-expanded="false">more</button></span>`;
}

function renderItemPrimary(item, { showVendor = false, vendor = null, showCuisine = true } = {}) {
  const note = String(item?.note || "").trim();
  const options = String(item?.options || "").trim();
  const clarifyBit = note
    ? ` <span class="item-clarify">(${escapeHtml(note)})</span>`
    : "";
  const vendorId = item.vendorId || vendor?.id;
  const vendorName = item.vendorName || vendor?.name;
  const cardId = vendorCardId(vendorId);
  const vendorBit =
    showVendor && vendorName
      ? cardId
        ? `\u2003<a class="item-vendor" href="#${escapeHtml(cardId)}" data-vendor-jump="${escapeHtml(vendorId)}">${escapeHtml(vendorName)}</a>`
        : `\u2003<span class="item-vendor">${escapeHtml(vendorName)}</span>`
      : "";
  const cuisineBit = showCuisine ? renderCuisineChip(item, vendor) : "";
  // Second line: cuisine chip, then options (e.g. Filipino · rice or garlic noodles…).
  const optionsBit = renderOptionsHtml(options, item?.optionsPreview);
  const metaBits = [cuisineBit, optionsBit].filter(Boolean).join("");
  const metaBit = metaBits ? `<span class="item-meta">${metaBits}</span>` : "";
  return `<span class="item-text"><span class="item-name">${escapeHtml(item.name)}${clarifyBit}${renderDietaryBadges(item)}${vendorBit}</span>${metaBit}</span>`;
}

function renderItemRow(item, { showVendor = false, vendor = null, showCuisine = true } = {}) {
  // Public festival menu never lists prices (vendors set day-of).
  return `<div class="item-row">${renderItemThumb(item, vendor)}${renderItemPrimary(item, { showVendor, vendor, showCuisine })}</div>`;
}

const IG_ICON_SVG = `<svg class="vendor-social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`;
const FB_ICON_SVG = `<svg class="vendor-social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M13.5 20v-7.5h2.5l.4-3H13.5V8.2c0-.8.2-1.2 1.3-1.2H16.5V4.5h-2.1C11.9 4.5 10.5 5.9 10.5 8.1V9.5H8.5v3h2V20h3z" fill="currentColor" stroke="none"/></svg>`;

function normalizeInstagramUrl(handleOrUrl) {
  const raw = String(handleOrUrl || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const handle = raw.replace(/^@/, "").replace(/^instagram\.com\//i, "").replace(/\/+$/, "");
  if (!handle) return "";
  return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
}

function normalizeFacebookUrl(handleOrUrl) {
  const raw = String(handleOrUrl || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  let path = raw.replace(/^@/, "").replace(/^(www\.)?facebook\.com\//i, "").replace(/^fb\.com\//i, "");
  path = path.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!path) return "";
  if (/^profile\.php\?/i.test(path)) return `https://www.facebook.com/${path}`;
  const [slug, query] = path.split("?");
  const base = `https://www.facebook.com/${encodeURIComponent(slug)}`;
  return query ? `${base}?${query}` : `${base}/`;
}

function renderVendorSocialLinks(vendor) {
  const parts = [];
  const igHref = normalizeInstagramUrl(vendor?.instagram);
  if (igHref) {
    parts.push(
      `<a class="vendor-social vendor-ig" href="${escapeHtml(igHref)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(`Instagram · ${vendor.name || "vendor"}`)}">${IG_ICON_SVG}</a>`,
    );
  }
  const fbHref = normalizeFacebookUrl(vendor?.facebook);
  if (fbHref) {
    parts.push(
      `<a class="vendor-social vendor-fb" href="${escapeHtml(fbHref)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(`Facebook · ${vendor.name || "vendor"}`)}">${FB_ICON_SVG}</a>`,
    );
  }
  if (!parts.length) return "";
  return `<span class="vendor-socials">${parts.join("")}</span>`;
}

function vendorInitials(name) {
  const skip = new Set(["and", "the", "of", "a", "an", "&"]);
  const words = String(name || "")
    .replace(/['’]s\b/gi, "")
    .split(/[\s./_-]+/)
    .map((w) => w.replace(/[^A-Za-z0-9\u00C0-\u024F]/g, ""))
    .filter((w) => w && !skip.has(w.toLowerCase()));
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function renderVendorLogo(vendor) {
  const src = resolveImageSrc(vendor?.logo);
  if (src) {
    const alt = `${vendor.name || "Vendor"} logo`;
    return `<img class="vendor-logo" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />`;
  }
  const initials = vendorInitials(vendor?.name);
  return `<span class="vendor-logo vendor-logo--initials" aria-hidden="true">${escapeHtml(initials)}</span>`;
}

function renderVendorView(vendors) {
  return sortVendorsByLocation(vendors)
    .map((v) => {
      const logo = renderVendorLogo(v);
      const socials = renderVendorSocialLinks(v);
      const cardId = vendorCardId(v.id);
      const idAttr = cardId ? ` id="${escapeHtml(cardId)}"` : "";
      return `
    <article class="vendor-card"${idAttr}>
      <div class="vendor-card-head">
        ${logo}
        <div class="vendor-card-title">
          <h2>${escapeHtml(v.name)}</h2>${socials}
          ${v.booth_label ? `<p class="booth">${escapeHtml(v.booth_label)}</p>` : ""}
        </div>
      </div>
      <ul class="items">${v.items
        .map(
          (i) => `
        <li>${renderItemRow(i, { vendor: v })}</li>`,
        )
        .join("")}
      </ul>
    </article>`;
    })
    .join("");
}

function renderItemList(items, { showVendor = false, showCuisine = true } = {}) {
  return `<ul class="items">${items
    .map(
      (i) => `
        <li>${renderItemRow(i, { showVendor, showCuisine })}</li>`,
    )
    .join("")}
      </ul>`;
}

/** Coffee / Tea / Others under the Drinks format section. */
function renderDrinkSubgroups(items, { idPrefix = "menu-type-drinks", showCuisine = true } = {}) {
  const bySub = Object.fromEntries(DRINK_SUBCATEGORY_ORDER.map((id) => [id, []]));
  for (const item of items) {
    bySub[classifyDrinkSubcategory(item)].push(item);
  }
  return DRINK_SUBCATEGORY_ORDER.filter((id) => bySub[id].length)
    .map((sub) => {
      const rows = bySub[sub];
      rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      return `
      <div class="category-subgroup" id="${idPrefix}-${sub}">
        <h4>${escapeHtml(DRINK_SUBCATEGORY_LABELS[sub] || sub)}</h4>
        ${renderItemList(rows, { showVendor: true, showCuisine })}
      </div>`;
    })
    .join("");
}

const THEME_TOURS = [
  {
    id: "island-hopping",
    title: "Island Hopping",
    subtitle: "A Filipino & Hawaiian tasting — bite, plate, sweet, and refresher",
    stops: [
      { vendorId: "dellsubi", itemName: "Spam musubi, OG" },
      { vendorId: "fairy-bites-delicacies", itemName: "Lumpia" },
      { vendorId: "baboy-boys", itemName: "Lechon rice plate" },
      { vendorId: "my-lumpia-lady", itemName: "Turon, banana" },
      { vendorId: "next-gen-lemonade", itemName: "Lemonade, fruit-infused", optionsPreview: "aloha, lychee pineapple" },
    ],
    art: `<svg viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="96" cy="18" r="11" fill="currentColor" opacity="0.18"/>
      <path d="M52 72 C53 54 57 42 63 30" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" opacity="0.55"/>
      <path d="M63 30 C52 24 41 25 32 32 M63 30 C54 18 44 15 34 17 M63 30 C64 17 72 10 82 9 M63 30 C74 22 86 24 94 31 M63 30 C73 32 82 39 86 48" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" opacity="0.65"/>
      <path d="M92 72 C91 58 88 49 84 40" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" opacity="0.45"/>
      <path d="M84 40 C75 35 67 36 61 42 M84 40 C85 31 92 26 100 26 M84 40 C93 34 103 36 109 42 M84 40 C91 42 98 47 101 54" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" opacity="0.5"/>
    </svg>`,
  },
  {
    id: "vietnamese-ca-phe",
    title: "Vietnamese Cà Phê Hour",
    subtitle: "Compare iced cà phê sữa đá and house twists — best shared",
    stops: [
      { vendorId: "bobette-tea", itemName: "Vietnamese coffee" },
      { vendorId: "tri-foods", itemName: "Vietnamese coffee" },
      { vendorId: "boba-meet-up", itemName: "Vietnamese coffee" },
      { vendorId: "mr-cane", itemName: "Vietnamese coffee latte" },
    ],
    art: `<svg viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="64" y="14" width="28" height="4" rx="2" fill="currentColor" opacity="0.5"/>
      <path d="M68 18 H88 L85 35 H71 Z" stroke="currentColor" stroke-width="2.2" fill="currentColor" fill-opacity="0.14" opacity="0.65"/>
      <line x1="60" y1="36" x2="96" y2="36" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity="0.6"/>
      <path d="M66 36 H90 L86 64 H70 Z" stroke="currentColor" stroke-width="2.2" fill="currentColor" fill-opacity="0.1" opacity="0.6"/>
      <path d="M78 40 C78 45 75 46 75 49 C75 51 76.5 52 78 52 C79.5 52 81 51 81 49 C81 46 78 45 78 40 Z" fill="currentColor" opacity="0.45"/>
      <ellipse cx="44" cy="48" rx="7" ry="10" transform="rotate(-24 44 48)" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12" opacity="0.45"/>
      <path d="M41 40 C44 46 44 51 47 56" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.45"/>
    </svg>`,
  },
  {
    id: "purple-reign",
    title: "Purple Reign",
    subtitle: "Ube from drink to dessert to sweet treat",
    stops: [
      { vendorId: "bobette-tea", itemName: "Ube coffee" },
      { vendorId: "mr-cane", itemName: "Vietnamese coffee latte", optionsPreview: "ube" },
      { vendorId: "hey-mango", itemName: "Mango sticky rice with ube mochi" },
      { vendorId: "applesbyterri", itemName: "Caramel apples, hand-dipped", optionsPreview: "ube" },
    ],
    art: `<svg viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M62 48 C56 36 62 20 76 16 C90 12 102 22 100 36 C98 50 86 60 72 58 C66 57 64 53 62 48 Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="2.2" opacity="0.65"/>
      <path d="M72 24 C78 21 86 24 89 31 M69 36 C74 34 81 36 84 41" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.45"/>
      <path d="M58 52 C48 50 40 42 38 30 C48 30 56 36 60 46" fill="currentColor" fill-opacity="0.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
      <circle cx="96" cy="54" r="4" fill="currentColor" opacity="0.28"/>
      <circle cx="48" cy="20" r="3" fill="currentColor" opacity="0.24"/>
    </svg>`,
  },
  {
    id: "sweet-tooth",
    title: "Sweet Tooth Tour",
    subtitle: "Crunchy, creamy, warm, and cold — a balanced dessert run",
    stops: [
      { vendorId: "tri-foods", itemName: "Chè" },
      { vendorId: "pop-berry", itemName: "Tanghulu" },
      { vendorId: "hey-mango", itemName: "Mango sticky rice" },
      { vendorId: "pitayas-locas", itemName: "Churros" },
      { vendorId: "veneto-authentic-italian-gelato", itemName: "Italian gelato" },
    ],
    art: `<svg viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="36" r="17" stroke="currentColor" stroke-width="2.2" fill="currentColor" fill-opacity="0.12" opacity="0.6"/>
      <path d="M80 24 C87 24 91 30 89 36 C87 42 79 44 74 40 C70 36 72 29 77 29 C81 29 83 33 81 36" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
      <line x1="80" y1="53" x2="80" y2="68" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity="0.5"/>
      <path d="M46 20 L48 26 L54 28 L48 30 L46 36 L44 30 L38 28 L44 26 Z" fill="currentColor" opacity="0.38"/>
      <circle cx="56" cy="50" r="3.5" fill="currentColor" opacity="0.3"/>
      <circle cx="104" cy="22" r="3" fill="currentColor" opacity="0.32"/>
    </svg>`,
  },
  {
    id: "plant-power",
    title: "Plant Power",
    subtitle: "Vegan and dairy-free picks — drink, sweet, dessert, and frozen treat",
    stops: [
      { vendorId: "pitayas-locas", itemName: "Aguas frescas" },
      { vendorId: "pop-berry", itemName: "Tanghulu" },
      { vendorId: "hey-mango", itemName: "Mango sticky rice" },
      { vendorId: "veneto-authentic-italian-gelato", itemName: "Italian sorbet" },
    ],
    art: `<svg viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 60 C60 44 60 30 60 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity="0.55"/>
      <path d="M60 30 C50 26 40 28 34 34 C42 38 52 37 60 30 Z" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1.8" opacity="0.7"/>
      <path d="M60 24 C68 18 80 18 88 24 C80 30 68 31 60 24 Z" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1.8" opacity="0.7"/>
      <path d="M60 40 C70 40 78 44 82 50 C74 54 66 52 60 40 Z" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="1.6" opacity="0.6"/>
      <path d="M30 64 C46 62 74 62 92 64" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
      <circle cx="98" cy="20" r="3.5" fill="currentColor" opacity="0.28"/>
      <circle cx="22" cy="18" r="2.5" fill="currentColor" opacity="0.24"/>
    </svg>`,
  },
  {
    id: "smoke-and-sizzle",
    title: "Smoke & Sizzle",
    subtitle: "Charred, smoky, and sizzling off the grill",
    stops: [
      { vendorId: "myzz-piggyz-tiger-bite", itemName: "Purple sticky rice plate, Hmong sausage" },
      { vendorId: "gim-belly", itemName: "Kalbi short ribs plate" },
      { vendorId: "happy-foods", itemName: "Garlic noodles with shrimp" },
      { vendorId: "mr-cane", itemName: "Sugarcane juice, fresh-pressed fruit infusions" },
    ],
    art: `<svg viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M74 58 C60 58 52 49 54 37 C56 27 65 22 68 12 C75 18 78 24 77 31 C82 28 85 23 86 19 C92 26 95 34 94 42 C92 52 84 58 74 58 Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" opacity="0.65"/>
      <path d="M73 54 C67 54 63 49 65 42 C66 37 71 34 73 28 C78 33 82 39 81 45 C80 51 77 54 73 54 Z" fill="currentColor" fill-opacity="0.22" opacity="0.7"/>
      <path d="M38 44 C35 38 41 34 38 28 M46 48 C43 42 49 38 46 32" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
      <line x1="48" y1="62" x2="100" y2="62" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity="0.5"/>
    </svg>`,
  },
  {
    id: "take-home-tet",
    title: "Take-Home Tết",
    subtitle: "Pastries, cookies, jerky, and popcorn to bring home",
    stops: [
      { vendorId: "chez-chibi-bakery", itemName: "Cookies and pastries, Lunar New Year" },
      { vendorId: "divine-bake-house", itemName: "Cookies, gourmet stuffed" },
      { vendorId: "jerky-jerky", itemName: "Beef jerky, prepackaged" },
      { vendorId: "mr-pops", itemName: "Popcorn, prepackaged" },
      { vendorId: "annies-jammies", itemName: "Jam, fruit" },
    ],
    art: `<svg viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="78" y1="6" x2="78" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
      <rect x="70" y="14" width="16" height="4" rx="1.5" fill="currentColor" opacity="0.55"/>
      <ellipse cx="78" cy="34" rx="17" ry="16" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="2.2" opacity="0.65"/>
      <ellipse cx="78" cy="34" rx="8" ry="16" stroke="currentColor" stroke-width="1.6" opacity="0.45"/>
      <rect x="71" y="50" width="14" height="4" rx="1.5" fill="currentColor" opacity="0.55"/>
      <line x1="78" y1="54" x2="78" y2="66" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
      <path d="M44 24 L46 29 L51 31 L46 33 L44 38 L42 33 L37 31 L42 29 Z" fill="currentColor" opacity="0.38"/>
      <circle cx="102" cy="22" r="3" fill="currentColor" opacity="0.3"/>
    </svg>`,
  },
];

/** Curated festival food-tour themes, ordered from most seasonal to most common. */
const THEME_ORDER = [
  "take-home-tet",
  "vietnamese-ca-phe",
  "purple-reign",
  "island-hopping",
  "plant-power",
  "smoke-and-sizzle",
  "sweet-tooth",
];

/** Curated festival food-tour themes. */
function renderThemeView(vendors) {
  const vendorById = new Map(vendors.map((v) => [v.id, v]));
  const orderedTours = [...THEME_TOURS].sort(
    (a, b) => THEME_ORDER.indexOf(a.id) - THEME_ORDER.indexOf(b.id),
  );
  const sections = orderedTours.map((theme) => {
    const items = [];
    for (const stop of theme.stops) {
      const v = vendorById.get(stop.vendorId);
      if (!v) continue;
      const item = v.items.find((i) => i.name === stop.itemName);
      if (item) {
        items.push({
          ...item,
          vendorName: v.name,
          vendorId: v.id,
          ...(stop.optionsPreview ? { optionsPreview: stop.optionsPreview } : {}),
        });
      }
    }
    if (!items.length) return "";
    return `
    <section class="category-block theme-block theme-block--${theme.id}" id="menu-theme-${theme.id}">
      <button type="button" class="theme-banner" aria-expanded="false" aria-controls="menu-theme-body-${theme.id}">
        <div class="theme-banner-copy">
          <h3>${escapeHtml(theme.title)}</h3>
          <p class="theme-banner-subtitle">${escapeHtml(theme.subtitle)}</p>
        </div>
        <span class="theme-banner-art" aria-hidden="true">${theme.art}</span>
        <span class="theme-banner-caret" aria-hidden="true"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg></span>
      </button>
      <div class="theme-body" id="menu-theme-body-${theme.id}" hidden>
        ${renderItemList(items, { showVendor: true, showCuisine: false })}
      </div>
    </section>`;
  })
    .filter(Boolean)
    .join("");

  if (!sections) return "<p class='muted'>No menu items for the current filters.</p>";
  return `<p class="theme-intro">Find a food tour to match your cravings!</p>${sections}`;
}

/** Default browse: dish-type sections. */
function renderTypeView(vendors) {
  const bySection = Object.fromEntries(DISH_TYPE_ORDER.map((id) => [id, []]));
  vendors.forEach((v) => {
    v.items.forEach((i) => {
      const row = { ...i, vendorName: v.name, vendorId: v.id };
      for (const section of dishTypeSectionsForItem(i)) {
        (bySection[section] = bySection[section] || []).push(row);
      }
    });
  });
  const sections = DISH_TYPE_ORDER.filter((id) => (bySection[id] || []).length);
  if (!sections.length) {
    return "<p class='muted'>No menu items for the current filters.</p>";
  }
  return sections
    .map((section) => {
      const items = bySection[section];
      items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      const id = `menu-type-${section}`;
      const body =
        section === "drinks"
          ? renderDrinkSubgroups(items, { idPrefix: "menu-type-drinks" })
          : renderItemList(items, { showVendor: true });
      return `
    <section class="category-block" id="${id}">
      <h3>${escapeHtml(DISH_TYPE_LABELS[section] || section)}</h3>
      ${body}
    </section>`;
    })
    .join("");
}

/** Culture-primary grouping for the By cuisine tab. */
function renderCuisineView(vendors) {
  const bySection = Object.fromEntries(CUISINE_ORDER.map((id) => [id, []]));
  vendors.forEach((v) => {
    v.items.forEach((i) => {
      const row = { ...i, vendorName: v.name, vendorId: v.id };
      for (const section of cuisineSectionsForItem(i, v)) {
        (bySection[section] = bySection[section] || []).push(row);
      }
    });
  });
  return CUISINE_ORDER.filter((id) => (bySection[id] || []).length)
    .map((section) => {
      const items = bySection[section];
      items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      const id = `menu-cuisine-${section}`;
      // Section heading is the cuisine — skip redundant per-dish chips.
      return `
    <section class="category-block" id="${id}">
      <h3>${escapeHtml(CUISINE_LABELS[section] || section)}</h3>
      ${renderItemList(items, { showVendor: true, showCuisine: false })}
    </section>`;
    })
    .join("");
}

function dietFacetOrder(facets) {
  const available = new Set(facets || []);
  const grouped = new Set(FILTER_GROUPS.flatMap((g) => g.facets));
  return [
    ...FILTER_GROUPS.flatMap((g) => g.facets.filter((f) => available.has(f))),
    ...(facets || []).filter((f) => !grouped.has(f)),
  ];
}

function renderDietView(vendors, facets) {
  const sections = dietFacetOrder(facets)
    .map((facet) => {
      const items = [];
      vendors.forEach((v) => {
        v.items.forEach((i) => {
          if (itemMatchesFilter(i, v, facet)) {
            items.push({ ...i, vendorName: v.name, vendorId: v.id });
          }
        });
      });
      if (!items.length) return "";
      items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      const label = FILTER_LABELS[facet] || facet;
      const id = `menu-diet-${facet}`;
      return `
    <section class="category-block diet-block" id="${id}">
      <h3>${escapeHtml(label)}</h3>
      <ul class="items">${items
        .map(
          (i) => `
        <li>${renderItemRow(i, { showVendor: true })}</li>`,
        )
        .join("")}
      </ul>
    </section>`;
    })
    .filter(Boolean)
    .join("");

  return (
    sections ||
    "<p class='muted'>No dietary tags on the current menu items. Try clearing filters or switch to Vendor.</p>"
  );
}

const MENU_VIEWS = ["theme", "type", "cuisine", "vendor", "diet"];
const DEFAULT_VIEW = "theme";

function menuHasThemes(m) {
  return Number(m?.year) >= 2027;
}

function defaultViewForMenu(m) {
  return menuHasThemes(m) ? "theme" : "type";
}

function viewFromUrl() {
  try {
    const raw = new URLSearchParams(window.location.search).get("view");
    return MENU_VIEWS.includes(raw) ? raw : null;
  } catch (_) {
    return null;
  }
}

/** `vendor-{id}` hash → vendor id, or null. */
function vendorIdFromHash() {
  try {
    const h = String(window.location.hash || "").replace(/^#/, "");
    if (h.startsWith("vendor-")) return h.slice("vendor-".length) || null;
  } catch (_) {
    /* ignore */
  }
  return null;
}

/**
 * Sync `?view=` (+ optional hash) to the URL.
 * @param {string} nextView
 * @param {{ push?: boolean, hash?: string, scrollY?: number, vendorId?: string }} [opts]
 */
function setViewInUrl(nextView, opts = {}) {
  try {
    const url = new URL(window.location.href);
    if (nextView === DEFAULT_VIEW) url.searchParams.delete("view");
    else url.searchParams.set("view", nextView);
    const hash = String(opts.hash || "").replace(/^#/, "");
    url.hash = hash ? `#${hash}` : "";
    const state = {
      menuViewer: true,
      view: nextView,
      scrollY: typeof opts.scrollY === "number" ? opts.scrollY : window.scrollY,
      vendorId: opts.vendorId || null,
    };
    if (opts.push) window.history.pushState(state, "", url);
    else window.history.replaceState(state, "", url);
  } catch (_) {
    /* ignore */
  }
}

function syncViewTabs(container, nextView) {
  container.querySelectorAll(".view-btn").forEach((btn) => {
    const on = btn.dataset.view === nextView;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
}

/**
 * Mount interactive public menu UI into container.
 * Returns { setMenu(menu) } to refresh when roster changes.
 * Deep link: `?view=type|cuisine|vendor|diet` (default type omits the param).
 */
export function mountMenuViewer(container, menu) {
  let activeFilters = new Set();
  let currentMenu = menu;
  let view = viewFromUrl() ?? defaultViewForMenu(currentMenu);
  if (view === "theme" && !menuHasThemes(currentMenu)) view = "type";
  let query = "";
  /** After switching to By vendor, scroll to this card id (`vendor-{id}`). */
  let pendingVendorScroll = null;
  /** After Back/Forward re-render, restore this window scrollY. */
  let pendingRestoreScroll = null;

  container.innerHTML = `
    <header>
      <h1 class="menu-title"></h1>
      <p class="menu-meta muted"><span class="menu-disclaimer"></span><span class="menu-updated"></span></p>
    </header>
    <div class="menu-layout">
      <aside class="menu-sidebar">
        <div class="menu-sidebar-toolbar">
          <input type="search" id="menu-search-input" class="menu-search" placeholder="Search items or vendors..." aria-label="Search items or vendors" />
          <button type="button" class="menu-filters-open" aria-label="Filters" aria-haspopup="dialog" aria-controls="menu-filters-sheet" aria-expanded="false" title="Filters">
            <svg class="menu-filters-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16l-6.5 7.5V19l-3 1.5v-8L4 5z"/></svg>
            <span class="menu-filters-count" hidden></span>
          </button>
        </div>
        <div class="menu-sidebar-filters">
          <div class="menu-filter-panel">
            <div class="menu-filter-heading">
              <p class="menu-filter-label">Meets all criteria:</p>
              <button type="button" class="filter-reset" disabled>Reset filters</button>
            </div>
            <div class="menu-filter-chips">
              <div class="menu-filters filters"></div>
            </div>
            <div class="menu-year-radios" hidden></div>
            <div class="menu-filters-legend-block menu-icon-legend-block menu-icon-legend-block--static">
              <p class="menu-filters-legend-label">Icon legend</p>
              <div id="menu-icon-legend-filters" class="icon-legend"></div>
            </div>
          </div>
        </div>
        <div class="menu-icon-legend-block menu-icon-legend-block--sidebar">
          <button type="button" class="icon-legend-link" aria-expanded="false" aria-controls="menu-icon-legend">
            Icon legend<span class="icon-legend-caret" aria-hidden="true"></span>
          </button>
          <div id="menu-icon-legend" class="icon-legend" hidden></div>
        </div>
      </aside>
      <div class="menu-main">
        <div class="menu-main-sticky">
          <div class="menu-tabs-row">
            <nav class="menu-view-tabs" role="tablist" aria-label="Menu view">
              <button type="button" class="view-btn" data-view="theme" role="tab" aria-selected="false">Theme</button>
              <button type="button" class="view-btn active" data-view="type" role="tab" aria-selected="true">Type</button>
              <button type="button" class="view-btn" data-view="cuisine" role="tab" aria-selected="false">Cuisine</button>
              <button type="button" class="view-btn" data-view="vendor" role="tab" aria-selected="false">Vendor</button>
              <button type="button" class="view-btn" data-view="diet" role="tab" aria-selected="false">Diet</button>
            </nav>
          </div>
          <div class="theme-controls" hidden>
            <button type="button" class="theme-control-btn" data-theme-action="expand">Expand all</button>
            <span class="theme-controls-sep" aria-hidden="true">·</span>
            <button type="button" class="theme-control-btn" data-theme-action="collapse">Collapse all</button>
          </div>
          <nav class="menu-section-chips" aria-label="Jump to section" hidden></nav>
        </div>
        <div class="menu-content"></div>
      </div>
    </div>
    <div id="menu-filters-sheet" class="menu-filters-sheet" role="dialog" aria-modal="true" aria-label="Filters" hidden>
      <div class="menu-filters-sheet-panel">
        <div class="menu-filters-sheet-bar">
          <p class="menu-filters-sheet-title">Filters</p>
          <button type="button" class="menu-filters-close" aria-label="Close filters">Close</button>
        </div>
        <div class="menu-filters-sheet-body"></div>
      </div>
    </div>
  `;

  const titleEl = container.querySelector(".menu-title");
  const disclaimerEl = container.querySelector(".menu-disclaimer");
  const updatedEl = container.querySelector(".menu-updated");
  const filtersEl = container.querySelector(".menu-filters");
  const resetFiltersEl = container.querySelector(".filter-reset");
  const contentEl = container.querySelector(".menu-content");
  const searchEl = container.querySelector(".menu-search");
  const sectionChipsEl = container.querySelector(".menu-section-chips");
  const stickyHeadEl = container.querySelector(".menu-main-sticky");
  const themeControlsEl = container.querySelector(".theme-controls");
  const filtersSheetEl = container.querySelector(".menu-filters-sheet");
  const filtersOpenBtn = container.querySelector(".menu-filters-open");
  const filtersCloseBtn = container.querySelector(".menu-filters-close");
  const filtersCountEl = container.querySelector(".menu-filters-count");
  const sidebarToolbarEl = container.querySelector(".menu-sidebar-toolbar");
  const sidebarFiltersEl = container.querySelector(".menu-sidebar-filters");
  const filtersSheetBodyEl = container.querySelector(".menu-filters-sheet-body");
  const menuSidebarEl = container.querySelector(".menu-sidebar");
  let sectionSpyCleanup = null;

  function isMobileFiltersSheet() {
    return window.matchMedia("(max-width: 1099px)").matches;
  }

  function placeFiltersForViewport() {
    if (!sidebarFiltersEl || !filtersSheetBodyEl || !menuSidebarEl) return;
    if (isMobileFiltersSheet()) {
      if (sidebarFiltersEl.parentElement !== filtersSheetBodyEl) {
        filtersSheetBodyEl.appendChild(sidebarFiltersEl);
      }
      if (sidebarToolbarEl && stickyHeadEl && sidebarToolbarEl.parentElement !== stickyHeadEl) {
        stickyHeadEl.appendChild(sidebarToolbarEl);
      }
    } else {
      if (sidebarToolbarEl && sidebarToolbarEl.parentElement !== menuSidebarEl) {
        menuSidebarEl.prepend(sidebarToolbarEl);
      }
      if (sidebarFiltersEl.parentElement !== menuSidebarEl) {
        if (sidebarToolbarEl && sidebarToolbarEl.parentElement === menuSidebarEl) {
          sidebarToolbarEl.after(sidebarFiltersEl);
        } else {
          menuSidebarEl.prepend(sidebarFiltersEl);
        }
      }
    }
  }

  function setFiltersSheetOpen(open) {
    if (!filtersSheetEl || !filtersOpenBtn) return;
    if (!isMobileFiltersSheet()) {
      filtersSheetEl.hidden = true;
      filtersSheetEl.classList.remove("is-open");
      filtersOpenBtn.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-filters-sheet-open");
      return;
    }
    placeFiltersForViewport();
    filtersSheetEl.hidden = !open;
    filtersSheetEl.classList.toggle("is-open", open);
    filtersOpenBtn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("menu-filters-sheet-open", open);
    if (open) filtersCloseBtn?.focus();
  }

  function updateFiltersOpenLabel() {
    const n = activeFilters.size;
    if (!filtersCountEl) return;
    if (n > 0) {
      filtersCountEl.hidden = false;
      filtersCountEl.textContent = String(n);
    } else {
      filtersCountEl.hidden = true;
      filtersCountEl.textContent = "";
    }
  }

  function renderFilters() {
    filtersEl.innerHTML = renderFilterGroupsHtml(currentMenu.filter_facets, activeFilters);
    attachFilterHandlers(filtersEl, activeFilters, render);
    resetFiltersEl.disabled = activeFilters.size === 0;
    updateFiltersOpenLabel();
  }

  function stickyOcclusionPx() {
    if (!stickyHeadEl) return 96;
    const rect = stickyHeadEl.getBoundingClientRect();
    // `top` is nav (+ mobile search toolbar on narrow). Height is tabs / section chips.
    // Together = full stack covering the viewport — height alone under-scrolls.
    const stickyTop = Number.parseFloat(getComputedStyle(stickyHeadEl).top) || 0;
    return Math.ceil(stickyTop + rect.height + 12);
  }

  function syncSectionScrollMargin() {
    contentEl.style.setProperty("--menu-section-scroll-margin", `${stickyOcclusionPx()}px`);
  }

  function scrollToMenuTarget(el) {
    if (!el) return;
    syncStickyMetrics();
    const top = el.getBoundingClientRect().top + window.scrollY - stickyOcclusionPx();
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function syncMobileToolbarStickyOffset() {
    const sidebar = container.querySelector(".menu-sidebar");
    if (!sidebar || !window.matchMedia("(max-width: 1099px)").matches) {
      container.style.removeProperty("--menu-mobile-toolbar-height");
      return;
    }
    container.style.setProperty("--menu-mobile-toolbar-height", `${Math.ceil(sidebar.offsetHeight)}px`);
  }

  function syncStickyMetrics() {
    syncMobileToolbarStickyOffset();
    syncSectionScrollMargin();
  }

  function setupSectionNav() {
    if (sectionSpyCleanup) {
      sectionSpyCleanup();
      sectionSpyCleanup = null;
    }

    const sections = [...contentEl.querySelectorAll(".category-block[id]")];
    if (view === "vendor" || view === "theme" || !sections.length) {
      sectionChipsEl.hidden = true;
      sectionChipsEl.innerHTML = "";
      syncStickyMetrics();
      return;
    }

    sectionChipsEl.hidden = false;
    sectionChipsEl.innerHTML = sections
      .map((sec) => {
        const label = sec.querySelector("h3")?.textContent?.trim() || sec.id;
        return `<button type="button" class="menu-section-chip" data-section="${escapeHtml(sec.id)}">${escapeHtml(label)}</button>`;
      })
      .join("");

    sectionChipsEl.querySelectorAll(".menu-section-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.section);
        if (!target) return;
        syncStickyMetrics();
        lastActiveId = btn.dataset.section;
        sectionChipsEl.querySelectorAll(".menu-section-chip").forEach((b) => {
          const on = b === btn;
          b.classList.toggle("active", on);
          b.setAttribute("aria-current", on ? "true" : "false");
        });
        ensureChipFullyVisible(btn);
        scrollToMenuTarget(target);
      });
    });

    function ensureChipFullyVisible(chip) {
      if (!chip) return;
      const navRect = sectionChipsEl.getBoundingClientRect();
      const chipRect = chip.getBoundingClientRect();
      const pad = 6;
      if (chipRect.left < navRect.left + pad) {
        sectionChipsEl.scrollBy({
          left: chipRect.left - navRect.left - pad,
          behavior: "smooth",
        });
      } else if (chipRect.right > navRect.right - pad) {
        sectionChipsEl.scrollBy({
          left: chipRect.right - navRect.right + pad,
          behavior: "smooth",
        });
      }
    }

    let lastActiveId = null;
    function updateActive() {
      syncStickyMetrics();
      const marker = stickyHeadEl.getBoundingClientRect().bottom + 4;
      let current = sections[0];
      for (const sec of sections) {
        if (sec.getBoundingClientRect().top <= marker) current = sec;
      }

      // Short final sections never reach the sticky marker — when the page is
      // scrollable and we're at the bottom, force the last section active.
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (maxScroll > 8 && window.scrollY >= maxScroll - 12) {
        current = sections[sections.length - 1];
      }

      let activeChip = null;
      sectionChipsEl.querySelectorAll(".menu-section-chip").forEach((btn) => {
        const on = btn.dataset.section === current?.id;
        btn.classList.toggle("active", on);
        btn.setAttribute("aria-current", on ? "true" : "false");
        if (on) activeChip = btn;
      });
      if (current?.id !== lastActiveId) {
        lastActiveId = current?.id ?? null;
        ensureChipFullyVisible(activeChip);
      }
    }

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    sectionSpyCleanup = () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }

  function render() {
    titleEl.textContent = currentMenu.festival || "Festival Food";
    disclaimerEl.innerHTML =
      '<a href="/vendor-booths/">Register as a vendor</a>. Menu subject to change. Filters reflect vendor self-report — not medical advice.';
    if (updatedEl) updatedEl.textContent = "";
    if (sidebarToolbarEl) sidebarToolbarEl.hidden = view === "theme";
    if (themeControlsEl) themeControlsEl.hidden = view !== "theme";
    renderFilters();

    const vendors = filteredVendors(currentMenu, activeFilters, query);
    if (!vendors.length) {
      contentEl.innerHTML = "<p class='muted'>No menu items for the current filters.</p>";
      setupSectionNav();
      return;
    }
    if (view === "vendor") contentEl.innerHTML = renderVendorView(vendors);
    else if (view === "theme") contentEl.innerHTML = renderThemeView(vendors);
    else if (view === "type") contentEl.innerHTML = renderTypeView(vendors);
    else if (view === "cuisine") contentEl.innerHTML = renderCuisineView(vendors);
    else contentEl.innerHTML = renderDietView(vendors, currentMenu.filter_facets);
    setupSectionNav();
    requestAnimationFrame(() => {
      syncStickyMetrics();
      if (pendingVendorScroll) {
        const targetId = pendingVendorScroll;
        pendingVendorScroll = null;
        pendingRestoreScroll = null;
        // Second frame: vendor layout (2-col wide) + sticky height after chips hide.
        requestAnimationFrame(() => {
          scrollToMenuTarget(document.getElementById(targetId));
        });
        return;
      }
      if (pendingRestoreScroll != null) {
        const y = pendingRestoreScroll;
        pendingRestoreScroll = null;
        window.scrollTo(0, y);
      }
    });
  }

  function jumpToVendor(vendorId) {
    const cardId = vendorCardId(vendorId);
    if (!cardId) return;
    // Stamp scroll on the current history entry, then push By vendor so Back returns here.
    setViewInUrl(view, { scrollY: window.scrollY });
    view = "vendor";
    syncViewTabs(container, view);
    setViewInUrl(view, { push: true, hash: cardId, vendorId, scrollY: 0 });
    pendingRestoreScroll = null;
    pendingVendorScroll = cardId;
    render();
  }

  function applyHistoryNavigation() {
    const fromUrl = viewFromUrl();
    const st = window.history.state;
    const nextView =
      (fromUrl && MENU_VIEWS.includes(fromUrl) ? fromUrl : null) ||
      (st?.menuViewer && MENU_VIEWS.includes(st.view) ? st.view : null) ||
      DEFAULT_VIEW;
    const hashVendor = vendorIdFromHash() || st?.vendorId || null;
    view = nextView;
    syncViewTabs(container, view);
    if (nextView === "vendor" && hashVendor) {
      pendingVendorScroll = vendorCardId(hashVendor);
      pendingRestoreScroll = null;
    } else {
      pendingVendorScroll = null;
      pendingRestoreScroll = typeof st?.scrollY === "number" ? st.scrollY : window.scrollY;
    }
    render();
  }

  searchEl.addEventListener("input", (e) => {
    query = e.target.value;
    render();
  });

  resetFiltersEl.addEventListener("click", () => {
    activeFilters.clear();
    render();
  });

  filtersOpenBtn?.addEventListener("click", () => setFiltersSheetOpen(true));
  filtersCloseBtn?.addEventListener("click", () => setFiltersSheetOpen(false));
  filtersSheetEl?.addEventListener("click", (e) => {
    if (e.target === filtersSheetEl) setFiltersSheetOpen(false);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && filtersSheetEl?.classList.contains("is-open")) {
      setFiltersSheetOpen(false);
    }
  });
  window.addEventListener("resize", () => {
    placeFiltersForViewport();
    if (!isMobileFiltersSheet()) setFiltersSheetOpen(false);
    syncStickyMetrics();
  });

  syncViewTabs(container, view);

  container.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = MENU_VIEWS.includes(btn.dataset.view) ? btn.dataset.view : DEFAULT_VIEW;
      if (next === view) return;
      pendingVendorScroll = null;
      pendingRestoreScroll = null;
      view = next;
      syncViewTabs(container, view);
      setViewInUrl(view, { scrollY: window.scrollY });
      render();
    });
  });

  if (themeControlsEl) {
    themeControlsEl.addEventListener("click", (e) => {
      const themeAction = e.target.closest(".theme-control-btn[data-theme-action]");
      if (!themeAction) return;
      e.preventDefault();
      const expand = themeAction.dataset.themeAction === "expand";
      contentEl.querySelectorAll(".theme-banner").forEach((btn) => {
        btn.setAttribute("aria-expanded", expand ? "true" : "false");
        const bodyId = btn.getAttribute("aria-controls");
        const body = bodyId ? document.getElementById(bodyId) : null;
        if (body) body.hidden = !expand;
      });
    });
  }

  contentEl.addEventListener("click", (e) => {
    const themeBanner = e.target.closest(".theme-banner");
    if (themeBanner && contentEl.contains(themeBanner)) {
      e.preventDefault();
      const expanded = themeBanner.getAttribute("aria-expanded") === "true";
      themeBanner.setAttribute("aria-expanded", expanded ? "false" : "true");
      const bodyId = themeBanner.getAttribute("aria-controls");
      const body = bodyId ? document.getElementById(bodyId) : null;
      if (body) body.hidden = expanded;
      return;
    }
    const toggle = e.target.closest(".item-options-toggle");
    if (toggle && contentEl.contains(toggle)) {
      e.preventDefault();
      const wrap = toggle.closest(".item-options-text");
      const shortEl = wrap?.querySelector(".item-options-short");
      const fullEl = wrap?.querySelector(".item-options-full");
      if (shortEl && fullEl) {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        shortEl.hidden = !expanded;
        fullEl.hidden = expanded;
        toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
        toggle.textContent = expanded ? "more" : "less";
      }
      return;
    }
    const link = e.target.closest("a.item-vendor[data-vendor-jump]");
    if (!link || !contentEl.contains(link)) return;
    e.preventDefault();
    jumpToVendor(link.getAttribute("data-vendor-jump"));
  });

  window.addEventListener("popstate", () => {
    applyHistoryNavigation();
  });

  setupDietBadgeHandlers(container);
  setupIconLegendToggle(container);
  const filtersLegendEl = container.querySelector("#menu-icon-legend-filters");
  if (filtersLegendEl && !filtersLegendEl.innerHTML.trim()) {
    filtersLegendEl.innerHTML = buildIconLegendHtml();
  }
  setupDishLightbox(container);

  const themeTabBtn = container.querySelector('.view-btn[data-view="theme"]');
  function syncThemeTabVisibility() {
    const hasThemes = menuHasThemes(currentMenu);
    if (themeTabBtn) themeTabBtn.hidden = !hasThemes;
    if (!hasThemes && view === "theme") {
      view = "type";
      setViewInUrl(view);
    }
    syncViewTabs(container, view);
  }

  placeFiltersForViewport();
  syncThemeTabVisibility();
  // Reflect view (+ optional vendor hash) when opened via deep link.
  const deepVendor = vendorIdFromHash();
  if (view === "vendor" && deepVendor) {
    pendingVendorScroll = vendorCardId(deepVendor);
    setViewInUrl(view, { hash: vendorCardId(deepVendor), vendorId: deepVendor, scrollY: 0 });
  } else if (view !== defaultViewForMenu(currentMenu)) {
    setViewInUrl(view);
  } else {
    setViewInUrl(view, { scrollY: window.scrollY });
  }
  render();

  return {
    setMenu(nextMenu) {
      currentMenu = nextMenu;
      syncThemeTabVisibility();
      render();
    },
  };
}

function buildDishLightboxItem(btn) {
  const src = btn.getAttribute("data-dish-src") || "";
  if (!src) return null;
  const title = btn.getAttribute("data-dish-title") || "Dish";
  const vendor = btn.getAttribute("data-dish-vendor") || "";
  const credit = btn.getAttribute("data-dish-credit") || "";
  const alt = btn.getAttribute("data-dish-alt") || title;
  const creditIsDuplicate =
    !!credit &&
    !!vendor &&
    credit.trim().toLowerCase() === vendor.trim().toLowerCase();
  const lines = [`<strong>${escapeHtml(title)}</strong>`];
  if (vendor) lines.push(escapeHtml(vendor));
  if (credit && !creditIsDuplicate) lines.push(escapeHtml(credit));
  return { src, alt, captionHtml: lines.join("<br />") };
}

function setupDishLightbox(root) {
  root.addEventListener("click", (event) => {
    const btn = event.target.closest(".item-thumb.has-photo");
    if (!btn || !root.contains(btn)) return;
    event.preventDefault();

    if (typeof window.LSDS?.openLightbox !== "function") return;
    const pairs = [...root.querySelectorAll(".item-thumb.has-photo")]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ el, item: buildDishLightboxItem(el) }))
      .filter((p) => p.item);
    const index = pairs.findIndex((p) => p.el === btn);
    if (index !== -1) {
      window.LSDS.openLightbox(
        pairs.map((p) => p.item),
        index,
        { trigger: btn }
      );
    }
  });
}
