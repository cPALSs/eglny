const DATA_URL = new URL("../data/vendors-directory-2027.json", import.meta.url);

async function init() {
  const {
    initPageShell,
    loadSiteData,
    setPageTitle,
    loadJsonData,
    renderVendorsDirectoryPage,
    escapeHtml,
    revealPage,
  } = window.EglnySite;

  initPageShell("vendors-directory");

  const main = document.getElementById("main");

  try {
    const [site, data] = await Promise.all([
      loadSiteData(),
      loadJsonData("data/vendors-directory-2027.json"),
    ]);
    setPageTitle(site, data?.headline ?? "Vendors directory");
    main.innerHTML = renderVendorsDirectoryPage(data);
    if (typeof revealPage === "function") revealPage();
  } catch (err) {
    main.innerHTML = `<p class="error-panel">${escapeHtml(err.message)}</p>`;
    if (typeof revealPage === "function") revealPage();
  }
}

init();
