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
  MEAL_CUISINE_IDS,
  DISH_TYPE_ORDER,
  DISH_TYPE_LABELS,
  DRINK_SUBCATEGORY_ORDER,
  DRINK_SUBCATEGORY_LABELS,
  cuisineSectionsForItem,
  classifyCuisine,
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

/** Culture chip on the dish line (not a filter). Skip drinks + unclassified Other. */
function renderCuisineChip(item, vendor = null) {
  const category = String(item?.category || "meals").trim().toLowerCase();
  if (category === "drinks") return "";
  const vendorCtx = vendor || { name: item?.vendorName, id: item?.vendorId };
  const cuisine = classifyCuisine(item, vendorCtx);
  if (!cuisine || cuisine === "other" || !MEAL_CUISINE_IDS.includes(cuisine)) return "";
  const label = CUISINE_LABELS[cuisine];
  if (!label) return "";
  return `<span class="item-cuisine">${escapeHtml(label)}</span>`;
}

function renderItemPrimary(item, { showVendor = false, vendor = null, showCuisine = true } = {}) {
  const note = truncateField(item?.note);
  const options = truncateField(item?.options);
  const clarifyBit = note
    ? ` <span class="item-clarify">(${escapeHtml(note)})</span>`
    : "";
  const vendorBit =
    showVendor && item.vendorName
      ? `\u2003<span class="item-vendor">${escapeHtml(item.vendorName)}</span>`
      : "";
  const cuisineBit = showCuisine ? renderCuisineChip(item, vendor) : "";
  // Second line: cuisine chip, then options (e.g. Filipino · rice or garlic noodles…).
  const metaBits = [cuisineBit, options ? `<span class="item-options-text">${escapeHtml(options)}</span>` : ""]
    .filter(Boolean)
    .join("");
  const metaBit = metaBits ? `<span class="item-meta">${metaBits}</span>` : "";
  return `<span class="item-text"><span class="item-name">${escapeHtml(item.name)}${clarifyBit}${renderDietaryBadges(item)}${vendorBit}</span>${metaBit}</span>`;
}

function renderItemRow(item, { showVendor = false, vendor = null, showCuisine = true } = {}) {
  // Public festival menu never lists prices (vendors set day-of).
  return `<div class="item-row">${renderItemThumb(item, vendor)}${renderItemPrimary(item, { showVendor, vendor, showCuisine })}</div>`;
}

const IG_ICON_SVG = `<svg class="vendor-ig-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`;

function normalizeInstagramUrl(handleOrUrl) {
  const raw = String(handleOrUrl || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const handle = raw.replace(/^@/, "").replace(/^instagram\.com\//i, "").replace(/\/+$/, "");
  if (!handle) return "";
  return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
}

function renderVendorIgLink(vendor) {
  const href = normalizeInstagramUrl(vendor?.instagram);
  if (!href) return "";
  const label = `Instagram · ${vendor.name || "vendor"}`;
  return `<a class="vendor-ig" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(label)}">${IG_ICON_SVG}</a>`;
}

function renderVendorLogo(vendor) {
  const src = resolveImageSrc(vendor?.logo);
  if (!src) return "";
  const alt = `${vendor.name || "Vendor"} logo`;
  return `<img class="vendor-logo" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />`;
}

function renderVendorView(vendors) {
  return sortVendorsByLocation(vendors)
    .map((v) => {
      const logo = renderVendorLogo(v);
      const ig = renderVendorIgLink(v);
      return `
    <article class="vendor-card">
      <div class="vendor-card-head">
        <div class="vendor-card-title">
          <h2>${escapeHtml(v.name)}</h2>${ig}
        </div>
        <div class="vendor-card-meta">
          ${v.booth_label ? `<p class="booth">${escapeHtml(v.booth_label)}</p>` : ""}
          ${logo}
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
    "<p class='muted'>No dietary tags on the current menu items. Try clearing filters or switch to By vendor.</p>"
  );
}

const MENU_VIEWS = ["type", "cuisine", "vendor", "diet"];
const DEFAULT_VIEW = "type";

function viewFromUrl() {
  try {
    const raw = new URLSearchParams(window.location.search).get("view");
    return MENU_VIEWS.includes(raw) ? raw : null;
  } catch (_) {
    return null;
  }
}

function setViewInUrl(nextView) {
  try {
    const url = new URL(window.location.href);
    if (nextView === DEFAULT_VIEW) url.searchParams.delete("view");
    else url.searchParams.set("view", nextView);
    window.history.replaceState({}, "", url);
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
  let view = viewFromUrl() ?? DEFAULT_VIEW;
  let query = "";
  let currentMenu = menu;

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
              <button type="button" class="view-btn active" data-view="type" role="tab" aria-selected="true">By type</button>
              <button type="button" class="view-btn" data-view="cuisine" role="tab" aria-selected="false">By cuisine</button>
              <button type="button" class="view-btn" data-view="vendor" role="tab" aria-selected="false">By vendor</button>
              <button type="button" class="view-btn" data-view="diet" role="tab" aria-selected="false">By diet</button>
            </nav>
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
  const filtersSheetEl = container.querySelector(".menu-filters-sheet");
  const filtersOpenBtn = container.querySelector(".menu-filters-open");
  const filtersCloseBtn = container.querySelector(".menu-filters-close");
  const filtersCountEl = container.querySelector(".menu-filters-count");
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
    } else if (sidebarFiltersEl.parentElement !== menuSidebarEl) {
      menuSidebarEl.appendChild(sidebarFiltersEl);
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

  function syncSectionScrollMargin() {
    const offset = stickyHeadEl ? Math.ceil(stickyHeadEl.getBoundingClientRect().height + 8) : 96;
    contentEl.style.setProperty("--menu-section-scroll-margin", `${offset}px`);
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
    if (view === "vendor" || !sections.length) {
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
        target.scrollIntoView({ behavior: "smooth", block: "start" });
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
    disclaimerEl.textContent =
      "Menu subject to change. Filters reflect vendor self-report — not medical advice.";
    if (updatedEl) updatedEl.textContent = "";
    renderFilters();

    const vendors = filteredVendors(currentMenu, activeFilters, query);
    if (!vendors.length) {
      contentEl.innerHTML = "<p class='muted'>No menu items for the current filters.</p>";
      setupSectionNav();
      return;
    }
    if (view === "vendor") contentEl.innerHTML = renderVendorView(vendors);
    else if (view === "type") contentEl.innerHTML = renderTypeView(vendors);
    else if (view === "cuisine") contentEl.innerHTML = renderCuisineView(vendors);
    else contentEl.innerHTML = renderDietView(vendors, currentMenu.filter_facets);
    setupSectionNav();
    requestAnimationFrame(syncStickyMetrics);
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
      view = next;
      syncViewTabs(container, view);
      setViewInUrl(view);
      render();
    });
  });

  setupDietBadgeHandlers(container);
  setupIconLegendToggle(container);
  const filtersLegendEl = container.querySelector("#menu-icon-legend-filters");
  if (filtersLegendEl && !filtersLegendEl.innerHTML.trim()) {
    filtersLegendEl.innerHTML = buildIconLegendHtml();
  }
  setupDishLightbox(container);

  placeFiltersForViewport();
  // Reflect non-default view in the URL when opened via deep link (or after tab pick).
  if (view !== DEFAULT_VIEW) setViewInUrl(view);
  render();

  return {
    setMenu(nextMenu) {
      currentMenu = nextMenu;
      render();
    },
  };
}

function ensureDishLightbox() {
  let dialog = document.getElementById("menu-dish-lightbox");
  if (dialog) return dialog;

  dialog = document.createElement("dialog");
  dialog.id = "menu-dish-lightbox";
  dialog.className = "menu-dish-lightbox";
  dialog.setAttribute("aria-label", "Dish photo");
  dialog.innerHTML = `
    <button type="button" class="menu-dish-lightbox-close" aria-label="Close">&times;</button>
    <div class="menu-dish-lightbox-body">
      <img class="menu-dish-lightbox-image" alt="" hidden />
      <div class="menu-dish-lightbox-placeholder" hidden></div>
      <div class="menu-dish-lightbox-caption">
        <p class="menu-dish-lightbox-title"></p>
        <p class="menu-dish-lightbox-vendor muted"></p>
        <p class="menu-dish-lightbox-credit muted"></p>
      </div>
    </div>`;
  document.body.appendChild(dialog);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.querySelector(".menu-dish-lightbox-close")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    const img = dialog.querySelector(".menu-dish-lightbox-image");
    const ph = dialog.querySelector(".menu-dish-lightbox-placeholder");
    if (img) {
      img.hidden = true;
      img.removeAttribute("src");
      img.alt = "";
    }
    if (ph) {
      ph.hidden = true;
      ph.className = "menu-dish-lightbox-placeholder";
    }
  });
  return dialog;
}

function setupDishLightbox(root) {
  const dialog = ensureDishLightbox();
  const img = dialog.querySelector(".menu-dish-lightbox-image");
  const ph = dialog.querySelector(".menu-dish-lightbox-placeholder");
  const titleEl = dialog.querySelector(".menu-dish-lightbox-title");
  const vendorEl = dialog.querySelector(".menu-dish-lightbox-vendor");
  const creditEl = dialog.querySelector(".menu-dish-lightbox-credit");

  root.addEventListener("click", (event) => {
    const btn = event.target.closest(".item-thumb.has-photo");
    if (!btn || !root.contains(btn)) return;
    event.preventDefault();

    const title = btn.getAttribute("data-dish-title") || "Dish";
    const vendor = btn.getAttribute("data-dish-vendor") || "";
    const credit = btn.getAttribute("data-dish-credit") || "";
    const src = btn.getAttribute("data-dish-src") || "";
    const alt = btn.getAttribute("data-dish-alt") || title;
    if (!src || !img) return;

    if (titleEl) titleEl.textContent = title;
    if (vendorEl) {
      vendorEl.textContent = vendor;
      vendorEl.hidden = !vendor;
    }
    if (creditEl) {
      // Skip credit when it duplicates the vendor line (common when image_credit = vendor name).
      const creditIsDuplicate =
        !!credit &&
        !!vendor &&
        credit.trim().toLowerCase() === vendor.trim().toLowerCase();
      creditEl.textContent = creditIsDuplicate ? "" : credit;
      creditEl.hidden = !credit || creditIsDuplicate;
    }

    img.hidden = false;
    img.src = src;
    img.alt = alt;
    if (ph) {
      ph.hidden = true;
      ph.className = "menu-dish-lightbox-placeholder";
    }

    dialog.showModal();
  });
}
