import { WARNING_EMOJI, tagEmojiMeta, setupIconLegendToggle } from "./menu-legend.js";
import { renderFilterGroupsHtml, attachFilterHandlers } from "./menu-filters.js";

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
  if (tags.has(f) || tags.has(f.replace("_free", ""))) return true;
  if (f === "halal" && tags.has("halal_certified")) return true;
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
  return item.name.toLowerCase().includes(q) || vendor.name.toLowerCase().includes(q);
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

function renderVendorView(vendors) {
  return sortVendorsByLocation(vendors).map((v) => `
    <article class="vendor-card">
      <h2>${escapeHtml(v.name)}</h2>
      ${v.booth_label ? `<p class="booth">${escapeHtml(v.booth_label)}</p>` : ""}
      <ul class="items">${v.items.map((i) => `
        <li><span>${escapeHtml(i.name)}${renderDietaryBadges(i)}</span>
        ${i.price ? `<span>$${i.price}</span>` : ""}</li>`).join("")}
      </ul>
    </article>`).join("");
}

function renderCategoryView(vendors) {
  const byCat = { meals: [], snacks: [], drinks: [] };
  vendors.forEach((v) => {
    v.items.forEach((i) => {
      const cat = i.category || "meals";
      (byCat[cat] = byCat[cat] || []).push({ ...i, vendorName: v.name });
    });
  });
  return Object.entries(byCat).filter(([, items]) => items.length).map(([cat, items]) => {
    items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    return `
    <section class="category-block">
      <h3>${cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
      <ul class="items">${items.map((i) => `
        <li><span>${escapeHtml(i.name)}${renderDietaryBadges(i)} <em>— ${escapeHtml(i.vendorName)}</em></span>
        ${i.price ? `<span>$${i.price}</span>` : ""}</li>`).join("")}
      </ul>
    </section>`;
  }).join("");
}

/**
 * Mount interactive public menu UI into container.
 * Returns { setMenu(menu) } to refresh when roster changes.
 */
export function mountMenuViewer(container, menu) {
  let activeFilters = new Set();
  let view = "vendor";
  let query = "";
  let currentMenu = menu;

  container.innerHTML = `
    <header>
      <h1 class="menu-title"></h1>
      <p class="menu-disclaimer muted"></p>
      <p class="menu-updated muted"></p>
    </header>
    <div class="menu-layout">
      <aside class="menu-sidebar">
        <input type="search" id="menu-search-input" class="menu-search" placeholder="Search items or vendors..." aria-label="Search items or vendors" />
        <div class="menu-filter-panel">
          <div class="menu-filters filters"></div>
          <button type="button" class="filter-reset" disabled>Reset filters</button>
        </div>
      </aside>
      <div class="menu-main">
        <div class="menu-tabs-row">
          <nav class="menu-view-tabs" role="tablist" aria-label="Menu view">
            <button type="button" class="view-btn active" data-view="vendor" role="tab" aria-selected="true">By vendor</button>
            <button type="button" class="view-btn" data-view="category" role="tab" aria-selected="false">By category</button>
          </nav>
          <button type="button" class="icon-legend-link" aria-expanded="false" aria-controls="menu-icon-legend">Icon legend</button>
        </div>
        <div id="menu-icon-legend" class="icon-legend" hidden></div>
        <div class="menu-content"></div>
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

  function renderFilters() {
    filtersEl.innerHTML = renderFilterGroupsHtml(currentMenu.filter_facets, activeFilters);
    attachFilterHandlers(filtersEl, activeFilters, render);
    resetFiltersEl.disabled = activeFilters.size === 0;
  }

  function render() {
    titleEl.textContent = currentMenu.festival || "Festival Food";
    disclaimerEl.textContent = currentMenu.disclaimer || "";
    updatedEl.textContent = currentMenu.published_at ? `Menu updated ${currentMenu.published_at}` : "";
    renderFilters();

    const vendors = filteredVendors(currentMenu, activeFilters, query);
    if (!vendors.length) {
      contentEl.innerHTML = "<p class='muted'>No menu items for the current filters.</p>";
      return;
    }
    if (view === "vendor") contentEl.innerHTML = renderVendorView(vendors);
    else contentEl.innerHTML = renderCategoryView(vendors);
  }

  searchEl.addEventListener("input", (e) => {
    query = e.target.value;
    render();
  });

  resetFiltersEl.addEventListener("click", () => {
    activeFilters.clear();
    render();
  });

  container.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".view-btn").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      view = btn.dataset.view;
      render();
    });
  });

  setupDietBadgeHandlers(container);
  setupIconLegendToggle(container.querySelector(".menu-main"));

  render();

  return {
    setMenu(nextMenu) {
      currentMenu = nextMenu;
      render();
    },
  };
}
