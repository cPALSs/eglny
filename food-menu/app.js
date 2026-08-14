import { mountMenuViewer } from "../assets/menu-viewer/menu-viewer.js";

const MENU_URL = new URL("../data/food-menu.json", import.meta.url);

async function init() {
  const {
    initPageShell,
    loadSiteData,
    setPageTitle,
    escapeHtml,
    revealPage,
  } = window.EglnySite;

  initPageShell("food-menu");

  const main = document.getElementById("main");

  try {
    const [site, menu] = await Promise.all([
      loadSiteData(),
      fetch(MENU_URL).then((r) => {
        if (!r.ok) throw new Error(`Could not load food menu (${r.status})`);
        return r.json();
      }),
    ]);

    setPageTitle(site, "Food menu");

    const vendorCount = menu.vendors?.length ?? 0;
    const itemCount = (menu.vendors ?? []).reduce((n, v) => n + (v.items?.length ?? 0), 0);

    main.innerHTML = `
      <section class="hero">
        <h1>Food menu</h1>
        <p class="hero-kicker">2026 festival archive</p>
        <p class="hero-lead">Meals, drinks, and snacks from Elk Grove Lunar New Year Tết 2026 — ${vendorCount} food vendors, ${itemCount} items. Search and filter by dietary needs. 2027 menus publish after vendor selection.</p>
      </section>
      <div id="menu-root" class="food-menu-viewer" aria-live="polite"></div>
    `;

    mountMenuViewer(document.getElementById("menu-root"), menu);
    if (typeof revealPage === "function") revealPage();
  } catch (err) {
    main.innerHTML = `<p class="error-panel">${escapeHtml(err.message)}</p>`;
    if (typeof revealPage === "function") revealPage();
  }
}

init();
