/** Shared shell for eglny.com — scoped to avoid clashing with fund-the-festival/app.js globals */
(function () {
  const SITE_DATA_URL = "data/site.json";
  const THEME_STORAGE_KEY = "eglny-theme";
  const VALID_THEMES = new Set(["auto", "light", "dark"]);
  const STORED_THEMES = new Set(["light", "dark"]);

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadThemeFromStorage() {
    try {
      const theme = sessionStorage.getItem(THEME_STORAGE_KEY);
      return STORED_THEMES.has(theme) ? theme : "auto";
    } catch {
      return "auto";
    }
  }

  function resolvedAppearance(preference = loadThemeFromStorage()) {
    if (preference === "light" || preference === "dark") return preference;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function themeIconMarkup(appearance) {
    const icons = {
      light: `<svg class="theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
      dark: `<svg class="theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    };
    return icons[appearance] ?? icons.light;
  }

  function themeLabel(theme) {
    return { auto: "System", light: "Light", dark: "Dark" }[theme] ?? "System";
  }

  function renderThemeControl() {
    return `
      <button type="button" class="icon-btn theme-toggle" id="theme-toggle" aria-label="Color theme">
        ${themeIconMarkup("light")}
      </button>`;
  }

  function applyTheme(theme) {
    const next = VALID_THEMES.has(theme) ? theme : "auto";
    document.documentElement.setAttribute("data-theme", next);

    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
      const appearance = resolvedAppearance(next);
      toggle.innerHTML = `${themeIconMarkup(appearance)}<span class="sr-only">Color theme: ${themeLabel(next)}</span>`;
      toggle.setAttribute("aria-label", `Color theme: ${themeLabel(next)}`);
    }
  }

  function setTheme(theme) {
    const next = STORED_THEMES.has(theme) ? theme : "auto";
    applyTheme(next);
    try {
      if (STORED_THEMES.has(next)) sessionStorage.setItem(THEME_STORAGE_KEY, next);
      else sessionStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  let closeNavMenu = () => {};

  function initThemeToggle() {
    const toggle = document.getElementById("theme-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", () => {
      setTheme(resolvedAppearance() === "dark" ? "light" : "dark");
    });
  }

  function initTheme() {
    applyTheme(loadThemeFromStorage());
    initThemeToggle();
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (loadThemeFromStorage() === "auto") applyTheme("auto");
    });
  }

  function navPrefix() {
    const path = window.location.pathname.replace(/\/index\.html$/i, "").replace(/\/$/, "");
    const depth = path.split("/").filter(Boolean).length;
    return depth === 0 ? "" : "../".repeat(depth);
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

  function navLinkLabel(item) {
    return item.navLabel ?? toTitleCase(item.label);
  }

  function getNavPages() {
    return [
      { id: "home", label: "Home", href: "/" },
      { id: "about", label: "About", href: "/about/" },
      { id: "team", label: "Team", href: "/team/" },
      {
        id: "production",
        label: "Production",
        href: "/fund-the-festival/",
        children: [
          { id: "build", label: "Fund The Festival", navLabel: "Fund The Festival", href: "/fund-the-festival/" },
        ],
      },
      {
        id: "resources",
        label: "Resources",
        href: "/resources/",
        children: [
          { id: "season", label: "Lunar New Year Season", href: "/resources/season/" },
          { id: "sponsors", label: "Sponsors", href: "/sponsors/" },
          { id: "media", label: "Media", href: "/resources/media/" },
          { id: "blog", label: "Blog", href: "/resources/blog/" },
          { id: "archive2026", label: "2026 archive", href: "https://www.elkgrovelunarnewyear.com/", external: true },
        ],
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
              return `<div class="site-nav-sublink-wrap"><a class="site-nav-sublink" href="${child.href}"${childCurrent}${external}>${escapeHtml(navLinkLabel(child))}</a></div>`;
            })
            .join("");
          return `<div class="site-nav-group${childActive ? " is-active" : ""}"><a class="site-nav-parent" href="${page.href}"${parentCurrent}>${escapeHtml(navLinkLabel(page))}</a><div class="site-nav-submenu">${sublinks}</div></div>`;
        }
        const current = page.id === activePage ? ' aria-current="page"' : "";
        return `<a href="${page.href}"${current}>${escapeHtml(navLinkLabel(page))}</a>`;
      })
      .join("");
  }

  function renderNav(activePage) {
    const pages = getNavPages();

    const links = renderNavLinks(pages, activePage);

    return `
    <nav class="site-nav" aria-label="Main">
      <div class="site-nav-bar">
        <a class="site-nav-brand" href="/">
          <span class="site-nav-brand-full">Elk Grove Lunar New Year <span>Tết</span></span>
          <span class="site-nav-brand-short">EGLNY <span>Tết</span></span>
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
    const leafItems = [];
    const columns = [];

    for (const page of pages) {
      if (page.children?.length) {
        const items = [`<a href="${page.href}">${escapeHtml(navLinkLabel(page))}</a>`];
        for (const child of page.children) {
          const external = child.external ? ' target="_blank" rel="noopener"' : "";
          items.push(`<a href="${child.href}"${external}>${escapeHtml(navLinkLabel(child))}</a>`);
        }
        columns.push(`<div class="site-footer-nav-col">${items.join("")}</div>`);
      } else {
        leafItems.push(`<a href="${page.href}">${escapeHtml(navLinkLabel(page))}</a>`);
      }
    }

    if (leafItems.length) {
      columns.unshift(`<div class="site-footer-nav-col">${leafItems.join("")}</div>`);
    }
    return columns.join("");
  }

  function renderSocialIcon(label) {
    const icons = {
      Instagram: `<svg class="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
      Facebook: `<svg class="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    };
    return icons[label] ?? "";
  }

  function renderSocialLinkItems(links) {
    return (links ?? [])
      .map((link) => {
        const icon = renderSocialIcon(link.label);
        return `<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener" aria-label="${escapeHtml(link.label)}">${icon}</a>`;
      })
      .join("");
  }

  function renderNavSocialLinks(links) {
    if (!links?.length) return "";
    return `<nav class="site-nav-social" aria-label="Social media">${renderSocialLinkItems(links)}</nav>`;
  }

  function injectNavSocial(links) {
    const end = document.querySelector(".site-nav-end");
    const theme = end?.querySelector("#theme-toggle");
    if (!end || !theme) return;
    end.querySelector(".site-nav-social")?.remove();
    const html = renderNavSocialLinks(links);
    if (!html) return;
    theme.insertAdjacentHTML("beforebegin", html);
  }

  function renderFooterSocialLinks(links) {
    if (!links?.length) return "";
    return `<nav class="site-footer-social" aria-label="Social media">${renderSocialLinkItems(links)}</nav>`;
  }

  function renderFooter(site) {
    const navLinks = renderFooterNavLinks(getNavPages());
    const footer = site?.footer ?? {};
    const social = renderFooterSocialLinks(footer.socialLinks);
    const contactEmail = footer.contactEmail ?? site.apply?.email ?? "contact@eglny.com";
    const coalition = (footer.coalitionLinks ?? [])
      .filter((link) => link.href !== "https://www.elkgrovelunarnewyear.com/")
      .map((link) => `<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`)
      .join("\u00a0+\u00a0");

    return `
    <footer class="site-footer">
      <nav class="site-footer-nav" aria-label="Footer">${navLinks}</nav>
      ${social}
      <p class="site-footer-meta"><a href="mailto:${escapeHtml(contactEmail)}">${escapeHtml(contactEmail)}</a>${coalition ? ` · (${coalition})` : ""}</p>
    </footer>
  `;
  }

  function mountFooter(site) {
    const slot = document.getElementById("site-footer");
    if (!slot) return;
    slot.innerHTML = renderFooter(site);
  }

  let siteDataCache = null;
  let siteDataPromise = null;

  async function loadSiteData() {
    if (siteDataCache) return siteDataCache;
    if (!siteDataPromise) {
      siteDataPromise = (async () => {
        const prefix = navPrefix();
        const res = await fetch(`${prefix}${SITE_DATA_URL}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Could not load site data (${res.status})`);
        siteDataCache = await res.json();
        return siteDataCache;
      })();
    }
    return siteDataPromise;
  }

  function roleDirectorName(role) {
    if (role.director) return role.director;
    const note = role.note ?? "";
    const match = note.match(/^Director:\s*([^·]+)/);
    return match ? match[1].trim() : "";
  }

  function renderRoleCard(role) {
    const title = role.emoji ? `${role.emoji} ${role.title}` : role.title;
    const phase2 = role.phase2 ? " phase2" : "";

    const test = role.test ? `<p class="role-test">${escapeHtml(role.test)}</p>` : "";

    const directorName = roleDirectorName(role);
    const director = directorName
      ? `<p class="role-director">${escapeHtml(directorName)}, Director</p>`
      : "";
    const filled = directorName ? " role-card--filled" : "";

    const deliverable = role.ship ?? role.own;
    const shipBlock = deliverable
      ? `<div class="role-field">
        <p class="role-field-label">You'd ship</p>
        <p class="role-field-text">${escapeHtml(deliverable)}</p>
      </div>`
      : "";

    const fit = role.fit
      ? `<div class="role-field">
        <p class="role-field-label">Good fit if you</p>
        <p class="role-field-text">${escapeHtml(role.fit)}</p>
      </div>`
      : "";

    return `<article class="role-card${phase2}${filled}">
      <h3>${escapeHtml(title)}</h3>
      ${director}
      ${test}
      ${shipBlock}
      ${fit}
    </article>`;
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
    const suffix = site.meta?.titleSuffix ?? "Elk Grove Lunar New Year Tết";
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

  function slugifyHeading(text) {
    return String(text)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "");
  }

  function sectionId(section, fallbackTitle) {
    return section?.id ?? slugifyHeading(fallbackTitle ?? section?.title ?? "section");
  }

  function renderDocToc(tocItems) {
    const links = (tocItems ?? [])
      .map(
        (item) =>
          `<a class="site-doc-toc-link" href="#${escapeHtml(item.id)}" data-toc-target="${escapeHtml(item.id)}">${escapeHtml(item.label)}</a>`,
      )
      .join("");
    return `<nav class="site-doc-toc" aria-label="On this page"><p class="site-doc-toc-label">On this page</p>${links}</nav>`;
  }

  function wrapDocLayout(tocHtml, mainHtml) {
    return `<div class="site-doc-layout">${tocHtml}<div class="site-doc-main">${mainHtml}</div></div>`;
  }

  function buildAboutToc(about) {
    const items = (about.sections ?? []).map((section) => ({
      id: sectionId(section),
      label: section.title,
    }));
    if (about.posterWall) {
      items.push({
        id: "posters",
        label: about.posterWall.title ?? "Festival posters",
      });
    }
    return items;
  }

  function buildTeamToc(site) {
    const meetings = site.productionMeetings;
    return [
      ...(meetings ? [{ id: "production-meetings", label: meetings.title ?? "Production meetings" }] : []),
      { id: "director-roles", label: "Director roles" },
      ...(site.lanes ?? []).map((lane) => ({ id: lane.id, label: lane.title })),
      { id: "phase2", label: site.phase2?.title ?? "Phase 2" },
      { id: "apply", label: "How to apply" },
      { id: "faq", label: "FAQ" },
    ];
  }

  function initDocToc() {
    return window.DocScroll.init();
  }

  function renderAboutSections(about) {
    const sections = about.sections ?? [];
    if (sections.length) {
      return sections
        .map(
          (section) => {
            const id = sectionId(section);
            return `
      <section class="about-section site-doc-section" id="${escapeHtml(id)}" data-doc-section>
        <h2>${escapeHtml(section.title)}</h2>
        ${section.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
      </section>`;
          },
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
    <section class="poster-wall site-doc-section" id="posters" data-doc-section>
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
    loadSiteData()
      .then((site) => {
        injectNavSocial(site?.footer?.socialLinks);
        mountFooter(site);
      })
      .catch(() => {});
  }

  async function loadSeasonEvents() {
    const prefix = navPrefix();
    const res = await fetch(`${prefix}data/season-events.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load season events (${res.status})`);
    return res.json();
  }

  function externalLinkAttrs(href) {
    if (!href || href.startsWith("/")) return "";
    return ' target="_blank" rel="noopener"';
  }

  function renderSeasonEventItem(event) {
    const capstoneClass = event.capstone ? " season-event-capstone" : "";
    const nameHtml = event.href
      ? `<a href="${escapeHtml(event.href)}"${externalLinkAttrs(event.href)}>${escapeHtml(event.name)}</a>`
      : escapeHtml(event.name);
    const hostPart = event.host ? ` · ${escapeHtml(event.host)}` : "";
    return `<li class="season-event-item${capstoneClass}">
      <span class="season-event-dates">${escapeHtml(event.dates)}</span>
      <span class="season-event-title">${nameHtml}${hostPart}</span>
      <span class="season-event-location">${escapeHtml(event.location)}</span>
    </li>`;
  }

  function renderSeasonPage(season, seasonData) {
    const events = seasonData?.events ?? [];
    const seasonTitle = season?.title ?? "Lunar New Year Season";
    const listItems = events.map(renderSeasonEventItem).join("");
    const listNote = season?.listNote
      ? `<p class="muted season-list-note">${escapeHtml(season.listNote)}</p>`
      : "";
    const contactNote = season?.contactNote
      ? `<p class="muted season-contact-note">${escapeHtml(season.contactNote)}</p>`
      : "";
    const toc = [{ id: "season", label: seasonTitle }];
    const seasonSection = `
      <section class="about-section resources-season site-doc-section" id="season" data-doc-section>
        <h2>${escapeHtml(seasonTitle)}</h2>
        ${season?.intro ? `<p>${escapeHtml(season.intro)}</p>` : ""}
        ${events.length ? `<ul class="season-event-list">${listItems}</ul>` : `<p class="muted">Season events coming soon.</p>`}
        ${listNote}
        ${contactNote}
      </section>`;

    return `
      <section class="hero">
        <h1>${escapeHtml(season?.headline ?? "Lunar New Year Season")}</h1>
        ${season?.lead ? `<p class="hero-lead">${escapeHtml(season.lead)}</p>` : ""}
      </section>
      ${wrapDocLayout(renderDocToc(toc), seasonSection)}`;
  }

  function renderResourcesPage(resources) {
    const links = resources?.links ?? [];
    const cards = links
      .map(
        (link) => `
      <a class="resource-card" href="${escapeHtml(link.href)}">
        <h2>${escapeHtml(link.title)}</h2>
        ${link.body ? `<p>${escapeHtml(link.body)}</p>` : ""}
      </a>`,
      )
      .join("");

    return `
      <section class="hero">
        <h1>${escapeHtml(resources?.headline ?? "Resources")}</h1>
        ${resources?.lead ? `<p class="hero-lead">${escapeHtml(resources.lead)}</p>` : ""}
      </section>
      <div class="resource-card-grid">${cards}</div>`;
  }

  function renderMediaVideoCard(video) {
    const id = String(video.youtubeId ?? "").trim();
    const title = video.title ?? "Festival video";
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
    const embedSrc = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
    const poster = `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
    return `
      <figure class="video-card">
        <div class="video-embed" data-youtube-id="${escapeHtml(id)}" data-embed-src="${escapeHtml(embedSrc)}">
          <button type="button" class="video-play" aria-label="Play ${escapeHtml(title)}">
            <img class="video-poster" src="${escapeHtml(poster)}" alt="" loading="lazy" width="480" height="360" />
            <span class="video-play-icon" aria-hidden="true"></span>
          </button>
          <a class="video-fallback-link" href="${escapeHtml(watchUrl)}" target="_blank" rel="noopener">Watch on YouTube</a>
        </div>
        <figcaption class="video-caption">${escapeHtml(title)}</figcaption>
      </figure>`;
  }

  function renderMediaPage(media) {
    const videos = media?.videos ?? [];
    const byYear = new Map();
    for (const video of videos) {
      const year = String(video.year ?? "Videos");
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year).push(video);
    }
    const years = [...byYear.keys()].sort((a, b) => String(b).localeCompare(String(a)));
    const sections = years
      .map((year) => {
        const cards = byYear.get(year).map(renderMediaVideoCard).join("");
        return `
      <section class="media-year-section" aria-labelledby="media-year-${escapeHtml(year)}">
        <h2 class="media-year-heading" id="media-year-${escapeHtml(year)}">${escapeHtml(year)}</h2>
        <div class="video-grid">${cards}</div>
      </section>`;
      })
      .join("");

    const contact = media?.contactNote
      ? `<p class="muted media-contact-note">${escapeHtml(media.contactNote)}</p>`
      : "";

    return `
      <section class="hero">
        <h1>${escapeHtml(media?.headline ?? "Media")}</h1>
        ${media?.lead ? `<p class="hero-lead">${escapeHtml(media.lead)}</p>` : ""}
      </section>
      <div class="media-page-body">
        ${videos.length ? sections : `<p class="muted">Media coming soon.</p>`}
        ${contact}
      </div>`;
  }

  function initMediaPlayers(root = document) {
    root.querySelectorAll(".video-embed[data-embed-src]").forEach((embed) => {
      const button = embed.querySelector(".video-play");
      if (!button || button.dataset.bound === "1") return;
      button.dataset.bound = "1";
      button.addEventListener("click", () => {
        const src = embed.getAttribute("data-embed-src");
        const title = button.getAttribute("aria-label")?.replace(/^Play\s+/, "") || "Festival video";
        if (!src) return;
        embed.innerHTML = `<iframe
          src="${src}"
          title="${escapeHtml(title)}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>`;
      });
    });
  }

  function renderTeamPage(site) {
    const intro = site.directorIntro;
    const meetings = site.productionMeetings;
    const contactEmail = site.apply?.email ?? "contact@eglny.com";

    const meetingsHtml = meetings
      ? `
          <section class="content-section site-doc-section" id="production-meetings" data-doc-section>
            <h2>${escapeHtml(meetings.title ?? "Production meetings")}</h2>
            ${meetings.intro ? `<p>${escapeHtml(meetings.intro)}</p>` : ""}
            <ul>
              <li>${escapeHtml(meetings.zoom).replace(
                escapeHtml(contactEmail),
                `<a href="mailto:${escapeHtml(contactEmail)}">${escapeHtml(contactEmail)}</a>`,
              )}</li>
              <li><a href="${escapeHtml(meetings.discordHref)}"${externalLinkAttrs(meetings.discordHref)}>${escapeHtml(meetings.discordLabel ?? "Join the Discord")}</a></li>
            </ul>
          </section>`
      : "";

    const lanesHtml = site.lanes
      .map(
        (lane) => `
          <section class="lane-section site-doc-section" id="${escapeHtml(lane.id)}" data-doc-section>
            <div class="lane-header">
              <h2>${escapeHtml(lane.title)}</h2>
              <p><strong>${escapeHtml(lane.subtitle)}</strong>${lane.intro ? " — " + escapeHtml(lane.intro) : ""}</p>
            </div>
            ${lane.roles.map(renderRoleCard).join("")}
          </section>`,
      )
      .join("");

    const phase2 = site.phase2;
    const phase2Html = `
          <section class="content-section site-doc-section" id="phase2" data-doc-section>
            <h2>${escapeHtml(phase2.title)}</h2>
            <p>${escapeHtml(phase2.intro)}</p>
            <ul>${phase2.roles.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
            <p><a href="${escapeHtml(phase2.registryHref)}">See the registry →</a></p>
          </section>`;

    const faqHtml = site.faq
      .map(
        (f) => `
          <div class="faq-item">
            <h3>${escapeHtml(f.q)}</h3>
            <p>${escapeHtml(f.a)}</p>
          </div>`,
      )
      .join("");

    const mainHtml = `
          ${meetingsHtml}
          <section class="content-section site-doc-section" id="director-roles" data-doc-section>
            <h2>Director roles — 2027 festival</h2>
            <h3>${escapeHtml(intro.title)}</h3>
            ${intro.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
            <ul>${intro.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>
          </section>
          ${lanesHtml}
          ${phase2Html}
          <section class="content-section site-doc-section" id="apply" data-doc-section>
            <h2>How to apply</h2>
            ${renderApplyBlock(site)}
            <div class="co-chairs">${renderCoChairs(site)}</div>
          </section>
          <section class="content-section site-doc-section" id="faq" data-doc-section>
            <h2>FAQ</h2>
            ${faqHtml}
          </section>`;

    return wrapDocLayout(renderDocToc(buildTeamToc(site)), mainHtml);
  }

  window.EglnySite = {
    initPageShell,
    loadSiteData,
    mountFooter,
    buildAboutToc,
    renderAboutSections,
    renderPosterWall,
    renderApplyBlock,
    renderCoChairs,
    renderDocToc,
    renderEventSummary,
    loadSeasonEvents,
    initMediaPlayers,
    renderMediaPage,
    renderResourcesPage,
    renderSeasonPage,
    renderRoleCard,
    renderTeamPage,
    setPageTitle,
    wrapDocLayout,
    initDocToc,
    slugifyHeading,
    escapeHtml,
    navPrefix,
  };
})();
