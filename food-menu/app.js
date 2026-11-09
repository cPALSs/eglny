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
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${year} food menu (${res.status})`);
  return res.json();
}

function heroCopyHtml(esc) {
  return `${esc("Meals, drinks, and snacks from Elk Grove Lunar New Year Tết.")} <a href="/vendors/">Register as a vendor</a>.`;
}

function ensureYearControls(main, year, onChange) {
  const tabsRow = main.querySelector(".menu-tabs-row");
  if (tabsRow) {
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
  }

  const radiosHost = main.querySelector(".menu-year-radios");
  if (radiosHost) {
    radiosHost.hidden = false;
    radiosHost.innerHTML = `
      <p class="menu-year-radios-label">Year</p>
      <div class="menu-year-radio-pills" role="radiogroup" aria-label="Festival year">
        ${YEARS.map(
          (y) => `
          <label class="menu-year-radio-pill">
            <input type="radio" name="menu-year" value="${y}"${y === year ? " checked" : ""} />
            <span>${y}</span>
          </label>`,
        ).join("")}
      </div>
    `;
    radiosHost.querySelectorAll('input[name="menu-year"]').forEach((input) => {
      input.onchange = () => {
        if (input.checked) onChange(Number(input.value));
      };
    });
  }
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
    const leadHtml = heroCopyHtml(esc);

    const heroLead = main.querySelector(".hero-lead");
    if (heroLead) heroLead.innerHTML = leadHtml;

    if (!viewer) {
      main.innerHTML = `
        <section class="hero">
          <h1>Food menu</h1>
          <p class="hero-lead">${leadHtml}</p>
        </section>
        <div id="menu-root" class="food-menu-viewer" aria-live="polite"></div>
      `;
      viewer = mountMenuViewer(document.getElementById("menu-root"), menu);
    } else {
      viewer.setMenu(menu);
    }

    ensureYearControls(main, year, (y) => {
      showYear(y).catch((err) => {
        main.innerHTML = `<p class="error-panel">${esc(err.message)}</p>`;
      });
    });
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
