import { mountMenuViewer } from "../assets/menu-viewer/menu-viewer.js";

const MENU_FILES = {
  2027: new URL("../data/food-menu-2027.json", import.meta.url),
  2026: new URL("../data/food-menu.json", import.meta.url),
};

const YEARS = [2027, 2026];
const DEFAULT_YEAR = 2027;

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function yearFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("year");
    if (!raw) return null;
    const y = Number(raw);
    return YEARS.includes(y) ? y : null;
  } catch (_) {
    return null;
  }
}

function setYearInUrl(year) {
  try {
    const url = new URL(window.location.href);
    if (year === DEFAULT_YEAR) url.searchParams.delete("year");
    else url.searchParams.set("year", String(year));
    window.history.replaceState({}, "", url);
  } catch (_) {
    /* ignore */
  }
}

async function loadMenu(year) {
  const url = MENU_FILES[year];
  if (!url) throw new Error(`No food menu for ${year}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${year} food menu (${res.status})`);
  return res.json();
}

function heroCopy(year, menu) {
  const vendorCount = menu.vendors?.length ?? 0;
  const itemCount = (menu.vendors ?? []).reduce((n, v) => n + (v.items?.length ?? 0), 0);
  if (year === 2027) {
    return `Meals, drinks, and snacks from Elk Grove Lunar New Year Tết 2027 — ${vendorCount} locked-in food vendors so far, ${itemCount} items. Search and filter by dietary needs. More vendors appear here as Round 1 seats lock.`;
  }
  return `Meals, drinks, and snacks from Elk Grove Lunar New Year Tết 2026 — ${vendorCount} food vendors, ${itemCount} items. Search and filter by dietary needs.`;
}

function ensureYearPill(tabsRow, year, onChange) {
  let wrap = tabsRow.querySelector(".menu-year-pill");
  if (!wrap) {
    wrap = document.createElement("label");
    wrap.className = "menu-year-pill";
    wrap.innerHTML = `
      <span class="sr-only">Festival year</span>
      <select class="menu-year-select" aria-label="Festival year"></select>
    `;
    tabsRow.appendChild(wrap);
  }
  const select = wrap.querySelector(".menu-year-select");
  select.innerHTML = YEARS.map(
    (y) => `<option value="${y}"${y === year ? " selected" : ""}>${y}</option>`,
  ).join("");
  select.value = String(year);
  select.onchange = () => onChange(Number(select.value));
  return select;
}

async function init() {
  const {
    initPageShell,
    loadSiteData,
    setPageTitle,
    escapeHtml: siteEscape,
    revealPage,
  } = window.EglnySite;

  const esc = typeof siteEscape === "function" ? siteEscape : escapeHtml;

  initPageShell("food-menu");

  const main = document.getElementById("main");
  let year = yearFromUrl() ?? DEFAULT_YEAR;
  let viewer = null;

  async function showYear(nextYear, { pushUrl = true } = {}) {
    year = nextYear;
    if (pushUrl) setYearInUrl(year);

    const menu = await loadMenu(year);
    const vendorCount = menu.vendors?.length ?? 0;
    const itemCount = (menu.vendors ?? []).reduce((n, v) => n + (v.items?.length ?? 0), 0);

    const heroLead = main.querySelector(".hero-lead");
    if (heroLead) heroLead.textContent = heroCopy(year, menu);

    if (!viewer) {
      main.innerHTML = `
        <section class="hero">
          <h1>Food menu</h1>
          <p class="hero-lead">${esc(heroCopy(year, menu))}</p>
        </section>
        <div id="menu-root" class="food-menu-viewer" aria-live="polite"></div>
      `;
      viewer = mountMenuViewer(document.getElementById("menu-root"), menu);
    } else {
      viewer.setMenu(menu);
    }

    const tabsRow = main.querySelector(".menu-tabs-row");
    if (tabsRow) {
      ensureYearPill(tabsRow, year, (y) => {
        showYear(y).catch((err) => {
          main.innerHTML = `<p class="error-panel">${esc(err.message)}</p>`;
        });
      });
    }

    return { vendorCount, itemCount };
  }

  try {
    const site = await loadSiteData();
    setPageTitle(site, "Food menu");
    await showYear(year, { pushUrl: year !== DEFAULT_YEAR || Boolean(yearFromUrl()) });
    if (typeof revealPage === "function") revealPage();
  } catch (err) {
    main.innerHTML = `<p class="error-panel">${esc(err.message)}</p>`;
    if (typeof revealPage === "function") revealPage();
  }
}

init();
