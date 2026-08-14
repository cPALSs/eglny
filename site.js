/** Shared shell for eglny.com — scoped to avoid clashing with fund-the-festival/app.js globals */
(function () {
  const SITE_DATA_URL = "data/site.json";
  const SKU_CATALOG_URL = "data/sku-catalog.json";
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

  /** First “Fund The Festival” in already-escaped HTML → link to the registry. */
  function linkFirstFundTheFestival(html) {
    return String(html).replace(
      /Fund The Festival/,
      '<a href="/fund-the-festival/">Fund The Festival</a>',
    );
  }

  /** First “Open roles” in already-escaped HTML → link to the roles page. */
  function linkFirstOpenRoles(html) {
    return String(html).replace(/Open roles/, '<a href="/team/roles/">Open roles</a>');
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
        // Keep acronyms / ALL-CAPS tokens (RFP, RFPs, EGLNY, …)
        if (/^[A-Z0-9]{2,}s?$/.test(part)) return part;
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

  /** Public Drive PDF — keep in sync with Business Dev export. */
  const SPONSORSHIP_PACKET_PDF_URL =
    "https://drive.google.com/file/d/1rrwG0v8IZRp4qqH6nlx_c8PQZM2kynkT/view";

  function getNavPages() {
    return [
      { id: "home", label: "Home", href: "/" },
      { id: "about", label: "About", href: "/about/" },
      {
        id: "team",
        label: "Team",
        href: "/team/",
        children: [
          { id: "roster", label: "Roster", href: "/team/" },
          { id: "roles", label: "Open Roles", href: "/team/roles/" },
        ],
      },
      {
        id: "production",
        label: "Production",
        href: "/production/",
        children: [
          { id: "sponsorship", label: "Sponsorship", navLabel: "Sponsorship", href: "/sponsorship/" },
          { id: "build", label: "Fund The Festival", navLabel: "Fund The Festival", href: "/fund-the-festival/" },
          { id: "booths", label: "Vendor booths", navLabel: "Vendor booths", href: "/vendors/" },
          { id: "host", label: "Custom Zones", navLabel: "Custom Zones", href: "/custom-zones/" },
          { id: "rfp", label: "RFPs", navLabel: "RFPs", href: "/rfp/" },
          { id: "volunteer", label: "Volunteering", navLabel: "Volunteering", href: "/production/volunteer/" },
        ],
      },
      {
        id: "attendees",
        label: "Attendees",
        href: "/attendees/",
        children: [
          { id: "food-menu", label: "Food menu", navLabel: "Food menu", href: "/food-menu/" },
        ],
      },
      {
        id: "resources",
        label: "Resources",
        href: "/resources/",
        children: [
          { id: "season", label: "LNY Season", href: "/resources/season/" },
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

  function renderResponsibilityList(roles) {
    const items = (roles ?? [])
      .map((role) => {
        const detail = role.own ?? role.ship ?? "";
        return `<li><strong>${escapeHtml(role.title)}</strong>${
          detail ? ` — ${escapeHtml(detail)}` : ""
        }</li>`;
      })
      .join("");
    return `<ul class="responsibility-list">${items}</ul>`;
  }

  function renderLaneSection(lane) {
    const body =
      lane.layout === "responsibility-list"
        ? renderResponsibilityList(lane.roles)
        : (lane.roles ?? []).map(renderRoleCard).join("");
    const layoutClass =
      lane.layout === "responsibility-list" ? " lane-section--list" : "";
    return `
          <section class="lane-section${layoutClass} site-doc-section" id="${escapeHtml(lane.id)}" data-doc-section>
            <div class="lane-header">
              <h2>${escapeHtml(lane.title)}</h2>
              <p><strong>${escapeHtml(lane.subtitle)}</strong>${lane.intro ? " — " + escapeHtml(lane.intro) : ""}</p>
            </div>
            ${body}
          </section>`;
  }

  function renderApplyBlock(site) {
    const apply = site.apply;
    const idealist = site.meta?.idealistUrl;
    const idealistLabel = site.meta?.idealistCtaLabel ?? "Apply on Idealist";
    if (!idealist) {
      const mailto = `mailto:${apply.email}?subject=${encodeURIComponent(apply.emailSubject)}`;
      return `
    <div class="cta-row">
      <a class="btn btn-primary" href="${mailto}">Email ${escapeHtml(apply.email)}</a>
    </div>`;
    }

    return `
    <div class="cta-row">
      <a class="btn btn-primary" href="${escapeHtml(idealist)}" target="_blank" rel="noopener">${escapeHtml(idealistLabel)}</a>
    </div>
    ${apply.idealistFallback ? `<p class="muted">${escapeHtml(apply.idealistFallback)}</p>` : ""}
  `;
  }

  function renderSkillsProjectsSection(site, { showHeading = true } = {}) {
    const block = site.teamPage?.skillsProjects;
    const projects = block?.projects ?? [];
    if (!projects.length) return "";
    const ctaClass = projects.length === 1 ? "btn btn-primary" : "btn btn-secondary";
    const cards = projects
      .map((p) => {
        const cta = p.idealistUrl
          ? `<p class="cta-row"><a class="${ctaClass}" href="${escapeHtml(p.idealistUrl)}" target="_blank" rel="noopener">${escapeHtml(p.idealistCtaLabel ?? "Apply on Idealist")}</a></p>`
          : "";
        return `
            <article class="role-card skills-project-card" id="${escapeHtml(p.id)}">
              <h3>${escapeHtml(p.title)}</h3>
              ${p.blurb ? `<p>${escapeHtml(p.blurb)}</p>` : ""}
              ${p.commitment ? `<p class="muted"><strong>Commitment:</strong> ${escapeHtml(p.commitment)}</p>` : ""}
              ${cta}
              ${p.idealistNote ? `<p class="muted">${escapeHtml(p.idealistNote)}</p>` : ""}
            </article>`;
      })
      .join("");
    const heading = showHeading
      ? `<h2>${escapeHtml(block.sectionTitle ?? "Skills projects")}</h2>
            ${block.intro ? `<p>${escapeHtml(block.intro)}</p>` : ""}`
      : block.intro
        ? `<p>${escapeHtml(block.intro)}</p>`
        : "";
    return `
          <section class="content-section site-doc-section" id="skills-projects" data-doc-section>
            ${heading}
            <div class="skills-projects-grid">${cards}</div>
          </section>`;
  }

  function renderVolunteerPage(site) {
    const block = site.teamPage?.skillsProjects;
    const skillsTitle = block?.sectionTitle ?? "Skills projects";
    const dayOf = block?.dayOfHelp;
    const projects = block?.projects ?? [];
    const ctaClass = projects.length === 1 ? "btn btn-primary" : "btn btn-secondary";
    const skillsHtml = `
          <section class="content-section site-doc-section" id="skills-projects" data-doc-section>
            <h2>${escapeHtml(skillsTitle)}</h2>
            <div class="skills-projects-grid">${projects
              .map((p) => {
                const cta = p.idealistUrl
                  ? `<p class="cta-row"><a class="${ctaClass}" href="${escapeHtml(p.idealistUrl)}" target="_blank" rel="noopener">${escapeHtml(p.idealistCtaLabel ?? "Apply on Idealist")}</a></p>`
                  : "";
                return `
            <article class="role-card skills-project-card" id="${escapeHtml(p.id)}">
              <h3>${escapeHtml(p.title)}</h3>
              ${p.blurb ? `<p>${escapeHtml(p.blurb)}</p>` : ""}
              ${p.commitment ? `<p class="muted"><strong>Commitment:</strong> ${escapeHtml(p.commitment)}</p>` : ""}
              ${cta}
              ${p.idealistNote ? `<p class="muted">${escapeHtml(p.idealistNote)}</p>` : ""}
            </article>`;
              })
              .join("")}</div>
          </section>`;
    const dayOfHtml = dayOf
      ? `
          <section class="content-section site-doc-section" id="day-of-help" data-doc-section>
            <h2>${escapeHtml(dayOf.title ?? "Day-of help")}</h2>
            <p>${escapeHtml(dayOf.body ?? "Registration is not yet available — come back later.")}</p>
          </section>`
      : "";
    const toc = [
      { id: "skills-projects", label: skillsTitle },
      ...(dayOf ? [{ id: "day-of-help", label: dayOf.title ?? "Day-of help" }] : []),
    ];
    return wrapDocLayout(renderDocToc(toc), `${skillsHtml}${dayOfHtml}`);
  }

  /** @deprecated Prefer renderVolunteerPage */
  function renderSkillsProjectsPage(site) {
    return renderVolunteerPage(site);
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
    document.title = pageTitle ? `${pageTitle} — ${suffix}` : site.meta?.siteName ?? suffix;
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

  function splitEventDates(event) {
    const keepTimeMeridiem = (s) =>
      String(s).replace(/(\d{1,2}(?::\d{2})?)\s+(AM|PM)\b/gi, "$1\u00A0$2");
    const raw = String(event?.dates || "");
    const parts = raw.split("·").map((part) => part.trim()).filter(Boolean);
    return {
      datePrimary: (parts[0] || raw).toUpperCase(),
      timePrimary: keepTimeMeridiem(parts[1] || ""),
      weekdayHint: event?.weekdayHint || "SAT & SUN",
    };
  }

  function festivalMetaIcon(kind) {
    const icons = {
      calendar: `<svg class="festival-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
      pin: `<svg class="festival-meta-icon festival-meta-icon--pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 22s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
      people: `<svg class="festival-meta-icon festival-meta-icon--people" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    };
    return icons[kind] ?? "";
  }

  /** Local calendar day from YYYY-MM-DD (avoids UTC shift). */
  function parseEventDay(iso) {
    const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  /**
   * Soul Torrent “sky” malevolence — cloud language by days until the festival.
   * After the prior year → clear; mid-cycle → building; month of → dangerous.
   * Orb intensity scales 1 (clear) → 10 (dangerous).
   */
  const MALEVOLENCE_INTENSITY = {
    clear: 1,
    fair: 3,
    building: 5,
    gathering: 7,
    stormy: 8,
    dangerous: 10,
  };

  function malevolenceStatus(event, now = new Date()) {
    const start = parseEventDay(event?.startDate) || parseEventDay("2027-02-13");
    const end = parseEventDay(event?.endDate) || parseEventDay("2027-02-14") || start;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let status = "dangerous";
    if (today > end) status = "clear";
    else if (today >= start) status = "dangerous";
    else {
      const days = Math.round((start - today) / 86400000);
      if (days > 300) status = "clear";
      else if (days > 240) status = "fair";
      else if (days > 150) status = "building";
      else if (days > 90) status = "gathering";
      else if (days > 45) status = "stormy";
      else status = "dangerous";
    }
    return {
      status,
      intensity: MALEVOLENCE_INTENSITY[status] ?? 5,
    };
  }

  function renderFestivalHero(site) {
    const event = site.event ?? {};
    const hero = site.hero ?? {};
    const dates = splitEventDates(event);
    const venue = event.venueShort || event.venue || "Elk\u00A0Grove Park";
    const address = event.address || "";
    const freeLine = event.admissionLabel || "Free community celebration";
    const headline = hero.festivalHeadline || "Celebrate Lunar New Year Tết in Elk\u00A0Grove";
    const lead =
      hero.festivalLead ||
      "A joyful celebration of heritage, community, and new beginnings. Enjoy traditional performances, delicious food, music, and activities for the whole family.";
    const keepElkGrove = (s) => String(s).replace(/Elk Grove/g, "Elk\u00A0Grove");
    const { status: malevolence, intensity } = malevolenceStatus(event);
    const malevolenceDisplay = malevolence.charAt(0).toUpperCase() + malevolence.slice(1);

    return `
      <section class="festival-hero" aria-label="Festival highlight">
        <div class="festival-hero-inner">
          <div class="festival-hero-main">
            <div class="festival-hero-copy">
              <h1>${escapeHtml(keepElkGrove(headline))}</h1>
              <p class="festival-hero-lead">${escapeHtml(lead).replace(
                /Soul Torrent/g,
                '<a href="/about/#soul-torrent">Soul Torrent</a>',
              )}</p>
            </div>
            <div class="festival-hero-meta" role="group" aria-label="Event details">
              <div class="festival-meta-item">
                ${festivalMetaIcon("calendar")}
                <div>
                  <p class="festival-meta-label festival-meta-label--tabular">${escapeHtml(dates.datePrimary)}</p>
                  <p class="festival-meta-detail">${escapeHtml(
                    [dates.weekdayHint, dates.timePrimary].filter(Boolean).join(" · "),
                  )}</p>
                </div>
              </div>
              <div class="festival-meta-item">
                ${festivalMetaIcon("pin")}
                <div>
                  <p class="festival-meta-label">${escapeHtml(keepElkGrove(String(venue)).toUpperCase())}</p>
                  ${address ? `<p class="festival-meta-detail">${escapeHtml(keepElkGrove(address))}</p>` : ""}
                </div>
              </div>
              <div class="festival-meta-item">
                ${festivalMetaIcon("people")}
                <div>
                  <p class="festival-meta-label">Free Admission</p>
                  <p class="festival-meta-detail">${escapeHtml(
                    String(freeLine).replace(/^free(\s+admission)?\s+/i, "").toUpperCase() ||
                      "COMMUNITY CELEBRATION",
                  )}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="festival-hero-art">
            <div
              id="festival-hero-orb"
              class="festival-hero-orb"
              data-intensity="${intensity}"
              role="img"
              aria-label="Abstract colorful twisted sphere animation"
            ></div>
            <p class="festival-malevolence" data-malevolence="${escapeHtml(malevolence)}">
              Malevolence:\u00A0<span>${escapeHtml(malevolenceDisplay)}</span>
            </p>
          </div>
        </div>
      </section>
    `;
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

  function renderDocToc(tocItems, options = {}) {
    const links = (tocItems ?? [])
      .map((item) => {
        if (item?.type === "divider" || item?.divider) {
          return `<p class="site-doc-toc-label site-doc-toc-label--section">${escapeHtml(
            item.label ?? "",
          )}</p>`;
        }
        return `<a class="site-doc-toc-link" href="#${escapeHtml(item.id)}" data-toc-target="${escapeHtml(item.id)}">${escapeHtml(item.label)}</a>`;
      })
      .join("");
    const back =
      options.backHref != null
        ? `<a class="site-doc-toc-back" href="${escapeHtml(options.backHref)}">${escapeHtml(
            options.backLabel ?? "← Back",
          )}</a>`
        : "";
    const navClass = options.backHref != null ? "site-doc-toc site-doc-toc--with-back" : "site-doc-toc";
    return `<nav class="${navClass}" aria-label="On this page">${back}<p class="site-doc-toc-label">On this page</p>${links}</nav>`;
  }

  function wrapDocLayout(tocHtml, mainHtml) {
    return `<div class="site-doc-layout">${tocHtml}<div class="site-doc-main">${mainHtml}</div></div>`;
  }

  function buildAboutToc(about) {
    const items = (about.sections ?? []).map((section) => ({
      id: sectionId(section),
      label: section.title,
    }));
    return items;
  }

  function buildJoinToc(site) {
    const team = site.teamPage;
    return [
      ...(team?.join ? [{ id: "get-involved", label: team.join.title ?? "Get involved" }] : []),
      { id: "faq", label: "FAQ" },
    ];
  }

  function buildRosterToc(site) {
    const groups = site.teamPage?.roster?.groups ?? [];
    return groups
      .filter((group) => group.title)
      .map((group) => ({
        id: slugifyHeading(group.title),
        label: group.title,
      }));
  }

  function buildTeamToc(site) {
    return buildJoinToc(site);
  }

  function buildOpenRolesToc(site) {
    const unlock = site.phase2;
    return [
      { id: "what-is-a-director", label: site.directorIntro?.title ?? "What is a director?" },
      { id: "apply", label: "Apply & get involved" },
      { id: "faq", label: "FAQ" },
      ...(site.lanes ?? []).map((lane) => ({ id: lane.id, label: lane.title })),
      ...(unlock ? [{ id: "sponsor-unlocks", label: unlock.title ?? "Sponsor unlocks" }] : []),
    ];
  }

  function buildDirectorRolesToc(site) {
    return buildOpenRolesToc(site);
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
        ${section.paragraphs.map((p) => `<p>${linkFirstFundTheFestival(escapeHtml(p))}</p>`).join("")}
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

  function revealPage() {
    document.documentElement.classList.add("is-hydrated");
  }

  /**
   * @param {string} activePage
   * @param {{ autoReveal?: boolean }} [options] autoReveal for pages with static main (blog, FTF)
   */
  function initPageShell(activePage, options = {}) {
    mountNav(activePage);
    initTheme();
    initNavMenu();
    const ready = loadSiteData()
      .then((site) => {
        injectNavSocial(site?.footer?.socialLinks);
        mountFooter(site);
        return site;
      })
      .catch(() => null);
    if (options.autoReveal) {
      ready.finally(() => revealPage());
    }
    return ready;
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

  function seasonEventCertainty(event) {
    const explicit = String(event.certainty || "").toLowerCase().trim();
    if (
      explicit === "estimated" ||
      explicit === "tentative" ||
      explicit === "cancelled" ||
      explicit === "canceled" ||
      explicit === "confirmed"
    ) {
      return explicit === "canceled" ? "cancelled" : explicit;
    }
    const dates = String(event.dates || "").toLowerCase();
    if (/not hosting|cancelled|canceled/.test(dates)) return "cancelled";
    if (/\(estimated\)/.test(dates) || /\bestimated\b/.test(dates)) return "estimated";
    if (
      /\(tentative\)/.test(dates) ||
      /\btentative\b/.test(dates) ||
      /to be finalized|\btbd\b/.test(dates)
    ) {
      return "tentative";
    }
    return "confirmed";
  }

  function renderSeasonEventItem(event) {
    const certainty = seasonEventCertainty(event);
    const soft =
      certainty === "estimated" ||
      certainty === "tentative" ||
      certainty === "cancelled";
    const softClass = soft ? " season-event-item--soft" : "";
    const certaintyClass = soft ? ` season-event-item--${certainty}` : "";
    const capstoneClass = event.capstone ? " season-event-capstone" : "";
    const nameHtml = event.href
      ? `<a href="${escapeHtml(event.href)}"${externalLinkAttrs(event.href)}>${escapeHtml(event.name)}</a>`
      : escapeHtml(event.name);
    const hostPart = event.host ? ` · ${escapeHtml(event.host)}` : "";
    return `<li class="season-event-item${capstoneClass}${softClass}${certaintyClass}" data-certainty="${certainty}">
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
        ${listNote}
        ${contactNote}
        ${events.length ? `<ul class="season-event-list">${listItems}</ul>` : `<p class="muted">Season events coming soon.</p>`}
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
      .map((link) => {
        const external = link.external ? ' target="_blank" rel="noopener"' : "";
        return `
      <a class="resource-card" href="${escapeHtml(link.href)}"${external}>
        <h3>${escapeHtml(link.title)}</h3>
        ${link.body ? `<p>${escapeHtml(link.body)}</p>` : ""}
      </a>`;
      })
      .join("");

    return `
      <section class="hero">
        <h1>${escapeHtml(resources?.headline ?? "Resources")}</h1>
        ${resources?.lead ? `<p class="hero-lead">${escapeHtml(resources.lead)}</p>` : ""}
      </section>
      <div class="resource-card-grid">${cards}</div>`;
  }

  function renderProductionPage(production) {
    return renderResourcesPage({
      headline: production?.headline ?? "Production",
      lead: production?.lead,
      links: production?.links,
    });
  }

  function renderAttendeesPage(attendees) {
    return renderResourcesPage({
      headline: attendees?.headline ?? "Attendees",
      lead: attendees?.lead,
      links: attendees?.links,
    });
  }

  function renderSponsorTierHtml(sponsorsData, options = {}) {
    const sponsors = sponsorsData?.sponsors ?? [];
    const tierOrder = sponsorsData?.tierOrder ?? [];
    const byTier = new Map();
    for (const s of sponsors) {
      const tier = s.tier ?? "Partner";
      if (!byTier.has(tier)) byTier.set(tier, []);
      byTier.get(tier).push(s);
    }
    const sortedTiers = [
      ...tierOrder.filter((t) => byTier.has(t)),
      ...[...byTier.keys()].filter((t) => !tierOrder.includes(t)),
    ];
    const logoPrefix = options.logoPrefix ?? "/sponsors/";
    return sortedTiers
      .map((tier) => {
        const tierId = slugifyHeading(tier);
        const cards = byTier
          .get(tier)
          .map((s) => {
            const inner = s.logo
              ? `<img src="${escapeHtml(logoPrefix)}${escapeHtml(s.logo)}" alt="${escapeHtml(s.name)}" />`
              : escapeHtml(s.name);
            if (s.url) {
              return `<a class="sponsor-card" href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${inner}</a>`;
            }
            return `<div class="sponsor-card">${inner}</div>`;
          })
          .join("");
        return `<section class="sponsor-tier site-doc-section" id="${escapeHtml(tierId)}" data-doc-section><h2>${escapeHtml(tier)}</h2><div class="sponsor-grid">${cards}</div></section>`;
      })
      .join("");
  }

  function renderSponsorshipPage(sponsorship, sponsorsData) {
    const links = sponsorship?.links ?? [];
    const partnerCards = links
      .map((link) => {
        const external = link.external ? ' target="_blank" rel="noopener"' : "";
        return `
      <a class="resource-card" href="${escapeHtml(link.href)}"${external}>
        <h3>${escapeHtml(link.title)}</h3>
        ${link.body ? `<p>${escapeHtml(link.body)}</p>` : ""}
      </a>`;
      })
      .join("");

    const year = sponsorsData?.eventYear ?? 2026;
    const thankYouTitle = sponsorship?.thankYouTitle ?? `Thank You, ${year} Festival Sponsors`;
    const thankYouLead =
      sponsorship?.thankYouLead ??
      `Our ${year} festival was made possible by these partners and sponsors.`;

    const sponsors = sponsorsData?.sponsors ?? [];
    const tierOrder = sponsorsData?.tierOrder ?? [];
    const byTier = new Map();
    for (const s of sponsors) {
      const tier = s.tier ?? "Partner";
      if (!byTier.has(tier)) byTier.set(tier, []);
      byTier.get(tier).push(s);
    }
    const sortedTiers = [
      ...tierOrder.filter((t) => byTier.has(t)),
      ...[...byTier.keys()].filter((t) => !tierOrder.includes(t)),
    ];
    const tiersHtml = renderSponsorTierHtml(sponsorsData);

    const tocItems = [
      { id: "partner", label: sponsorship?.partnerTitle ?? "Partner with us" },
      {
        type: "divider",
        label: sponsorship?.sponsorsTocLabel ?? `${year} Sponsors`,
      },
      ...sortedTiers.map((tier) => ({ id: slugifyHeading(tier), label: tier })),
    ];

    const partnerEmail = sponsorship?.partnerContactEmail ?? "sponsorship@eglny.com";
    const partnerContactNote = sponsorship?.partnerContactNote
      ? `<p class="muted">${escapeHtml(sponsorship.partnerContactNote).replace(
          escapeHtml(partnerEmail),
          `<a href="mailto:${escapeHtml(partnerEmail)}?subject=${encodeURIComponent("LNY 2027 sponsorship")}">${escapeHtml(partnerEmail)}</a>`,
        )}</p>`
      : "";

    const mainHtml = `
      <section class="content-section site-doc-section" id="partner" data-doc-section>
        <h2>${escapeHtml(sponsorship?.partnerTitle ?? "Partner with us")}</h2>
        ${sponsorship?.partnerIntro ? `<p>${escapeHtml(sponsorship.partnerIntro)}</p>` : ""}
        <div class="resource-card-grid">${partnerCards}</div>
        ${partnerContactNote}
      </section>
      <div class="sponsorship-thank-you" id="thank-you-2026">
        <h2 class="sponsorship-thank-you-title">${escapeHtml(thankYouTitle)}</h2>
        <p>${escapeHtml(thankYouLead)}</p>
      </div>
      ${tiersHtml || "<p>No sponsors to display.</p>"}`;

    return `
      <section class="hero">
        <h1>${escapeHtml(sponsorship?.headline ?? "Sponsorship")}</h1>
        ${sponsorship?.lead ? `<p class="hero-lead">${escapeHtml(sponsorship.lead)}</p>` : ""}
      </section>
      ${wrapDocLayout(renderDocToc(tocItems), mainHtml)}`;
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
    const posterWall = media?.posterWall;
    const videosHeading = media?.videosHeading ?? "Videos";
    const hasPosters = (posterWall?.posters ?? []).length > 0;
    const tocItems = [];
    if (videos.length) tocItems.push({ id: "videos", label: videosHeading });
    if (hasPosters) {
      tocItems.push({
        id: "posters",
        label: posterWall.tocLabel ?? posterWall.title ?? "Past fliers",
      });
    }

    const byYear = new Map();
    for (const video of videos) {
      const year = String(video.year ?? "Videos");
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year).push(video);
    }
    const years = [...byYear.keys()].sort((a, b) => String(b).localeCompare(String(a)));
    const yearBlocks = years
      .map((year) => {
        const cards = byYear.get(year).map(renderMediaVideoCard).join("");
        return `
      <div class="media-year-section" aria-labelledby="media-year-${escapeHtml(year)}">
        <h3 class="media-year-heading" id="media-year-${escapeHtml(year)}">${escapeHtml(year)}</h3>
        <div class="video-grid">${cards}</div>
      </div>`;
      })
      .join("");

    const videosHtml = videos.length
      ? `
      <section class="content-section site-doc-section" id="videos" data-doc-section>
        <h2>${escapeHtml(videosHeading)}</h2>
        ${yearBlocks}
      </section>`
      : "";

    const postersHtml = hasPosters ? renderPosterWall(posterWall) : "";
    const contact = media?.contactNote
      ? `<p class="muted media-contact-note">${escapeHtml(media.contactNote)}</p>`
      : "";
    const empty =
      !videos.length && !hasPosters
        ? `<p class="muted">Media coming soon.</p>`
        : "";
    const mainHtml = `${videosHtml}${postersHtml}${empty}${contact}`;

    return `
      <section class="hero">
        <h1>${escapeHtml(media?.headline ?? "Media")}</h1>
        ${media?.lead ? `<p class="hero-lead">${escapeHtml(media.lead)}</p>` : ""}
      </section>
      ${tocItems.length ? wrapDocLayout(renderDocToc(tocItems), mainHtml) : `<div class="media-page-body">${mainHtml}</div>`}`;
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

  function rosterInitials(name) {
    return String(name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  function instagramEmbedSrc(url) {
    const match = String(url ?? "").match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
    if (!match) return null;
    return `https://www.instagram.com/reel/${match[1]}/embed`;
  }

  function rosterVisionFullHtml(visionFull) {
    if (!visionFull) return "";
    if (Array.isArray(visionFull)) {
      return visionFull
        .map((section) => {
          if (typeof section === "string") {
            return `<p>${escapeHtml(section)}</p>`;
          }
          const heading = section?.heading
            ? `<h3 class="roster-vision-modal-heading">${escapeHtml(section.heading)}</h3>`
            : "";
          const paragraphs = (section?.paragraphs ?? [])
            .map((p) => `<p>${escapeHtml(p)}</p>`)
            .join("");
          return `<section class="roster-vision-modal-section">${heading}${paragraphs}</section>`;
        })
        .join("");
    }
    return String(visionFull)
      .split(/\n\n+/)
      .filter((p) => p.trim())
      .map((p) => `<p>${escapeHtml(p.trim())}</p>`)
      .join("");
  }

  function renderRosterMemberCard(m) {
    const photo = m.photo;
    const img = photo
      ? `<img class="roster-photo" src="${escapeHtml(photo)}" alt="" width="88" height="88" loading="lazy" />`
      : `<span class="roster-photo roster-photo--placeholder" aria-hidden="true">${escapeHtml(rosterInitials(m.name))}</span>`;
    const embedSrc = m.instagramUrl ? instagramEmbedSrc(m.instagramUrl) : null;
    const avatar =
      embedSrc && photo
        ? `<button
            type="button"
            class="roster-photo-btn"
            data-instagram-embed="${escapeHtml(embedSrc)}"
            data-instagram-url="${escapeHtml(m.instagramUrl)}"
            aria-label="Play Instagram reel: ${escapeHtml(m.name)}"
          >
            ${img}
            <span class="roster-play-icon" aria-hidden="true"></span>
          </button>`
        : img;
    const hasFull = m.visionFull != null && (Array.isArray(m.visionFull) ? m.visionFull.length : String(m.visionFull).trim());
    const readMore = hasFull
      ? `<button type="button" class="roster-vision-more" data-roster-vision="${escapeHtml(m.name)}" aria-haspopup="dialog">Read more</button>`
      : "";
    const vision =
      m.vision != null && String(m.vision).trim()
        ? `<p class="roster-vision">${escapeHtml(m.vision)}${readMore ? ` ${readMore}` : ""}</p>`
        : "";
    const fullPayload = hasFull
        ? `<template class="roster-vision-full" data-roster-vision="${escapeHtml(m.name)}">${rosterVisionFullHtml(m.visionFull)}</template>`
      : "";
    const handle = String(m.instagram ?? "")
      .trim()
      .replace(/^@/, "");
    const ig =
      handle
        ? `<a
            class="roster-ig"
            href="https://www.instagram.com/${escapeHtml(handle)}/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${escapeHtml(m.name)} on Instagram (@${escapeHtml(handle)})"
          >${renderSocialIcon("Instagram")}</a>`
        : "";
    return `
    <div class="roster-card">
      ${avatar}
      <div class="roster-card-text">
        <div class="roster-name-row">
          <p class="co-chair-name">${escapeHtml(m.name)}</p>
          ${ig}
        </div>
        <p class="co-chair-title">${escapeHtml(m.title)}</p>
        ${vision}
        ${fullPayload}
      </div>
    </div>`;
  }

  function ensureRosterReelModal() {
    let dialog = document.getElementById("roster-reel-modal");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "roster-reel-modal";
    dialog.className = "roster-reel-modal";
    dialog.innerHTML = `
      <div class="roster-reel-inner">
        <form method="dialog" class="roster-reel-toolbar">
          <a class="roster-reel-open" href="#" target="_blank" rel="noopener noreferrer">Open on Instagram</a>
          <button type="submit" class="roster-reel-close" aria-label="Close">&times;</button>
        </form>
        <div class="roster-reel-frame">
          <iframe title="Instagram reel" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>
        </div>
      </div>`;
    document.body.appendChild(dialog);

    dialog.addEventListener("close", () => {
      const iframe = dialog.querySelector("iframe");
      if (iframe) iframe.removeAttribute("src");
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });

    return dialog;
  }

  function ensureRosterVisionModal() {
    let dialog = document.getElementById("roster-vision-modal");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "roster-vision-modal";
    dialog.className = "roster-vision-modal";
    dialog.innerHTML = `
      <div class="roster-vision-modal-inner">
        <form method="dialog" class="roster-vision-modal-toolbar">
          <h2 class="roster-vision-modal-title"></h2>
          <button type="submit" class="roster-vision-modal-close" aria-label="Close">&times;</button>
        </form>
        <div class="roster-vision-modal-body"></div>
      </div>`;
    document.body.appendChild(dialog);

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });

    return dialog;
  }

  function initRosterMedia(root = document) {
    const dialog = ensureRosterReelModal();
    const iframe = dialog.querySelector("iframe");
    const openLink = dialog.querySelector(".roster-reel-open");

    root.querySelectorAll(".roster-photo-btn[data-instagram-embed]").forEach((button) => {
      if (button.dataset.rosterBound === "1") return;
      button.dataset.rosterBound = "1";
      button.addEventListener("click", () => {
        const embed = button.getAttribute("data-instagram-embed");
        const url = button.getAttribute("data-instagram-url") || embed;
        if (!embed || !iframe) return;
        iframe.src = embed;
        if (openLink) openLink.href = url;
        dialog.showModal();
      });
    });

    const visionDialog = ensureRosterVisionModal();
    const visionTitle = visionDialog.querySelector(".roster-vision-modal-title");
    const visionBody = visionDialog.querySelector(".roster-vision-modal-body");

    root.querySelectorAll(".roster-vision-more[data-roster-vision]").forEach((button) => {
      if (button.dataset.rosterVisionBound === "1") return;
      button.dataset.rosterVisionBound = "1";
      button.addEventListener("click", () => {
        const key = button.getAttribute("data-roster-vision");
        const template = Array.from(root.querySelectorAll(".roster-vision-full")).find(
          (el) => el.getAttribute("data-roster-vision") === key,
        );
        if (!template || !visionBody || !visionTitle) return;
        const card = button.closest(".roster-card");
        const name = card?.querySelector(".co-chair-name")?.textContent?.trim() || key;
        const role = card?.querySelector(".co-chair-title")?.textContent?.trim();
        visionTitle.textContent = role ? `${name} — ${role}` : name;
        visionBody.innerHTML = template.innerHTML;
        visionDialog.showModal();
      });
    });
  }

  function renderRosterSection(site) {
    const roster = site.teamPage?.roster;
    if (!roster) return "";

    const groups = roster.groups?.length
      ? roster.groups
      : roster.members?.length
        ? [{ title: null, members: roster.members }]
        : [];
    if (!groups.length) return "";

    return groups
      .map((group) => {
        const id = group.title ? slugifyHeading(group.title) : "roster";
        const heading = group.title
          ? `<h2>${escapeHtml(group.title)}</h2>`
          : `<h2>${escapeHtml(roster.title ?? "Roster")}</h2>`;
        const cards = (group.members ?? []).map(renderRosterMemberCard).join("");
        return `
          <section class="content-section site-doc-section" id="${escapeHtml(id)}" data-doc-section>
            ${heading}
            <div class="co-chairs roster-grid">${cards}</div>
          </section>`;
      })
      .join("");
  }

  function renderRosterPage(site) {
    const toc = buildRosterToc(site);
    const mainHtml = renderRosterSection(site);
    if (!toc.length) return mainHtml;
    return wrapDocLayout(renderDocToc(toc), mainHtml);
  }

  function renderJoinSection(site, { hideRolesCta = false } = {}) {
    const join = site.teamPage?.join;
    if (!join) return "";
    const apply = site.apply;
    const contactEmail = apply?.email ?? "contact@eglny.com";
    const idealist = site.meta?.idealistUrl;
    const idealistLabel = site.meta?.idealistCtaLabel ?? "Apply on Idealist";
    const zoomHtml = join.zoom ? `<li>${escapeHtml(join.zoom)}</li>` : "";
    const discordHtml = join.discordHref
      ? `<li><a href="${escapeHtml(join.discordHref)}"${externalLinkAttrs(join.discordHref)}>${escapeHtml(join.discordLabel ?? "Join the Discord")}</a>${join.discordNote ? ` — ${escapeHtml(join.discordNote)}` : ""}</li>`
      : "";
    const applyHtml = join.applyNote ? `<li>${escapeHtml(join.applyNote)}</li>` : "";
    const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(apply?.emailSubject ?? "LNY 2027 team interest")}`;
    const idealistBtn = idealist
      ? `<a class="btn btn-primary" href="${escapeHtml(idealist)}" target="_blank" rel="noopener">${escapeHtml(idealistLabel)}</a>`
      : "";
    return `
          <section class="content-section site-doc-section" id="get-involved" data-doc-section>
            <h2>${escapeHtml(join.title ?? "Get involved")}</h2>
            ${join.intro ? `<p>${escapeHtml(join.intro)}</p>` : ""}
            <ul>
              ${zoomHtml}
              ${discordHtml}
              ${applyHtml}
            </ul>
            <div class="cta-row">
              ${idealistBtn}
              ${
                !hideRolesCta && join.rolesHref
                  ? `<a class="btn btn-secondary" href="${escapeHtml(join.rolesHref)}">${escapeHtml(join.rolesCtaLabel ?? "Browse open seats")}</a>`
                  : ""
              }
              ${
                join.skillsHref && (site.teamPage?.skillsProjects?.projects?.length ?? 0) > 0
                  ? `<a class="btn btn-secondary" href="${escapeHtml(join.skillsHref)}">${escapeHtml(join.skillsCtaLabel ?? "Browse small projects")}</a>`
                  : ""
              }
              <a class="btn btn-tertiary" href="${mailto}">Email ${escapeHtml(contactEmail)}</a>
            </div>
          </section>`;
  }

  function renderFaqBlock(site) {
    return (site.faq ?? [])
      .map(
        (f) => `
          <div class="faq-item">
            <h3>${escapeHtml(f.q)}</h3>
            <p>${escapeHtml(f.a)}</p>
          </div>`,
      )
      .join("");
  }

  function renderApplySection(site) {
    const join = site.teamPage?.join ?? {};
    const apply = site.apply ?? {};
    const contactEmail = apply.email ?? "contact@eglny.com";
    const mailtoGuest = `mailto:${contactEmail}?subject=${encodeURIComponent("LNY 2027 Zoom guest")}`;

    const discordBtn = join.discordHref
      ? `<p class="cta-row"><a class="btn btn-tertiary" href="${escapeHtml(join.discordHref)}"${externalLinkAttrs(join.discordHref)}>${escapeHtml(join.discordLabel ?? "Join the Discord")}</a></p>`
      : "";

    return `
          <section class="content-section site-doc-section" id="apply" data-doc-section>
            <h2>Apply &amp; get involved</h2>
            <h3>Apply to an open role</h3>
            <p>${escapeHtml(join.applyNote ?? "Apply on Idealist — name the role or vision you’re interested in.")}</p>
            ${renderApplyBlock(site)}
            <h3>Attend Zoom calls</h3>
            <p>${escapeHtml(join.zoom ?? "Weekly Zoom production calls are Mondays at 6:30 PM.")}</p>
            <p class="cta-row"><a class="btn btn-tertiary" href="${mailtoGuest}">Email ${escapeHtml(contactEmail)}</a></p>
            <h3>Join Discord</h3>
            ${join.discordNote ? `<p>${escapeHtml(join.discordNote)}</p>` : ""}
            ${discordBtn}
          </section>`;
  }

  function renderJoinPage(site) {
    const mainHtml = `
          ${renderJoinSection(site)}
          <section class="content-section site-doc-section" id="faq" data-doc-section>
            <h2>FAQ</h2>
            ${renderFaqBlock(site)}
          </section>`;

    return wrapDocLayout(renderDocToc(buildJoinToc(site)), mainHtml);
  }

  /** @deprecated Prefer renderJoinPage — kept for any stale callers */
  function renderTeamPage(site) {
    return renderJoinPage(site);
  }

  function renderOpenRolesPage(site) {
    const intro = site.directorIntro;

    const lanesHtml = (site.lanes ?? []).map(renderLaneSection).join("");

    const unlock = site.phase2;
    const unlockHtml = unlock
      ? `
          <section class="content-section site-doc-section" id="sponsor-unlocks" data-doc-section>
            <h2>${escapeHtml(unlock.title ?? "Sponsor unlocks")}</h2>
            <p>${escapeHtml(unlock.intro)}</p>
            <ul>${unlock.roles.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
            <p class="cta-row"><a class="btn btn-tertiary" href="${escapeHtml(unlock.registryHref)}">See the registry</a></p>
          </section>`
      : "";

    const mainHtml = `
          <section class="content-section site-doc-section" id="what-is-a-director" data-doc-section>
            <h2>${escapeHtml(intro.title)}</h2>
            ${linkFirstFundTheFestival(
              intro.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join(""),
            )}
            <ul>${intro.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>
          </section>
          ${renderApplySection(site)}
          <section class="content-section site-doc-section" id="faq" data-doc-section>
            <h2>FAQ</h2>
            ${renderFaqBlock(site)}
          </section>
          ${lanesHtml}
          ${unlockHtml}`;

    return wrapDocLayout(renderDocToc(buildOpenRolesToc(site)), mainHtml);
  }

  /** @deprecated Prefer renderOpenRolesPage */
  function renderDirectorRolesPage(site) {
    return renderOpenRolesPage(site);
  }

  function formatBriefProse(text) {
    return escapeHtml(text ?? "")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  }

  function renderBriefTable(table) {
    if (!table?.headers?.length) return "";
    const head = table.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
    const body = (table.rows ?? [])
      .map((row) => `<tr>${row.map((cell) => `<td>${formatBriefProse(cell)}</td>`).join("")}</tr>`)
      .join("");
    return `<div class="site-doc-table-wrap"><table class="site-doc-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function renderBriefOrderedItems(items) {
    if (!items?.length) return "";
    return `<ol class="brief-ordered">${items
      .map((item) => {
        if (typeof item === "string") return `<li>${formatBriefProse(item)}</li>`;
        const label = item.label ? `<strong>${escapeHtml(item.label)}.</strong> ` : "";
        return `<li>${label}${formatBriefProse(item.text ?? "")}</li>`;
      })
      .join("")}</ol>`;
  }

  function renderBriefBullets(bullets) {
    if (!bullets?.length) return "";
    return `<ul>${bullets.map((b) => `<li>${formatBriefProse(typeof b === "string" ? b : b.text ?? "")}</li>`).join("")}</ul>`;
  }

  function renderVendorRfpSection(section) {
    const paragraphs = (section.paragraphs ?? []).map((p) => `<p>${formatBriefProse(p)}</p>`).join("");
    return `
      <section class="content-section site-doc-section" id="${escapeHtml(section.id)}" data-doc-section>
        <h2>${escapeHtml(section.title)}</h2>
        ${paragraphs}
        ${renderBriefTable(section.table)}
        ${renderBriefOrderedItems(section.orderedItems)}
        ${renderBriefBullets(section.bullets)}
      </section>`;
  }

  function renderVendorRfpContact(contact) {
    if (!contact) return "";
    const email = contact.email ?? "contact@cpalss.com";
    const subject = contact.emailSubject ?? "cPALSs vendor RFP";
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    const label = contact.buttonLabel ?? "Email your proposal";
    return `
      <section class="content-section site-doc-section" id="${escapeHtml(contact.id ?? "contact")}" data-doc-section>
        <h2>${escapeHtml(contact.title ?? "Submit a proposal")}</h2>
        ${contact.intro ? `<p>${formatBriefProse(contact.intro)}</p>` : ""}
        <p><a class="btn btn-primary" href="${escapeHtml(mailto)}">${escapeHtml(label)}</a></p>
        <p class="muted"><a href="${escapeHtml(mailto)}">${escapeHtml(email)}</a></p>
      </section>`;
  }


  async function loadSkuCatalog() {
    const prefix = navPrefix();
    const res = await fetch(`${prefix}${SKU_CATALOG_URL}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load SKU catalog (${res.status})`);
    return res.json();
  }

  function formatProse(text) {
    return formatBriefProse(text);
  }

  function zoneStandardSpaceCount(zone) {
    return zone.standardSpaceCount ?? zone.boothPadCapacity ?? 0;
  }

  function formatStandardSpaces(count) {
    if (count === 1) return "1 adjacent spot (10×10)";
    return `${count} adjacent spots (10×10 each)`;
  }

  function zoneOpenCookingCap(zone) {
    return zone.openCookingSpotCap ?? 0;
  }

  function zoneZonesRemaining(zone) {
    const remaining = zone.inventory?.zonesRemaining;
    return remaining === undefined || remaining === null ? null : Number(remaining);
  }

  function formatZoneRemainingShort(zone) {
    const remaining = zoneZonesRemaining(zone);
    if (remaining === null) return "";
    if (remaining <= 0) return "Sold out";
    return `${remaining} left`;
  }

  function formatZoneFoodLine(zone) {
    const openCook = zoneOpenCookingCap(zone);
    if (openCook === 0) return "No open-cooking spots. Any spot can sell prepacked food.";
    if (openCook === 1) return "Up to 1 open-cooking spot 🍳. Any spot can sell prepacked food.";
    return `Up to ${openCook} open-cooking spots 🍳. Any spot can sell prepacked food.`;
  }

  function sortZonesBySize(zones) {
    const order = { Small: 0, Medium: 1, Large: 2 };
    return [...zones].sort((a, b) => (order[a.sizeLabel] ?? 99) - (order[b.sizeLabel] ?? 99));
  }

  function formatUsd(amount) {
    return Number(amount).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  function vendorBoothFeeStandard(catalog, applyQuestionValue) {
    const vendor = (catalog.vendors ?? []).find((v) => v.eventeny?.applyQuestionValue === applyQuestionValue);
    const line = (vendor?.eventeny?.lineItems ?? []).find(
      (item) => item.role === "booth_fee" && item.tier === "standard",
    );
    return line?.amount ?? null;
  }

  function zoneByoStartingPrices(catalog, zone) {
    const count = zoneStandardSpaceCount(zone);
    const generalPerSpace = vendorBoothFeeStandard(catalog, "merchant_craft_goods");
    const nonprofitPerSpace = vendorBoothFeeStandard(catalog, "nonprofit");
    if (!count || generalPerSpace == null || nonprofitPerSpace == null) return null;
    return {
      nonprofit: nonprofitPerSpace * count,
      general: generalPerSpace * count,
    };
  }

  function renderZoneByoPrice(zone, catalog) {
    const prices = zoneByoStartingPrices(catalog, zone);
    if (!prices) return "";
    return `
      <div class="zone-tier-price">
        <p class="zone-tier-price-main">
          <span class="zone-tier-price-label">Starting at</span>
          <span class="zone-tier-price-amount">${escapeHtml(formatUsd(prices.general))}</span>
        </p>
        <p class="zone-tier-price-detail muted">${escapeHtml(formatUsd(prices.nonprofit))} nonprofit</p>
      </div>`;
  }

  function renderZoneDiagramSvg(zone, plazaHint, options = {}) {
    const count = zoneStandardSpaceCount(zone);
    const openCook = zoneOpenCookingCap(zone);
    const hint = plazaHint ?? "Tables, chairs, decor allowed";
    const tierLayout = options.layout === "tier";

    let spotSize;
    let gap;
    let padX;
    let spotY;
    let plazaY;
    let plazaH;
    let svgW;
    let svgH;
    let rowWidth;
    let spotsX;
    let plazaW;
    let plazaX;

    if (tierLayout) {
      svgW = 320;
      padX = 20;
      gap = 8;
      spotY = 14;
      plazaH = 52;
      plazaY = 66;
      svgH = plazaY + plazaH + 8;
      const usableW = svgW - padX * 2;
      spotSize = Math.min(40, Math.floor((usableW - (count - 1) * gap) / count));
      rowWidth = count * spotSize + (count - 1) * gap;
      spotsX = (svgW - rowWidth) / 2;
      plazaW = Math.min(rowWidth + 24, svgW - padX);
      plazaX = (svgW - plazaW) / 2;
    } else {
      spotSize = count > 6 ? 36 : 44;
      gap = count > 6 ? 8 : 10;
      rowWidth = count * spotSize + (count - 1) * gap;
      padX = 20;
      spotY = 20;
      plazaY = spotY + spotSize + 14;
      plazaH = 56;
      svgW = Math.max(rowWidth + padX * 2, 260);
      svgH = plazaY + plazaH + 8;
      plazaW = rowWidth + 24;
      plazaX = (svgW - plazaW) / 2;
      spotsX = (svgW - rowWidth) / 2;
    }

    const spotLabelSize = spotSize <= 32 ? 8 : spotSize <= 36 ? 9 : 10;
    const flameSize = spotSize <= 32 ? 11 : spotSize <= 36 ? 12 : 14;
    const spots = Array.from({ length: count }, (_, i) => {
      const x = spotsX + i * (spotSize + gap);
      const cx = x + spotSize / 2;
      const cy = spotY + spotSize / 2 + (spotLabelSize <= 8 ? 2.5 : 3.5);
      const isCooking = i < openCook;
      const spotClass = isCooking ? "zone-diagram-spot zone-diagram-spot--open" : "zone-diagram-spot";
      const label = isCooking
        ? `<text class="zone-diagram-cook-icon" x="${cx}" y="${cy}" text-anchor="middle" font-size="${flameSize}" aria-hidden="true">🍳</text>`
        : `<text class="zone-diagram-spot-label" x="${cx}" y="${cy}" text-anchor="middle" font-size="${spotLabelSize}">10×10</text>`;
      return `<rect class="${spotClass}" x="${x}" y="${spotY}" width="${spotSize}" height="${spotSize}" rx="4"/>${label}`;
    }).join("");

    const svgClass = tierLayout ? "zone-diagram-svg zone-diagram-svg--tier" : "zone-diagram-svg";

    return `
    <svg class="${svgClass}" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeHtml(zone.sizeLabel)} zone — ${count} spots above plaza">
      ${spots}
      <rect class="zone-diagram-plaza" x="${plazaX}" y="${plazaY}" width="${plazaW}" height="${plazaH}" rx="6"/>
      <text class="zone-diagram-plaza-label" x="${svgW / 2}" y="${plazaY + 22}" text-anchor="middle">Plaza</text>
      <text class="zone-diagram-plaza-hint" x="${svgW / 2}" y="${plazaY + 40}" text-anchor="middle">${escapeHtml(hint)}</text>
    </svg>`;
  }

  function renderZoneTierCard(zone, diy, catalog) {
    const count = zoneStandardSpaceCount(zone);
    const remaining = formatZoneRemainingShort(zone);
    const soldOut = zoneZonesRemaining(zone) !== null && zoneZonesRemaining(zone) <= 0;
    const badge = remaining
      ? `<span class="zone-availability-badge${soldOut ? " zone-availability-badge--sold-out" : ""}">${escapeHtml(remaining)}</span>`
      : "";

    return `
    <article class="zone-tier-card">
      <header class="zone-tier-header">
        <div class="zone-tier-header-main">
          <h3 class="zone-tier-name">${escapeHtml(zone.sizeLabel)}</h3>
          <p class="zone-tier-audience">${escapeHtml(zone.guestCapacityGuide ?? "")}</p>
        </div>
        ${badge}
      </header>
      <div class="zone-tier-diagram">${renderZoneDiagramSvg(zone, diy?.plazaHint, { layout: "tier" })}</div>
      ${renderZoneByoPrice(zone, catalog)}
      <dl class="zone-tier-stats">
        <div><dt>Spots</dt><dd>${escapeHtml(formatStandardSpaces(count))}</dd></div>
        <div><dt>Food</dt><dd>${escapeHtml(formatZoneFoodLine(zone))}</dd></div>
      </dl>
    </article>`;
  }

  function renderZonePricingTiers(zones, diy, catalog) {
    const sorted = sortZonesBySize(zones);
    const cards = sorted.map((zone) => renderZoneTierCard(zone, diy, catalog)).join("");
    return `<div class="zone-pricing-grid" role="list">${cards}</div>`;
  }

  function renderDiySection(diy, catalog) {
    if (!diy) return "";
    const zones = catalog.zoneBaselines ?? [];
    const sectionId = diy.id ?? "decorate-yourself";
    return `
    <section id="${escapeHtml(sectionId)}" class="host-doc-section host-diy-section" data-host-section data-path="diy">
      <h2>${escapeHtml(diy.title ?? "Decorate it yourself")}</h2>
      <p class="host-diy-lead">${escapeHtml(diy.intro ?? "")}</p>
      ${renderZonePricingTiers(zones, diy, catalog)}
      ${diy.inventoryNote ? `<p class="muted host-diy-inventory-note">${escapeHtml(diy.inventoryNote)}</p>` : ""}
    </section>`;
  }

  function renderAddonCategorySlide(cat, addons, index, defaultIndex) {
    const items = addons.filter((a) => a.category === cat.id);
    const list = items
      .map(
        (addon) => `
        <li class="host-addon-item">
          <p class="host-addon-name">${escapeHtml(addon.name)}</p>
          <p class="muted host-addon-desc">${escapeHtml(addon.publicDescription)}</p>
        </li>`,
      )
      .join("");

    return `
    <article class="zone-carousel-slide help-addon-slide${index === defaultIndex ? " is-active" : ""}" data-slide="${index}" aria-hidden="${index === defaultIndex ? "false" : "true"}">
      ${cat.description ? `<p class="muted help-addon-slide-desc">${formatProse(cat.description)}</p>` : ""}
      <ul class="host-addon-list host-addon-list--cols">${list}</ul>
    </article>`;
  }

  function renderAddonCard(addons, categories) {
    const cats = (categories ?? []).filter((cat) => addons.some((a) => a.category === cat.id));
    if (!cats.length) return "";
    const activeIndex = 0;
    const tabs = cats
      .map(
        (cat, i) =>
          `<button type="button" class="zone-size-tab help-addon-tab${i === activeIndex ? " is-active" : ""}" role="tab" aria-selected="${i === activeIndex ? "true" : "false"}" data-slide-to="${i}">${escapeHtml(cat.label)}</button>`,
      )
      .join("");
    const slides = cats.map((cat, i) => renderAddonCategorySlide(cat, addons, i, activeIndex)).join("");

    return `
    <div class="zone-size-card help-addon-card" data-addon-carousel data-default-slide="${activeIndex}">
      <header class="zone-size-card-header help-addon-card-header">
        <div class="help-addon-tabs" role="tablist" aria-label="Add-on categories">${tabs}</div>
      </header>
      <div class="zone-size-card-body">
        <div class="zone-carousel-track">${slides}</div>
      </div>
    </div>`;
  }

  function renderHelpSection(helpSection, ha, catalog) {
    if (!helpSection) return "";
    const sectionId = helpSection.id ?? "bring-to-life";
    const addons = catalog.addons ?? [];
    const categories = ha.addonCategories ?? [];
    return `
    <section id="${escapeHtml(sectionId)}" class="host-doc-section host-help-section" data-host-section data-path="help">
      <h2>${escapeHtml(helpSection.title ?? "Help me bring it to life")}</h2>
      <p class="host-help-lead">${escapeHtml(helpSection.intro ?? "")}</p>
      ${renderAddonCard(addons, categories)}
      ${helpSection.note ? `<p class="muted host-help-note">${escapeHtml(helpSection.note)}</p>` : ""}
    </section>`;
  }

  function renderHostStoryCard(study) {
    const you = (study.tenantBrings ?? []).slice(0, 3).join(" · ");
    const us = (study.platformProvides ?? []).slice(0, 2).join(" · ");
    const modeAttr = study.mode ? ` data-mode="${escapeHtml(study.mode)}"` : "";
    return `
    <article class="host-story-card"${modeAttr}>
      <div class="host-story-body">
        <p class="host-story-path">${escapeHtml(study.pathLabel ?? study.title)}</p>
        <h3>${escapeHtml(study.title)}</h3>
        <p>${escapeHtml(study.summary)}</p>
        <p class="host-story-meta"><span>You bring</span> ${escapeHtml(you)}</p>
        <p class="host-story-meta"><span>We provide</span> ${escapeHtml(us)}</p>
      </div>
    </article>`;
  }

  function renderHostPrompts(prompts) {
    const diy = prompts.diy;
    const help = prompts.help;
    const vendor = prompts.vendor;
    const vendorHref = vendor?.href ?? "/vendors/";
    return `
    <div class="host-prompt-row">
      <button type="button" class="btn btn-secondary" data-host-prompt="diy">${escapeHtml(diy.label)}</button>
      <button type="button" class="btn btn-secondary" data-host-prompt="help">${escapeHtml(help.label)}</button>
      <a class="host-prompt-vendor" href="${escapeHtml(vendorHref)}">${escapeHtml(vendor.label)}</a>
    </div>`;
  }

  function renderHostToc(tocItems) {
    const links = (tocItems ?? [])
      .map(
        (item) =>
          `<a class="host-doc-toc-link" href="#${escapeHtml(item.id)}" data-toc-target="${escapeHtml(item.id)}">${escapeHtml(item.label)}</a>`,
      )
      .join("");
    return `<nav class="host-doc-toc" aria-label="On this page"><p class="host-doc-toc-label">On this page</p>${links}</nav>`;
  }

  function renderHostApplyBlock(hostApply, prominent) {
    const formUrl = hostApply.formUrl ?? "";
    const formLabel = hostApply.formLabel ?? "Fill out the inquiry form";
    const mailto = hostApply.email
      ? `mailto:${hostApply.email}?subject=${encodeURIComponent(hostApply.emailSubject ?? "LNY 2027 — custom zone inquiry")}`
      : "";
    const primary = mailto
      ? `<a class="btn btn-primary" id="host-contact-email" href="${mailto}">Email ${escapeHtml(hostApply.email)}</a>`
      : formUrl
        ? `<a class="btn btn-primary" id="host-contact-form" href="${escapeHtml(formUrl)}">${escapeHtml(formLabel)}</a>`
        : "";
    const secondary =
      mailto && formUrl
        ? `<a class="btn btn-secondary" id="host-contact-form" href="${escapeHtml(formUrl)}">${escapeHtml(formLabel)}</a>`
        : "";
    return `
    <div class="apply-block${prominent ? " apply-block--prominent" : ""}">
      <p>${escapeHtml(hostApply.intro ?? "")}</p>
      <div class="cta-row">
        ${primary}
        ${secondary}
      </div>
      ${hostApply.detailNote
        ? `<p class="muted">${escapeHtml(hostApply.detailNote).replace(
            /scoped RFPs/,
            '<a href="/rfp/">scoped RFPs</a>',
          )}</p>`
        : ""}
      ${hostApply.vendorNote
        ? `<p class="muted">${escapeHtml(hostApply.vendorNote).replace(
            /Vendor booths/,
            '<a href="/vendors/">Vendor booths</a>',
          )}</p>`
        : ""}
      ${hostApply.responseNote ? `<p class="muted">${escapeHtml(hostApply.responseNote)}</p>` : ""}
    </div>`;
  }

  function initZoneCarousel() {
    document.querySelectorAll("[data-addon-carousel]").forEach((root) => {
      const slides = [...root.querySelectorAll(".zone-carousel-slide")];
      const tabs = [...root.querySelectorAll(".zone-size-tab")];
      if (!slides.length) return;

      let index = Number(root.getAttribute("data-default-slide"));
      if (Number.isNaN(index) || index < 0) {
        index = slides.findIndex((slide) => slide.classList.contains("is-active"));
      }
      if (index < 0) index = 0;

      function setSlide(nextIndex) {
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach((slide, i) => {
          const active = i === index;
          slide.classList.toggle("is-active", active);
          slide.setAttribute("aria-hidden", active ? "false" : "true");
        });
        tabs.forEach((tab, i) => {
          tab.classList.toggle("is-active", i === index);
          tab.setAttribute("aria-selected", i === index ? "true" : "false");
        });
      }

      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const to = Number(tab.getAttribute("data-slide-to"));
          if (!Number.isNaN(to)) setSlide(to);
        });
      });
      setSlide(index);
    });
  }

  function initHostPageToc(hostApply, prompts) {
    const { navigateToSection } = window.DocScroll.init();

    function updateMailto(mode) {
      const emailLink = document.getElementById("host-contact-email");
      if (!emailLink || !hostApply?.email) return;
      const subject =
        mode === "diy"
          ? prompts?.diy?.mailtoSubject
          : mode === "help"
            ? prompts?.help?.mailtoSubject
            : hostApply.emailSubject;
      if (subject) {
        emailLink.href = `mailto:${hostApply.email}?subject=${encodeURIComponent(subject)}`;
      }
    }

    function highlightStories(mode) {
      document.querySelectorAll(".host-story-card").forEach((card) => {
        const cardMode = card.getAttribute("data-mode");
        card.classList.toggle("is-dimmed", mode && cardMode && cardMode !== mode);
        card.classList.toggle("is-highlighted", mode && cardMode === mode);
      });
    }

    document.querySelectorAll("[data-host-prompt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const prompt = btn.getAttribute("data-host-prompt");
        highlightStories(null);
        updateMailto(prompt);
        const scrollTarget =
          prompt === "diy"
            ? prompts?.diy?.scrollTo ?? "decorate-yourself"
            : prompt === "help"
              ? prompts?.help?.scrollTo ?? "bring-to-life"
              : "examples";
        navigateToSection(scrollTarget, "smooth");
      });
    });

    const hash = window.location.hash.replace("#", "");
    if (hash === "diy" || hash === "decorate-yourself") updateMailto("diy");
    else if (hash === "help" || hash === "bring-to-life") updateMailto("help");
  }

  function renderHostActivations(site, catalog) {
    const ha = site.hostActivations;
    if (!ha) return `<p class="error-panel">Custom Zones content not configured.</p>`;

    const featuredIds = new Set(ha.featuredStoryIds ?? []);
    const featuredStories = (ha.caseStudies ?? []).filter((s) => featuredIds.has(s.id));
    const featuredHtml = featuredStories.map((s) => renderHostStoryCard(s)).join("");
    const faqHtml = (ha.faq ?? [])
      .map((f) => {
        const paragraphs = String(f.a ?? "")
          .split(/\n\n+/)
          .filter(Boolean)
          .map((p) => `<p>${formatProse(p)}</p>`)
          .join("");
        return `<div class="faq-item"><h3>${escapeHtml(f.q)}</h3>${paragraphs}</div>`;
      })
      .join("");

    const heroTitle = ha.hero?.displayTitle ?? "Custom Zones";
    const heroTag = ha.hero?.tagline
      ? `<p class="hero-lead">${escapeHtml(ha.hero.tagline)}</p>`
      : "";

    return `
    <section class="hero">
      <h1>${escapeHtml(heroTitle)}</h1>
      ${heroTag}
    </section>

    <section class="host-prompts-section">
      ${renderHostPrompts(ha.prompts ?? {})}
    </section>

    <div class="host-doc-layout">
      ${renderHostToc(ha.toc)}
      <div class="host-doc-main">
        <section id="examples" class="host-doc-section" data-host-section>
          <h2>${escapeHtml(ha.storiesSection?.title ?? "Examples")}</h2>
          <p class="muted">${escapeHtml(ha.storiesSection?.intro ?? "")}</p>
          <div class="host-story-grid">${featuredHtml}</div>
        </section>

        ${renderDiySection(ha.diySection, catalog)}
        ${renderHelpSection(ha.helpSection, ha, catalog)}

        <section id="contact" class="host-doc-section" data-host-section>
          <h2>${escapeHtml(ha.apply?.title ?? "Email us to start")}</h2>
          ${renderHostApplyBlock(ha.apply, true)}
        </section>

        <section id="faq" class="host-doc-section" data-host-section>
          <h2>FAQ</h2>
          ${faqHtml}
        </section>
      </div>
    </div>`;
  }

  function renderVendorRfpPage(rfp) {
    const sections = rfp?.sections ?? [];
    const contact = rfp?.contact;
    const toc = sections.map((section) => ({
      id: section.id,
      label: section.tocLabel || section.title,
    }));
    if (contact) {
      toc.push({
        id: contact.id ?? "contact",
        label: contact.tocLabel || contact.title || "Contact",
      });
    }
    const related = rfp?.related
      ? `<p class="muted"><strong>${escapeHtml(rfp.related.label ?? "Related")}:</strong> ${formatBriefProse(rfp.related.text ?? "")} ${
          rfp.related.href
            ? `<a href="${escapeHtml(rfp.related.href)}">${escapeHtml(rfp.related.linkLabel ?? "Learn more")}</a>`
            : ""
        }</p>`
      : "";
    const status = rfp?.statusLine ? `<p class="hero-kicker">${escapeHtml(rfp.statusLine)}</p>` : "";
    const main =
      sections.map(renderVendorRfpSection).join("") + renderVendorRfpContact(contact);
    return `
      <section class="hero">
        <p class="hero-back"><a href="/rfp/">← RFPs</a></p>
        <h1>${escapeHtml(rfp?.headline ?? "Vendor RFP")}</h1>
        ${status}
        ${rfp?.lead ? `<p class="hero-lead">${escapeHtml(rfp.lead)}</p>` : ""}
        ${related}
      </section>
      ${wrapDocLayout(
        renderDocToc(toc, { backHref: "/rfp/", backLabel: "← RFPs" }),
        main,
      )}`;
  }

  function renderVendorsBoothsPage(page) {
    const waitlist = page?.waitlist ?? {};
    const inventory = page?.inventory ?? {};
    const criteria = page?.criteria ?? {};
    const timeline = page?.timeline ?? {};
    const hasInventory = Boolean(inventory.title || inventory.table?.rows?.length);
    const hasCriteria = Boolean(
      criteria.title || criteria.deny?.length || criteria.factors?.rows?.length,
    );
    const tocItems = [
      { id: waitlist.id ?? "waitlist", label: waitlist.tocLabel ?? waitlist.title ?? "Waitlist" },
      ...(hasInventory
        ? [{ id: inventory.id ?? "inventory", label: inventory.tocLabel ?? inventory.title ?? "Inventory" }]
        : []),
      { id: timeline.id ?? "timeline", label: timeline.tocLabel ?? timeline.title ?? "Timeline" },
      ...(hasCriteria
        ? [{ id: criteria.id ?? "criteria", label: criteria.tocLabel ?? criteria.title ?? "Criteria" }]
        : []),
    ];

    const roundsHtml = (timeline.rounds ?? [])
      .map(
        (round) => `
      <article class="booth-round-card">
        <h3>${escapeHtml(round.label)}</h3>
        ${round.window ? `<p class="booth-round-window">${escapeHtml(round.window)}</p>` : ""}
        ${round.note ? `<p>${escapeHtml(round.note)}</p>` : ""}
      </article>`,
      )
      .join("");

    const outcomesHtml = (outcomes) =>
      (outcomes ?? [])
        .map(
          (outcome) => `
      <article class="booth-outcome-card booth-outcome-card--${escapeHtml(outcome.id)}" role="listitem">
        <h4>${escapeHtml(outcome.title)}</h4>
        <p>${formatBriefProse(outcome.body)}</p>
        ${outcome.next ? `<p class="muted">${formatBriefProse(outcome.next)}</p>` : ""}
      </article>`,
        )
        .join("");

    const flowHtml = (timeline.steps ?? [])
      .map((step, i) => {
        const nested =
          step.id === "branch" && step.outcomes?.length
            ? `<div class="booth-outcomes" role="list">${outcomesHtml(step.outcomes)}</div>`
            : "";
        return `
      <li class="booth-flow-step${step.id === "branch" ? " booth-flow-step--branch" : ""}">
        <span class="booth-flow-num" aria-hidden="true">${i + 1}</span>
        <div>
          <h3>${escapeHtml(step.title)}</h3>
          ${step.body ? `<p>${formatBriefProse(step.body)}</p>` : ""}
          ${nested}
        </div>
      </li>`;
      })
      .join("");

    const waitlistCta =
      waitlist.cta?.href
        ? `<p class="vendors-waitlist-cta"><a class="btn btn-primary" href="${escapeHtml(waitlist.cta.href)}" target="_blank" rel="noopener">${escapeHtml(waitlist.cta.label ?? "Join the vendor waitlist")}</a></p>${
            waitlist.cta.note
              ? `<p class="muted vendors-waitlist-note">${escapeHtml(waitlist.cta.note)}</p>`
              : ""
          }`
        : "";

    const inventoryHtml = hasInventory
      ? `<section class="content-section site-doc-section" id="${escapeHtml(inventory.id ?? "inventory")}" data-doc-section>
        <h2>${escapeHtml(inventory.title ?? "Booth inventory")}</h2>
        ${inventory.intro ? `<p>${formatBriefProse(inventory.intro)}</p>` : ""}
        ${renderBriefTable(inventory.table)}
        ${renderBriefBullets(inventory.notes)}
        ${inventory.footnote ? `<p class="muted">${escapeHtml(inventory.footnote)}</p>` : ""}
      </section>`
      : "";

    const criteriaHtml = hasCriteria
        ? `<section class="content-section site-doc-section" id="${escapeHtml(criteria.id ?? "criteria")}" data-doc-section>
        <h2>${escapeHtml(criteria.title ?? "Selection criteria")}</h2>
        ${criteria.intro ? `<p>${formatBriefProse(criteria.intro)}</p>` : ""}
        ${
          criteria.factors?.rows?.length
            ? `<h3 class="booth-path-heading">${escapeHtml(criteria.factorsTitle ?? "Food ranking factors")}</h3>
        ${criteria.factorsIntro ? `<p>${formatBriefProse(criteria.factorsIntro)}</p>` : ""}
        ${renderBriefTable(criteria.factors)}
        ${criteria.factorsNote ? `<p class="muted">${formatBriefProse(criteria.factorsNote)}</p>` : ""}`
            : ""
        }
        ${
          criteria.deny?.length
            ? `<h3 class="booth-path-heading">${escapeHtml(criteria.denyTitle ?? "We do not accept")}</h3>
        ${criteria.denyIntro ? `<p>${formatBriefProse(criteria.denyIntro)}</p>` : ""}
        ${renderBriefBullets(criteria.deny)}`
            : ""
        }
        ${
          criteria.sales?.length
            ? `<h3 class="booth-path-heading">${escapeHtml(criteria.salesTitle ?? "Prohibited sales items")}</h3>
        ${criteria.salesIntro ? `<p>${formatBriefProse(criteria.salesIntro)}</p>` : ""}
        ${renderBriefBullets(criteria.sales)}`
            : ""
        }
        ${criteria.footnote ? `<p class="muted">${escapeHtml(criteria.footnote)}</p>` : ""}
      </section>`
        : "";

    const mainHtml = `
      <section class="content-section site-doc-section" id="${escapeHtml(waitlist.id ?? "waitlist")}" data-doc-section>
        <h2>${escapeHtml(waitlist.title ?? "Join the waitlist")}</h2>
        ${waitlist.body ? `<p>${formatBriefProse(waitlist.body)}</p>` : ""}
        ${waitlistCta}
      </section>
      ${inventoryHtml}
      <section class="content-section site-doc-section" id="${escapeHtml(timeline.id ?? "timeline")}" data-doc-section>
        <h2>${escapeHtml(timeline.title ?? "How selection works")}</h2>
        ${timeline.intro ? `<p>${formatBriefProse(timeline.intro)}</p>` : ""}
        <div class="booth-rounds-grid">${roundsHtml}</div>
        <h3 class="booth-path-heading">${escapeHtml(timeline.pathTitle ?? "Your path after you apply")}</h3>
        ${timeline.pathIntro ? `<p>${formatBriefProse(timeline.pathIntro)}</p>` : ""}
        <ul class="booth-flow-list">${flowHtml}</ul>
        ${timeline.footnote ? `<p class="muted">${escapeHtml(timeline.footnote)}</p>` : ""}
      </section>
      ${criteriaHtml}`;

    return `
      <section class="hero">
        <h1>${escapeHtml(page?.headline ?? "Vendor booths")}</h1>
        ${page?.statusLine ? `<p class="hero-kicker">${escapeHtml(page.statusLine)}</p>` : ""}
        ${page?.lead ? `<p class="hero-lead">${escapeHtml(page.lead)}</p>` : ""}
      </section>
      ${wrapDocLayout(renderDocToc(tocItems), mainHtml)}`;
  }

  function renderRfpIndexPage(index) {
    const lots = (index?.lots ?? [])
      .map(
        (lot) => `
      <a class="resource-card" href="${escapeHtml(lot.href)}">
        <h3>${escapeHtml(lot.title)}</h3>
        ${lot.summary ? `<p>${escapeHtml(lot.summary)}</p>` : ""}
      </a>`,
      )
      .join("");
    const tocItems = [{ id: "lots", label: "Open lots" }];
    const mainHtml = `
      <section class="content-section site-doc-section" id="lots" data-doc-section aria-labelledby="lots-heading">
        <h2 id="lots-heading">Open lots</h2>
        <div class="resource-card-grid">${lots}</div>
        ${index?.note ? `<p class="muted">${escapeHtml(index.note)}</p>` : ""}
      </section>`;
    return `
      <section class="hero">
        <h1>${escapeHtml(index?.headline ?? "RFPs")}</h1>
        ${index?.lead ? `<p class="hero-lead">${escapeHtml(index.lead)}</p>` : ""}
      </section>
      ${wrapDocLayout(renderDocToc(tocItems), mainHtml)}`;
  }

  /** @deprecated Prefer renderRfpIndexPage */
  function renderVendorRfpIndexPage(index) {
    return renderRfpIndexPage(index);
  }

  /** @deprecated Hub retired — use renderRfpIndexPage or booths page */
  function renderVendorsPage(index) {
    return renderRfpIndexPage(index);
  }

  async function loadJsonData(relativePath) {
    const res = await fetch(`${navPrefix()}${relativePath}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${relativePath} (${res.status})`);
    return res.json();
  }

  window.EglnySite = {
    SPONSORSHIP_PACKET_PDF_URL,
    revealPage,
    initPageShell,
    loadSiteData,
    loadJsonData,
    mountFooter,
    buildAboutToc,
    renderAboutSections,
    renderPosterWall,
    renderApplyBlock,
    renderCoChairs,
    renderDocToc,
    renderEventSummary,
    renderFestivalHero,
    loadSeasonEvents,
    initMediaPlayers,
    initRosterMedia,
    renderMediaPage,
    renderResourcesPage,
    renderProductionPage,
    renderAttendeesPage,
    renderSponsorshipPage,
    loadSkuCatalog,
    renderHostActivations,
    initHostPageToc,
    initZoneCarousel,
    renderSeasonPage,
    renderRoleCard,
    renderTeamPage,
    renderJoinPage,
    renderRosterPage,
    renderDirectorRolesPage,
    renderOpenRolesPage,
    renderSkillsProjectsPage,
    renderVolunteerPage,
    renderVendorRfpPage,
    renderRfpIndexPage,
    renderVendorsPage,
    renderVendorsBoothsPage,
    renderVendorRfpIndexPage,
    setPageTitle,
    wrapDocLayout,
    initDocToc,
    slugifyHeading,
    escapeHtml,
    linkFirstFundTheFestival,
    linkFirstOpenRoles,
    navPrefix,
  };
})();
