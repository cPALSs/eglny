/** Shared shell for eglny.com — scoped to avoid clashing with build/app.js globals */
(function () {
  const SITE_DATA_URL = "data/site.json";
  const THEME_STORAGE_KEY = "eglny-theme";
  const VALID_THEMES = new Set(["auto", "light", "dark"]);

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadThemeFromStorage() {
    try {
      const theme = localStorage.getItem(THEME_STORAGE_KEY);
      return VALID_THEMES.has(theme) ? theme : "auto";
    } catch {
      return "auto";
    }
  }

  function themeIconMarkup(theme) {
    const icons = {
      auto: `<svg class="theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/></svg>`,
      light: `<svg class="theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
      dark: `<svg class="theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    };
    return icons[theme] ?? icons.auto;
  }

  function themeLabel(theme) {
    return { auto: "System", light: "Light", dark: "Dark" }[theme] ?? "System";
  }

  function renderThemeControl() {
    const options = ["auto", "light", "dark"]
      .map(
        (value) =>
          `<button type="button" class="theme-menu-item" role="menuitemradio" data-theme-option="${value}" aria-checked="false">${themeLabel(value)}</button>`,
      )
      .join("");

    return `
      <div class="theme-dropdown">
        <button type="button" class="icon-btn theme-toggle" id="theme-toggle" aria-expanded="false" aria-haspopup="menu" aria-controls="theme-menu" aria-label="Color theme">
          ${themeIconMarkup("auto")}
        </button>
        <div id="theme-menu" class="theme-menu" role="menu" hidden>
          ${options}
        </div>
      </div>`;
  }

  function applyTheme(theme) {
    const next = VALID_THEMES.has(theme) ? theme : "auto";
    document.documentElement.setAttribute("data-theme", next);

    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
      toggle.innerHTML = `${themeIconMarkup(next)}<span class="sr-only">Color theme: ${themeLabel(next)}</span>`;
      toggle.setAttribute("aria-label", `Color theme: ${themeLabel(next)}`);
    }

    document.querySelectorAll("[data-theme-option]").forEach((item) => {
      item.setAttribute("aria-checked", item.dataset.themeOption === next ? "true" : "false");
    });
  }

  function setTheme(theme) {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }

  let closeNavMenu = () => {};

  function closeThemeMenu() {
    const dropdown = document.querySelector(".theme-dropdown");
    const toggle = document.getElementById("theme-toggle");
    const menu = document.getElementById("theme-menu");
    if (!dropdown || !toggle || !menu) return;
    dropdown.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    menu.hidden = true;
  }

  function initThemeDropdown() {
    const dropdown = document.querySelector(".theme-dropdown");
    const toggle = document.getElementById("theme-toggle");
    const menu = document.getElementById("theme-menu");
    if (!dropdown || !toggle || !menu) return;

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const opening = !dropdown.classList.contains("is-open");
      closeThemeMenu();
      if (opening) {
        closeNavMenu();
        dropdown.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        menu.hidden = false;
      }
    });

    menu.querySelectorAll("[data-theme-option]").forEach((item) => {
      item.addEventListener("click", () => {
        setTheme(item.dataset.themeOption);
        closeThemeMenu();
      });
    });

    document.addEventListener("click", (event) => {
      if (!dropdown.contains(event.target)) closeThemeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeThemeMenu();
    });
  }

  function initTheme() {
    applyTheme(loadThemeFromStorage());
    initThemeDropdown();
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (loadThemeFromStorage() === "auto") applyTheme("auto");
    });
  }

  function navPrefix() {
    const inSubdir =
      window.location.pathname.includes("/build/") ||
      window.location.pathname.includes("/2026/");
    if (
      inSubdir ||
      window.location.pathname.endsWith("/build") ||
      window.location.pathname.endsWith("/2026")
    ) {
      return "../";
    }
    return "";
  }

  function toTitleCase(title) {
    const small = new Set(["a", "an", "the", "and", "or", "but", "for", "nor", "on", "at", "to", "by", "of", "in"]);
    return title
      .split(/(\s+|—|--)/)
      .map((part, index, parts) => {
        if (/^(\s+|—|--)$/.test(part)) return part;
        const lower = part.toLowerCase();
        const wordIndex = parts.slice(0, index).filter((p) => !/^(\s+|—|--)$/.test(p)).length;
        if (wordIndex > 0 && small.has(lower)) return lower;
        if (/^\d/.test(part)) {
          return part.replace(/[a-z]+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
        }
        return lower.replace(/(^|[\s-])([\p{L}])/gu, (match, prefix, letter) => prefix + letter.toUpperCase());
      })
      .join("");
  }

  function getNavPages(prefix) {
    return [
      { id: "home", label: "Home", href: `${prefix}index.html` },
      {
        id: "about",
        label: "About",
        href: `${prefix}about.html`,
        children: [
          { id: "archive2026", label: "2026 archive", href: "https://www.elkgrovelunarnewyear.com/", external: true },
        ],
      },
      { id: "team", label: "Team", href: `${prefix}team.html` },
      {
        id: "sponsors",
        label: "Sponsors",
        href: `${prefix}sponsors.html`,
        children: [{ id: "build", label: "Build the Festival", href: `${prefix}build/?festival=lny2027` }],
      },
    ];
  }

  function renderNavLinks(pages, activePage) {
    return pages
      .map((page) => {
        if (page.children?.length) {
          const parentCurrent = page.id === activePage ? ' aria-current="page"' : "";
          const childActive = page.children.some((child) => child.id === activePage);
          const sublinks = page.children
            .map((child) => {
              const childCurrent = child.id === activePage ? ' aria-current="page"' : "";
              const external = child.external ? ' target="_blank" rel="noopener"' : "";
              return `<a class="site-nav-sublink" href="${child.href}"${childCurrent}${external}>${escapeHtml(toTitleCase(child.label))}</a>`;
            })
            .join("");
          return `<div class="site-nav-group${childActive ? " is-active" : ""}"><a class="site-nav-parent" href="${page.href}"${parentCurrent}>${escapeHtml(toTitleCase(page.label))}</a><div class="site-nav-submenu">${sublinks}</div></div>`;
        }
        const current = page.id === activePage ? ' aria-current="page"' : "";
        return `<a href="${page.href}"${current}>${escapeHtml(toTitleCase(page.label))}</a>`;
      })
      .join("");
  }

  function renderNav(activePage) {
    const prefix = navPrefix();
    const pages = getNavPages(prefix);

    const links = renderNavLinks(pages, activePage);

    return `
    <nav class="site-nav" aria-label="Main">
      <div class="site-nav-bar">
        <a class="site-nav-brand" href="${prefix}index.html">
          <span class="site-nav-brand-full">Lunar New Year <span>Tết Festival &amp; Parade</span></span>
          <span class="site-nav-brand-short">LNY <span>Tết</span></span>
        </a>
        <div class="site-nav-end">
          ${renderThemeControl()}
          <button type="button" class="icon-btn site-nav-toggle" aria-expanded="false" aria-controls="site-nav-drawer">
            <span class="site-nav-toggle-bars" aria-hidden="true"><span></span><span></span><span></span></span>
            <span class="sr-only">Open menu</span>
          </button>
        </div>
      </div>
      <div class="site-nav-backdrop" hidden aria-hidden="true"></div>
      <div id="site-nav-drawer" class="site-nav-drawer" aria-hidden="true">
        <div class="site-nav-links">${links}</div>
      </div>
    </nav>
  `;
  }

  function initNavMenu() {
    const nav = document.querySelector(".site-nav");
    if (!nav) return;

    const toggle = nav.querySelector(".site-nav-toggle");
    const drawer = nav.querySelector("#site-nav-drawer");
    const backdrop = nav.querySelector(".site-nav-backdrop");
    const srLabel = toggle?.querySelector(".sr-only");
    if (!toggle || !drawer) return;

    const desktopQuery = window.matchMedia("(min-width: 880px)");

    function setOpen(open) {
      if (desktopQuery.matches) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        drawer.setAttribute("aria-hidden", "false");
        if (backdrop) {
          backdrop.hidden = true;
          backdrop.setAttribute("aria-hidden", "true");
        }
        document.body.classList.remove("nav-open");
        if (srLabel) srLabel.textContent = "Open menu";
        return;
      }
      if (open) closeThemeMenu();
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      if (backdrop) {
        backdrop.hidden = !open;
        backdrop.setAttribute("aria-hidden", open ? "false" : "true");
      }
      document.body.classList.toggle("nav-open", open);
      if (srLabel) srLabel.textContent = open ? "Close menu" : "Open menu";
    }

    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));

    if (backdrop) {
      backdrop.addEventListener("click", () => setOpen(false));
    }

    nav.querySelectorAll(".site-nav-links a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) setOpen(false);
    });

    desktopQuery.addEventListener("change", (event) => {
      if (event.matches) setOpen(false);
    });

    closeNavMenu = () => setOpen(false);

    if (desktopQuery.matches) {
      drawer.setAttribute("aria-hidden", "false");
    }
  }

  function mountNav(activePage) {
    const slot = document.getElementById("site-nav");
    if (slot) slot.innerHTML = renderNav(activePage);
  }

  function renderFooterNavLinks(pages) {
    return pages
      .flatMap((page) => {
        const items = [`<a href="${page.href}">${escapeHtml(toTitleCase(page.label))}</a>`];
        if (page.children?.length) {
          for (const child of page.children) {
            const external = child.external ? ' target="_blank" rel="noopener"' : "";
            items.push(`<a href="${child.href}"${external}>${escapeHtml(toTitleCase(child.label))}</a>`);
          }
        }
        return items;
      })
      .join("");
  }

  function renderFooterSocialIcon(label) {
    const icons = {
      Instagram: `<svg class="footer-social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
      Facebook: `<svg class="footer-social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    };
    return icons[label] ?? "";
  }

  function renderFooterSocialLinks(links) {
    if (!links?.length) return "";
    const items = links
      .map((link) => {
        const icon = renderFooterSocialIcon(link.label);
        return `<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener" aria-label="${escapeHtml(link.label)}">${icon}</a>`;
      })
      .join("");
    return `<nav class="site-footer-social" aria-label="Social media">${items}</nav>`;
  }

  function renderFooter(site) {
    const prefix = navPrefix();
    const navLinks = renderFooterNavLinks(getNavPages(prefix));
    const footer = site?.footer ?? {};
    const social = renderFooterSocialLinks(footer.socialLinks);
    const coalition = (footer.coalitionLinks ?? [])
      .filter((link) => link.href !== "https://www.elkgrovelunarnewyear.com/")
      .map((link) => `<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`)
      .join(" + ");

    return `
    <footer class="site-footer">
      <nav class="site-footer-nav" aria-label="Footer">${navLinks}</nav>
      ${social}
      <p class="site-footer-meta">LunarNewYear@cPALSs.com${coalition ? ` · (${coalition})` : ""}</p>
    </footer>
  `;
  }

  function mountFooter(site) {
    const slot = document.getElementById("site-footer");
    if (!slot) return;
    slot.innerHTML = renderFooter(site);
  }

  async function loadSiteData() {
    const prefix = navPrefix();
    const res = await fetch(`${prefix}${SITE_DATA_URL}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load site data (${res.status})`);
    return res.json();
  }

  function renderRoleCard(role) {
    const title = role.emoji ? `${role.emoji} ${role.title}` : role.title;
    const phase2 = role.phase2 ? " phase2" : "";
    let body = "";

    if (role.experience) {
      body += `<dl><dt>What guests experience</dt><dd>${escapeHtml(role.experience)}</dd>`;
      body += `<dt>You'd own</dt><dd>${escapeHtml(role.own)}</dd>`;
      if (role.fit) body += `<dt>Good fit if you</dt><dd>${escapeHtml(role.fit)}</dd>`;
      body += "</dl>";
    } else {
      body += `<dl><dt>You'd own</dt><dd>${escapeHtml(role.own)}</dd>`;
      if (role.fit) body += `<dt>Good fit if you</dt><dd>${escapeHtml(role.fit)}</dd>`;
      body += "</dl>";
    }

    const note = role.note ? `<p class="role-note">${escapeHtml(role.note)}</p>` : "";

    return `<article class="role-card${phase2}"><h3>${escapeHtml(title)}</h3>${body}${note}</article>`;
  }

  function renderApplyBlock(site) {
    const apply = site.apply;
    const idealist = site.meta?.idealistUrl;
    const idealistBtn = idealist
      ? `<a class="btn btn-primary" href="${escapeHtml(idealist)}" target="_blank" rel="noopener">Apply on Idealist</a>`
      : `<span class="btn btn-primary" style="opacity:0.65;cursor:default" title="Idealist link coming soon">Apply on Idealist</span>`;

    const mailto = `mailto:${apply.email}?subject=${encodeURIComponent(apply.emailSubject)}`;

    return `
    <div class="cta-row">
      ${idealistBtn}
      <a class="btn btn-secondary" href="${mailto}">Email ${escapeHtml(apply.email)}</a>
    </div>
    <ol class="steps-list">
      ${apply.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
    </ol>
    <p class="muted">${escapeHtml(apply.idealistFallback)}</p>
  `;
  }

  function renderCoChairs(site) {
    return site.coChairs
      .map(
        (c) => `
    <div class="co-chair">
      <p class="co-chair-name">${escapeHtml(c.name)}</p>
      <p class="co-chair-title">${escapeHtml(c.title)}</p>
    </div>`,
      )
      .join("");
  }

  function setPageTitle(site, pageTitle) {
    const suffix = site.meta?.titleSuffix ?? "Lunar New Year Tết Festival & Parade";
    document.title = pageTitle
      ? `${toTitleCase(pageTitle)} — ${suffix}`
      : site.meta?.siteName ?? suffix;
  }

  function eventMetaLine1(event) {
    return [event.zodiacYear, event.dates].filter(Boolean).join(" · ");
  }

  function eventMetaLine2(event) {
    return [event.venue, event.tagline].filter(Boolean).join(" · ");
  }

  function renderEventSummary(site) {
    const e = site.event;
    return `<div class="event-summary">
      <p class="event-summary-dates">${escapeHtml(eventMetaLine1(e))}</p>
      <p class="event-summary-meta">${escapeHtml(eventMetaLine2(e))}</p>
    </div>`;
  }

  function renderAboutSections(about) {
    const sections = about.sections ?? [];
    if (sections.length) {
      return sections
        .map(
          (section) => `
      <section class="about-section">
        <h2>${escapeHtml(section.title)}</h2>
        ${section.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
      </section>`,
        )
        .join("");
    }
    return (about.paragraphs ?? []).map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  }

  function renderPosterWall(posterWall) {
    if (!posterWall) return "";
    const prefix = navPrefix();
    const cards = (posterWall.posters ?? [])
      .map((poster) => {
        const alt = `Lunar New Year ${poster.year} festival poster — ${poster.venue}`;
        const image = poster.image
          ? `<img class="poster-image" src="${escapeHtml(prefix + poster.image)}" alt="${escapeHtml(alt)}" loading="lazy" />`
          : "";
        return `
      <figure class="poster-card">
        ${image}
        <figcaption class="poster-caption">
          <span class="poster-year">${escapeHtml(String(poster.year))}</span>
          <span class="poster-venue">${escapeHtml(poster.venue)}</span>
        </figcaption>
      </figure>`;
      })
      .join("");

    return `
    <section class="poster-wall">
      <h2>${escapeHtml(posterWall.title ?? "Festival posters over the years")}</h2>
      ${posterWall.intro ? `<p class="muted">${escapeHtml(posterWall.intro)}</p>` : ""}
      <div class="poster-grid">${cards}</div>
      ${posterWall.note ? `<p class="muted">${escapeHtml(posterWall.note)}</p>` : ""}
    </section>`;
  }

  function initPageShell(activePage) {
    mountNav(activePage);
    initTheme();
    initNavMenu();
  }

  window.EglnySite = {
    initPageShell,
    loadSiteData,
    mountFooter,
    renderAboutSections,
    renderPosterWall,
    renderApplyBlock,
    renderCoChairs,
    renderEventSummary,
    renderRoleCard,
    setPageTitle,
    escapeHtml,
    navPrefix,
  };
})();
