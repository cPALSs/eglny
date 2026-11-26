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

  /** First “Open roles” in already-escaped HTML → Team (roles live there now). */
  function linkFirstOpenRoles(html) {
    return String(html).replace(/Open roles/, '<a href="/team/">Open roles</a>');
  }

  /** First “Team” word in already-escaped HTML → team page link. */
  function linkFirstTeam(html) {
    return String(html).replace(/\bTeam\b/, '<a href="/team/">Team</a>');
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
      light: `<span class="ls-icon ls-icon--sun theme-icon" aria-hidden="true"></span>`,
      dark: `<span class="ls-icon ls-icon--moon theme-icon" aria-hidden="true"></span>`,
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
    document.documentElement.setAttribute("data-ls-scheme", next);

    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
      const appearance = resolvedAppearance(next);
      toggle.innerHTML = `${themeIconMarkup(appearance)}<span class="ls-sr-only">Color theme: ${themeLabel(next)}</span>`;
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

  /** Public Drive PDF — web/attach-optimized leave-behind (keep in sync with Business Dev). */
  const SPONSORSHIP_PACKET_PDF_URL =
    "https://drive.google.com/file/d/1lcY0v0KhtJf_gxRvhqQPTJRiHPVRB4IO/view";

  /**
   * Delisted destinations still call initPageShell with their own id.
   * Map those to the nav leaf that should stay highlighted.
   */
  const NAV_ACTIVE_ALIASES = {
    roles: "team",
    build: "sponsorship",
    host: "booths",
    rfp: "team",
  };

  function resolveNavActivePage(activePage) {
    return NAV_ACTIVE_ALIASES[activePage] ?? activePage;
  }

  function getNavPages() {
    return [
      {
        id: "about",
        label: "About",
        href: "/about/",
        children: [
          { id: "history", label: "History", href: "/about/history/" },
          { id: "blog", label: "Blog", href: "/resources/blog/" },
          { id: "media", label: "Media", href: "/resources/media/" },
        ],
      },
      {
        id: "production",
        label: "Production",
        href: "/production/",
        children: [
          { id: "team", label: "Team", href: "/team/" },
          {
            id: "volunteer",
            label: "Volunteering",
            navLabel: "Volunteering",
            href: "/production/volunteer/",
          },
          {
            id: "activity-signups",
            label: "Activity sign-ups",
            navLabel: "Activity sign-ups",
            href: "/production/activity-signups/",
          },
          { id: "sponsorship", label: "Sponsorship", navLabel: "Sponsorship", href: "/sponsorship/" },
          { id: "booths", label: "Vendor booths", navLabel: "Vendor booths", href: "/vendors/" },
        ],
      },
      {
        id: "visit",
        label: "Visit",
        href: "/attendees/",
        children: [
          { id: "activities", label: "Activities", navLabel: "Activities", href: "/activities/" },
          { id: "food-menu", label: "Food menu", navLabel: "Food menu", href: "/food/" },
          {
            id: "vendors-list",
            label: "Vendors",
            navLabel: "Vendors",
            href: "/vendors-list/",
          },
          { id: "kids-village", label: "Kids Village", navLabel: "Kids Village", href: "/kids-village/" },
        ],
      },
      {
        id: "resources",
        label: "Resources",
        href: "/resources/",
        children: [
          { id: "season", label: "Lunar New Year Season", href: "/resources/season/" },
          { id: "lion-dance", label: "Lion dance groups", navLabel: "Lion dance groups", href: "https://littlesaigonsac.town/lists/lion-dance/", external: true },
          { id: "archive2026", label: "2026 archive", navLabel: "2026 archive", href: "https://www.elkgrovelunarnewyear.com/", external: true },
        ],
      },
    ];
  }

  function renderNavLinks(pages, activePage) {
    const resolvedActive = resolveNavActivePage(activePage);
    return pages
      .map((page) => {
        if (page.children?.length) {
          const parentCurrent = page.id === resolvedActive ? ' aria-current="page"' : "";
          const childActive = page.children.some((child) => child.id === resolvedActive);
          const sublinks = page.children
            .map((child) => {
              const childCurrent = child.id === resolvedActive ? ' aria-current="page"' : "";
              const external = child.external ? ' target="_blank" rel="noopener"' : "";
              return `<div class="ls-nav-sublink-wrap"><a class="ls-nav-sublink" href="${child.href}"${childCurrent}${external}>${escapeHtml(navLinkLabel(child))}</a></div>`;
            })
            .join("");
          return `<div class="ls-nav-group${childActive ? " ls-is-active" : ""}" data-nav-section="${escapeHtml(page.id)}"><a class="ls-nav-parent" href="${page.href}"${parentCurrent}>${escapeHtml(navLinkLabel(page))}</a><div class="ls-nav-submenu">${sublinks}</div></div>`;
        }
        const current = page.id === resolvedActive ? ' aria-current="page"' : "";
        return `<a href="${page.href}"${current}>${escapeHtml(navLinkLabel(page))}</a>`;
      })
      .join("");
  }

  function renderNav(activePage) {
    const pages = getNavPages();

    const links = renderNavLinks(pages, activePage);

    return `
    <nav class="ls-nav site-nav" data-ls-nav data-ls-nav-breakpoint="880px" aria-label="Main">
      <div class="ls-nav-bar">
        <a class="ls-nav-brand" href="/">
          <img
            class="site-nav-symbol"
            src="/assets/brand/eglny-symbol.png"
            alt=""
            width="320"
            height="320"
            decoding="async"
          />
          <span class="site-nav-logotype" aria-hidden="true"></span>
          <span class="ls-sr-only">Elk Grove Lunar New Year Tết</span>
        </a>
        <div class="ls-nav-end">
          <button type="button" class="ls-nav-toggle" data-ls-nav-toggle aria-expanded="false" aria-controls="site-nav-drawer">
            <span class="ls-nav-toggle-bars" aria-hidden="true"><span></span><span></span><span></span></span>
            <span class="ls-sr-only">Open menu</span>
          </button>
        </div>
      </div>
      <div class="ls-nav-backdrop" data-ls-nav-backdrop hidden aria-hidden="true"></div>
      <div id="site-nav-drawer" class="ls-nav-drawer" data-ls-nav-drawer aria-hidden="true">
        <div class="ls-nav-drawer-tools">
          <div class="site-nav-social-slot"></div>
          ${renderThemeControl()}
        </div>
        <div class="ls-nav-links">${links}</div>
        <div class="ls-nav-drawer-footer">
          <a class="site-nav-drawer-footer-email" href="mailto:contact@eglny.com">contact@eglny.com</a>
        </div>
      </div>
    </nav>
  `;
  }

  function siteContactEmail(site) {
    return site?.footer?.contactEmail ?? site?.apply?.email ?? "contact@eglny.com";
  }

  function injectNavContact(site) {
    const el = document.querySelector(".site-nav-drawer-footer-email");
    if (!el) return;
    const email = siteContactEmail(site);
    el.href = `mailto:${email}`;
    el.textContent = email;
  }

  function initNavMenu() {
    const nav = document.querySelector(".ls-nav");
    if (!nav) return;

    if (window.LSDS && typeof window.LSDS.initNavShell === "function") {
      const controllers = window.LSDS.initNavShell(document);
      const ctrl = controllers.find((c) => c.nav === nav);
      if (ctrl) {
        closeNavMenu = () => ctrl.close();
        return;
      }
    }
  }

  function mountNav(activePage) {
    const slot = document.getElementById("site-nav");
    if (slot) slot.innerHTML = renderNav(activePage);
  }

  function renderFooterNavLinks(pages) {
    const columns = [];

    for (const page of pages) {
      // Top nav uses the logotype for home; footer keeps Home above About in that column.
      const isAbout = page.id === "about";
      const parentHref = isAbout ? "/" : page.href;
      const parentLabel = isAbout ? "Home" : navLinkLabel(page);
      const parent = `<a class="site-footer-nav-parent" href="${parentHref}">${escapeHtml(parentLabel)}</a>`;

      const cloudItems = [];
      if (isAbout) {
        cloudItems.push(`<a href="${page.href}">${escapeHtml(navLinkLabel(page))}</a>`);
      }
      for (const child of page.children ?? []) {
        const external = child.external ? ' target="_blank" rel="noopener"' : "";
        cloudItems.push(
          `<a href="${child.href}"${external}>${escapeHtml(navLinkLabel(child))}</a>`
        );
      }
      const cloud = cloudItems.length
        ? `<div class="site-footer-nav-cloud">${cloudItems.join("")}</div>`
        : "";
      columns.push(`<div class="site-footer-nav-col">${parent}${cloud}</div>`);
    }

    return columns.join("");
  }

  function renderSocialIcon(label) {
    const icons = {
      Instagram: `<span class="ls-icon ls-icon--instagram social-icon" aria-hidden="true"></span>`,
      Facebook: `<span class="ls-icon ls-icon--facebook social-icon" aria-hidden="true"></span>`,
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
    const slot = document.querySelector(".site-nav-social-slot");
    if (!slot) return;
    slot.querySelector(".site-nav-social")?.remove();
    const html = renderNavSocialLinks(links);
    if (!html) return;
    slot.innerHTML = html;
  }

  function renderFooterSocialLinks(links) {
    if (!links?.length) return "";
    return `<nav class="site-footer-social" aria-label="Social media">${renderSocialLinkItems(links)}</nav>`;
  }

  function renderFooter(site) {
    const navLinks = renderFooterNavLinks(getNavPages());
    const footer = site?.footer ?? {};
    const social = renderFooterSocialLinks(footer.socialLinks);
    const contactEmail = siteContactEmail(site);
    const privacyHref = `${navPrefix()}privacy/`;
    const coalition = (footer.coalitionLinks ?? [])
      .filter((link) => link.href !== "https://www.elkgrovelunarnewyear.com/")
      .map((link) => `<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`)
      .join("\u00a0+\u00a0");

    return `
    <footer class="site-footer">
      <nav class="site-footer-nav" aria-label="Footer">${navLinks}</nav>
      ${social}
      <p class="site-footer-meta"><a href="mailto:${escapeHtml(contactEmail)}">${escapeHtml(contactEmail)}</a> &bull; <a href="${escapeHtml(privacyHref)}">Privacy</a></p>
      ${coalition ? `<p class="site-footer-meta site-footer-hosts">Hosted by ${coalition}</p>` : ""}
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

    return `<article class="role-card${phase2}${filled}">
      <h3>${escapeHtml(title)}</h3>
      ${director}
      ${test}
      ${shipBlock}
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
          <section class="lane-section${layoutClass} ls-doc-section" id="${escapeHtml(lane.id)}" data-doc-section>
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
      <a class="ls-btn ls-btn--primary btn btn-primary" href="${mailto}">Email ${escapeHtml(apply.email)}</a>
    </div>`;
    }

    return `
    <div class="cta-row">
      <a class="ls-btn ls-btn--primary btn btn-primary" href="${escapeHtml(idealist)}" target="_blank" rel="noopener">${escapeHtml(idealistLabel)}</a>
    </div>
    ${apply.idealistFallback ? `<p class="muted">${escapeHtml(apply.idealistFallback)}</p>` : ""}
  `;
  }

  function isSkillsProjectFilled(project) {
    return project.status === "filled" || Boolean(project.filledBy);
  }

  function renderSkillsProjectCard(project, { ctaClass }) {
    const filled = isSkillsProjectFilled(project);
    const filledClass = filled ? " role-card--filled" : "";
    const filledLine = filled
      ? `<p class="role-director">${
          project.filledBy ? `Filled — ${escapeHtml(project.filledBy)}` : "Filled"
        }</p>`
      : "";
    const cta =
      !filled && project.idealistUrl
        ? `<p class="cta-row"><a class="${ctaClass}" href="${escapeHtml(project.idealistUrl)}" target="_blank" rel="noopener">${escapeHtml(project.idealistCtaLabel ?? "Apply on Idealist")}</a></p>`
        : "";
    return `
            <article class="role-card skills-project-card${filledClass}" id="${escapeHtml(project.id)}">
              <h3>${escapeHtml(project.title)}</h3>
              ${filledLine}
              ${project.blurb ? `<p>${escapeHtml(project.blurb)}</p>` : ""}
              ${project.commitment ? `<p class="muted"><strong>Commitment:</strong> ${escapeHtml(project.commitment)}</p>` : ""}
              ${cta}
              ${project.idealistNote ? `<p class="muted">${escapeHtml(project.idealistNote)}</p>` : ""}
            </article>`;
  }

  function renderSkillsProjectsSection(site, { showHeading = true } = {}) {
    const block = site.teamPage?.skillsProjects;
    const projects = block?.projects ?? [];
    if (!projects.length) return "";
    const openCount = projects.filter((p) => !isSkillsProjectFilled(p)).length;
    const ctaClass = openCount === 1 ? "ls-btn ls-btn--primary btn btn-primary" : "ls-btn ls-btn--secondary btn btn-secondary";
    const cards = projects.map((p) => renderSkillsProjectCard(p, { ctaClass })).join("");
    const heading = showHeading
      ? `<h2>${escapeHtml(block.sectionTitle ?? "Skills projects")}</h2>
            ${block.intro ? `<p>${escapeHtml(block.intro)}</p>` : ""}`
      : block.intro
        ? `<p>${escapeHtml(block.intro)}</p>`
        : "";
    return `
          <section class="content-section ls-doc-section" id="skills-projects" data-doc-section>
            ${heading}
            <div class="skills-projects-grid">${cards}</div>
          </section>`;
  }

  function renderVolunteerPlanningSection(block) {
    const planning = block?.planning;
    if (!planning) return "";
    const title = planning.title ?? "Planning & directing";
    const body = planning.body ?? "See Team page for open roles.";
    const linkedBody = escapeHtml(body).replace(
      /\bTeam\b/,
      '<a href="/team/">Team</a>',
    );
    return `
          <section class="content-section ls-doc-section" id="planning-directing" data-doc-section>
            <h2>${escapeHtml(title)}</h2>
            <p>${linkedBody}</p>
          </section>`;
  }

  function renderVolunteerPage(site) {
    const block = site.teamPage?.skillsProjects;
    const skillsTitle = block?.sectionTitle ?? "Skills projects";
    const dayOf = block?.dayOfHelp;
    const planning = block?.planning;
    const projects = block?.projects ?? [];
    const openCount = projects.filter((p) => !isSkillsProjectFilled(p)).length;
    const ctaClass = openCount === 1 ? "ls-btn ls-btn--primary btn btn-primary" : "ls-btn ls-btn--secondary btn btn-secondary";
    const planningHtml = renderVolunteerPlanningSection(block);
    const skillsHtml = `
          <section class="content-section ls-doc-section" id="skills-projects" data-doc-section>
            <h2>${escapeHtml(skillsTitle)}</h2>
            <div class="skills-projects-grid">${projects
              .map((p) => renderSkillsProjectCard(p, { ctaClass }))
              .join("")}</div>
          </section>`;
    const dayOfCta =
      dayOf?.ctaHref && dayOf?.ctaLabel
        ? `<p class="cta-row"><a class="ls-btn ls-btn--primary btn btn-primary" href="${escapeHtml(dayOf.ctaHref)}" target="_blank" rel="noopener">${escapeHtml(dayOf.ctaLabel)}</a></p>`
        : "";
    const dayOfShifts = Array.isArray(dayOf?.shifts) ? dayOf.shifts : [];
    const dayOfShiftCol = dayOf?.shiftColumn ?? "Shift";
    const dayOfTasksCol = dayOf?.tasksColumn ?? "Tasks";
    const dayOfTableHtml = dayOfShifts.length
      ? `<div class="site-doc-table-wrap"><table class="site-doc-table volunteer-shifts-table">
            <colgroup><col class="volunteer-shifts-table__shift" /><col class="volunteer-shifts-table__tasks" /></colgroup>
            <thead><tr><th scope="col">${escapeHtml(dayOfShiftCol)}</th><th scope="col">${escapeHtml(dayOfTasksCol)}</th></tr></thead>
            <tbody>${dayOfShifts
              .map((s) => {
                const shift = escapeHtml(s.shift ?? "").replace(/\n/g, "<br>");
                const label = s.label ? `<strong>${escapeHtml(s.label)}</strong> — ` : "";
                const tasks = escapeHtml(s.tasks ?? s.detail ?? "");
                return `<tr><td>${shift}</td><td>${label}${tasks}</td></tr>`;
              })
              .join("")}</tbody>
          </table></div>`
      : "";
    const dayOfHtml = dayOf
      ? `
          <section class="content-section ls-doc-section" id="day-of-help" data-doc-section>
            <h2>${escapeHtml(dayOf.title ?? "Day-of help")}</h2>
            <p>${escapeHtml(dayOf.body ?? "Registration is not yet available — come back later.")}</p>
            ${dayOfTableHtml}
            ${dayOfCta}
          </section>`
      : "";
    const toc = [
      ...(planningHtml
        ? [{ id: "planning-directing", label: planning?.title ?? "Planning & directing" }]
        : []),
      ...(dayOf ? [{ id: "day-of-help", label: dayOf.title ?? "Day-of help" }] : []),
      { id: "skills-projects", label: skillsTitle },
    ];
    return wrapDocLayout(renderDocToc(toc), `${planningHtml}${dayOfHtml}${skillsHtml}`);
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

  const HERO_GOLDEN_GOAT_SRC = "/assets/hero/golden-goat-01.jpg";
  const HERO_GOLDEN_GOAT_SRCSET =
    "/assets/hero/golden-goat-01.jpg 1280w, /assets/hero/golden-goat-01-2x.jpg 1920w";
  const HERO_GOLDEN_GOAT_SIZES = "100vw";

  function renderFestivalHosts(site) {
    const hero = site.hero ?? {};
    const footer = site.footer ?? {};
    const hostsLabel = hero.hostsLabel || "Hosted by";
    const hosts =
      hero.hosts ??
      (footer.coalitionLinks ?? [])
        .filter((link) => ["cPALSs", "VACOS", "NVCC"].includes(link.label))
        .map((link) => ({
          label: link.label,
          name: link.label,
          href: link.href,
          logo: `/assets/hosts/${String(link.label).toLowerCase()}.png`,
        }));
    if (!hosts.length) return "";
    const items = hosts
      .map((host) => {
        const name = host.name || host.label || "";
        const label = host.label || name;
        const href = host.href || "#";
        const logo = host.logo || "";
        return `<a class="festival-host" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
          <span class="festival-host-mark">
            <img src="${escapeHtml(logo)}" alt="${escapeHtml(name)}" width="120" height="120" loading="lazy" decoding="async" />
          </span>
          <span class="festival-host-label">${escapeHtml(label)}</span>
        </a>`;
      })
      .join("");
    return `
      <div class="festival-hosts" aria-label="${escapeHtml(hostsLabel)}">
        <p class="festival-hosts-label">${escapeHtml(hostsLabel)}</p>
        <div class="festival-hosts-row">${items}</div>
      </div>
    `;
  }

  function renderFestivalHero(site) {
    const event = site.event ?? {};
    const hero = site.hero ?? {};
    const dates = splitEventDates(event);
    const venue = event.venueShort || event.venue || "Elk\u00A0Grove Park";
    const address = event.address || "";
    const freeLine = event.admissionLabel || "Free community celebration";
    const title =
      event.name ||
      site.meta?.siteName ||
      "Elk Grove Lunar New Year Tết";
    const lead =
      hero.festivalLead ||
      "A free family weekend of heritage, food, entertainment, and community — honoring where we come from and celebrating where we’re headed.";
    const keepElkGrove = (s) => String(s).replace(/Elk Grove/g, "Elk\u00A0Grove");
    const leadHtml = escapeHtml(lead);

    return `
      <section class="festival-hero" aria-label="Festival highlight">
        <img
          class="festival-hero-banner"
          src="${HERO_GOLDEN_GOAT_SRC}"
          srcset="${HERO_GOLDEN_GOAT_SRCSET}"
          sizes="${HERO_GOLDEN_GOAT_SIZES}"
          alt="EGLNY Tết — February 13–14 at Elk Grove Park. Golden goat with lion dancers."
          width="1280"
          height="670"
          decoding="async"
        />
        <div class="festival-hero-inner">
          <h1 class="festival-hero-title">${escapeHtml(keepElkGrove(title))}</h1>
          <p class="festival-hero-lead">${leadHtml}</p>
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
          ${renderFestivalHosts(site)}
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
          return `<p class="ls-doc-toc-label ls-doc-toc-label--section">${escapeHtml(
            item.label ?? "",
          )}</p>`;
        }
        return `<a class="ls-doc-toc-link" href="#${escapeHtml(item.id)}" data-toc-target="${escapeHtml(item.id)}">${escapeHtml(item.label)}</a>`;
      })
      .join("");
    const back =
      options.backHref != null
        ? `<a class="ls-doc-toc-back" href="${escapeHtml(options.backHref)}">${escapeHtml(
            options.backLabel ?? "← Back",
          )}</a>`
        : "";
    const foot = options.footHtml ? `<div class="ls-doc-toc-foot">${options.footHtml}</div>` : "";
    const navClass = options.backHref != null ? "ls-doc-toc ls-doc-toc--with-back" : "ls-doc-toc";
    return `<nav class="${navClass}" aria-label="On this page">${back}<p class="ls-doc-toc-label">On this page</p>${links}${foot}</nav>`;
  }

  function wrapDocLayout(tocHtml, mainHtml) {
    return `<div class="ls-doc-layout" data-ls-toc-drawer>${tocHtml}<div class="ls-doc-main">${mainHtml}</div></div>`;
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

  function findLaneById(site, laneId) {
    if (!laneId) return null;
    return (site.lanes ?? []).find((lane) => lane.id === laneId) ?? null;
  }

  function buildRosterToc(site) {
    const groups = site.teamPage?.roster?.groups ?? [];
    const groupItems = groups
      .filter((group) => {
        if (!group.title) return false;
        const hasMembers = (group.members?.length ?? 0) > 0;
        const hasCredits = (group.credits ?? []).some((c) => c?.area && (c.names?.length ?? 0) > 0);
        const hasLane = Boolean(findLaneById(site, group.laneId));
        return hasMembers || hasCredits || hasLane;
      })
      .map((group) => ({
        id: slugifyHeading(group.title),
        label: group.title,
      }));
    return [
      ...groupItems,
      { id: "apply", label: "Apply & get involved" },
      { id: "faq", label: "FAQ" },
    ];
  }

  function buildTeamToc(site) {
    return buildJoinToc(site);
  }

  function buildOpenRolesToc(site) {
    return [
      { id: "apply", label: "Apply & get involved" },
      { id: "faq", label: "FAQ" },
      ...(site.lanes ?? []).map((lane) => ({ id: lane.id, label: lane.title })),
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
        .map((section) => {
          const id = sectionId(section);
          const paragraphs = (section.paragraphs ?? [])
            .map((p) => `<p>${linkFirstFundTheFestival(formatBriefProse(p))}</p>`)
            .join("");
          return `
      <section class="about-section ls-doc-section" id="${escapeHtml(id)}" data-doc-section>
        <h2>${escapeHtml(section.title)}</h2>
        ${paragraphs}
        ${renderBriefTable(section.table)}
        ${renderBriefOrderedItems(section.orderedItems)}
        ${renderBriefBullets(section.bullets)}
      </section>`;
        })
        .join("");
    }
    return (about.paragraphs ?? []).map((p) => `<p>${formatBriefProse(p)}</p>`).join("");
  }

  function renderPosterWall(posterWall) {
    if (!posterWall) return "";
    const prefix = navPrefix();
    const cards = (posterWall.posters ?? [])
      .map((poster) => {
        const alt = `Lunar New Year ${poster.year} festival poster — ${poster.venue}`;
        const src = poster.image ? `${prefix}${poster.image}` : "";
        const image = src
          ? `<button type="button" class="history-poster-open" style="background-image: url('${escapeHtml(src)}')" data-lightbox-src="${escapeHtml(src)}" data-lightbox-alt="${escapeHtml(alt)}" aria-label="View ${escapeHtml(alt)}">
          <img class="poster-image" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" />
        </button>`
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
    <section class="poster-wall ls-doc-section" id="posters" data-doc-section>
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
        injectNavContact(site);
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
    // intended ≡ tentative (Bao 10/20) — one yellow UI status
    if (explicit === "intended" || explicit === "tentative") return "tentative";
    if (
      explicit === "estimated" ||
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
      /\bintended\b/.test(dates) ||
      /\(tentative\)/.test(dates) ||
      /\btentative\b/.test(dates) ||
      /to be finalized|\btbd\b/.test(dates)
    ) {
      return "tentative";
    }
    return "confirmed";
  }

  function renderSeasonEventLinks(event) {
    const items = Array.isArray(event.links) ? event.links : [];
    const parts = items
      .filter((link) => link && link.label && link.href)
      .map((link) => {
        const href = String(link.href);
        return `<a href="${escapeHtml(href)}"${externalLinkAttrs(href)}>${escapeHtml(String(link.label))}</a>`;
      });
    if (!parts.length) return "";
    return `<span class="season-event-links">${parts.join(" · ")}</span>`;
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
      ${renderSeasonEventLinks(event)}
    </li>`;
  }

  function renderSeasonDateLegend() {
    return `<ul class="season-date-legend" aria-label="Date key">
      <li class="season-date-legend-item">
        <span class="season-date-legend-swatch season-date-legend-swatch--tentative" aria-hidden="true"></span>
        Tentative
      </li>
      <li class="season-date-legend-item">
        <span class="season-date-legend-swatch season-date-legend-swatch--confirmed" aria-hidden="true"></span>
        Confirmed listing
      </li>
    </ul>`;
  }

  function seasonBlocksFromData(season, seasonData) {
    if (Array.isArray(seasonData?.seasons) && seasonData.seasons.length) {
      return seasonData.seasons.map((block, index) => {
        const year = String(block.seasonYear || "");
        const fallbackTitle =
          index === 0
            ? season?.upcomingTitle || season?.title
            : season?.previousTitle || (year ? `${year} season` : "Previous season");
        return {
          id: index === 0 ? "season" : `season-${year || index}`,
          title: block.title || fallbackTitle || "Season",
          intro: index === 0 ? season?.intro : season?.previousIntro,
          events: block.events ?? [],
        };
      });
    }
    return [
      {
        id: "season",
        title: season?.title ?? "Lunar New Year Season",
        intro: season?.intro,
        events: seasonData?.events ?? [],
      },
    ];
  }

  function renderSeasonPage(season, seasonData) {
    const blocks = seasonBlocksFromData(season, seasonData);
    const listNote = season?.listNote
      ? `<p class="muted season-list-note">${escapeHtml(season.listNote)}</p>`
      : "";
    const contactNote = season?.contactNote
      ? `<p class="muted season-contact-note">${escapeHtml(season.contactNote)}</p>`
      : "";
    const toc = blocks.map((block) => ({ id: block.id, label: block.title }));
    const seasonSections = blocks
      .map((block, index) => {
        const listItems = (block.events ?? []).map(renderSeasonEventItem).join("");
        const footer =
          index === blocks.length - 1 ? `${listNote}${contactNote}` : "";
        return `
      <section class="about-section resources-season ls-doc-section" id="${escapeHtml(block.id)}" data-doc-section>
        <h2>${escapeHtml(block.title)}</h2>
        ${block.intro ? `<p>${escapeHtml(block.intro)}</p>` : ""}
        ${
          block.events?.length
            ? `${index === 0 ? renderSeasonDateLegend() : ""}<ul class="season-event-list">${listItems}</ul>`
            : `<p class="muted">Season events coming soon.</p>`
        }
        ${footer}
      </section>`;
      })
      .join("");

    return `
      <section class="hero">
        <h1>${escapeHtml(season?.headline ?? "Lunar New Year Season")}</h1>
        ${season?.lead ? `<p class="hero-lead">${escapeHtml(season.lead)}</p>` : ""}
      </section>
      ${wrapDocLayout(renderDocToc(toc), seasonSections)}`;
  }

  function instagramHandleFromUrl(url) {
    try {
      const path = new URL(url).pathname.replace(/\/+$/, "");
      const handle = path.split("/").filter(Boolean)[0];
      return handle ? `@${handle.replace(/^@/, "")}` : "Instagram";
    } catch {
      return "Instagram";
    }
  }

  function websiteLabelFromUrl(url) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./i, "");
      const path = parsed.pathname.replace(/\/+$/, "");
      if (path && path !== "/") return `${host}${path}`;
      return host || "Website";
    } catch {
      return "Website";
    }
  }

  function renderLionDanceGroupItem(troupe) {
    const aka = troupe.aka ? ` <span class="lion-group-aka">${escapeHtml(troupe.aka)}</span>` : "";
    const handle = troupe.handle ?? (troupe.instagram ? instagramHandleFromUrl(troupe.instagram) : "");
    const ig = troupe.instagram
      ? `<a href="${escapeHtml(troupe.instagram)}" target="_blank" rel="noopener">${escapeHtml(handle || "Instagram")}</a>`
      : `<span class="muted">No Instagram on file</span>`;
    const web = troupe.website
      ? `<a href="${escapeHtml(troupe.website)}" target="_blank" rel="noopener">${escapeHtml(websiteLabelFromUrl(troupe.website))}</a>`
      : "";
    const avatar = troupe.avatar
      ? troupe.instagram
        ? `<a class="lion-group-avatar-link" href="${escapeHtml(troupe.instagram)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true"><img class="lion-group-avatar" src="${escapeHtml(troupe.avatar)}" alt="" width="44" height="44" loading="lazy" /></a>`
        : `<img class="lion-group-avatar" src="${escapeHtml(troupe.avatar)}" alt="" width="44" height="44" loading="lazy" />`
      : "";
    return `<li class="lion-group-item">
      ${avatar}
      <span class="lion-group-text">
        <span class="lion-group-name">${escapeHtml(troupe.name)}${aka}</span>
        <span class="lion-group-links">
          <span class="lion-group-ig">${ig}</span>
          ${web ? `<span class="lion-group-web">${web}</span>` : ""}
        </span>
      </span>
    </li>`;
  }

  function renderLionDanceGroupsPage(data) {
    const lanes = data?.lanes ?? [];
    const toc = lanes.map((lane) => ({ id: lane.id, label: lane.title }));
    const sections = lanes
      .map((lane) => {
        const items = [...(lane.troupes ?? [])]
          .sort((a, b) => (a.name || "").localeCompare(b.name || "", "en", { sensitivity: "base" }))
          .map(renderLionDanceGroupItem)
          .join("");
        return `
      <section class="about-section resources-lion-groups ls-doc-section" id="${escapeHtml(lane.id)}" data-doc-section>
        <h2>${escapeHtml(lane.title)}</h2>
        <ul class="lion-group-list">${items}</ul>
      </section>`;
      })
      .join("");
    const contactNote = data?.contactNote
      ? `<p class="muted lion-groups-note">${escapeHtml(data.contactNote)}</p>`
      : "";
    const main = `
      ${data?.intro ? `<p>${escapeHtml(data.intro)}</p>` : ""}
      ${sections}
      ${contactNote}`;

    return `
      <section class="hero">
        <h1>${escapeHtml(data?.headline ?? "Lion dance groups")}</h1>
        ${data?.lead ? `<p class="hero-lead">${escapeHtml(data.lead)}</p>` : ""}
      </section>
      ${wrapDocLayout(renderDocToc(toc), main)}`;
  }

  function normalizeInstagramUrl(instagram) {
    if (!instagram) return null;
    const s = String(instagram).trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) return s;
    const handle = s.replace(/^@/, "").replace(/^instagram\.com\//i, "").split("/")[0];
    return handle ? `https://www.instagram.com/${encodeURIComponent(handle)}/` : null;
  }

  function normalizeVendorFacebookUrl(facebook) {
    if (!facebook) return null;
    const raw = String(facebook).trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    let path = raw
      .replace(/^@/, "")
      .replace(/^(www\.)?facebook\.com\//i, "")
      .replace(/^fb\.com\//i, "")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");
    if (!path) return null;
    if (/^profile\.php\?/i.test(path)) return `https://www.facebook.com/${path}`;
    const [slug, query] = path.split("?");
    const base = `https://www.facebook.com/${encodeURIComponent(slug)}`;
    return query ? `${base}?${query}` : `${base}/`;
  }

  function vendorLogoSrc(logo) {
    if (!logo) return null;
    if (/^https?:\/\//i.test(logo)) return logo;
    const prefix = navPrefix();
    return `${prefix}${logo.replace(/^\//, "")}`;
  }

  function vendorHasAvatar(vendor) {
    return Boolean(vendorLogoSrc(vendor?.logo ?? vendor?.avatar ?? vendor?.image));
  }

  /** Initials for logo placeholders — real logos still win sort via vendorHasAvatar. */
  function vendorDirectoryInitials(name) {
    const skip = new Set(["and", "the", "of", "a", "an", "&"]);
    const trailSkip = new Set(["company", "co", "corp", "corporation", "llc", "inc", "ltd", "limited"]);
    const words = String(name || "")
      .replace(/['’]s\b/gi, "")
      .split(/[\s./_-]+/)
      .map((w) => w.replace(/[^A-Za-z0-9\u00C0-\u024F]/g, ""))
      .filter((w) => w && !skip.has(w.toLowerCase()));
    while (words.length > 1 && trailSkip.has(words[words.length - 1].toLowerCase())) {
      words.pop();
    }
    const alphaWords = words.filter((w) => /[A-Za-z\u00C0-\u024F]/.test(w));
    const use = alphaWords.length ? alphaWords : words;
    if (!use.length) return "?";
    if (use.length === 1) return use[0].slice(0, 2).toUpperCase();
    return use
      .slice(0, 3)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  function normalizeVendorWebsiteUrl(website) {
    if (!website) return null;
    let s = String(website).trim();
    if (!s || /^n\/?a$/i.test(s) || /^none$/i.test(s) || /\s/.test(s)) return null;
    if (/^http:\/\//i.test(s)) s = `https://${s.slice(7)}`;
    if (/^https:\/\//i.test(s)) {
      try {
        const u = new URL(s);
        if (u.protocol !== "https:") return null;
        return u.toString();
      } catch {
        return null;
      }
    }
    if (/^www\./i.test(s)) return `https://${s}`;
    if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?]|$)/i.test(s)) return `https://${s}`;
    return null;
  }

  function renderVendorDirectoryLinkIcon() {
    return `<svg class="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
  }

  function sortVendorsDirectory(vendors) {
    return [...(vendors ?? [])].sort((a, b) => {
      const aHas = vendorHasAvatar(a) ? 0 : 1;
      const bHas = vendorHasAvatar(b) ? 0 : 1;
      if (aHas !== bHas) return aHas - bHas;
      return String(a?.name ?? "").localeCompare(String(b?.name ?? ""), "en", {
        sensitivity: "base",
      });
    });
  }

  function renderVendorsDirectoryItem(vendor) {
    const logoSrc = vendorLogoSrc(vendor.logo ?? vendor.avatar ?? vendor.image);
    const hasRealLogo = Boolean(logoSrc);
    const logo = hasRealLogo
      ? `<img class="vendor-directory-logo" src="${escapeHtml(logoSrc)}" alt="" width="56" height="56" loading="lazy" />`
      : `<span class="vendor-directory-logo vendor-directory-logo--placeholder" aria-hidden="true">${escapeHtml(
          vendorDirectoryInitials(vendor.name)
        )}</span>`;
    const websiteUrl = normalizeVendorWebsiteUrl(vendor.website ?? vendor.url);
    const websiteLink = websiteUrl
      ? `<a
            class="vendor-directory-link"
            href="${escapeHtml(websiteUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${escapeHtml(`Website: ${websiteLabelFromUrl(websiteUrl)}`)}"
          >${renderVendorDirectoryLinkIcon()}</a>`
      : "";
    const igUrl = normalizeInstagramUrl(vendor.instagram);
    const igHandle = igUrl ? instagramHandleFromUrl(igUrl) : "";
    const igLink = igUrl
      ? `<a
            class="vendor-directory-ig"
            href="${escapeHtml(igUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${escapeHtml(`Instagram: ${igHandle}`)}"
          >${renderSocialIcon("Instagram")}</a>`
      : "";
    const fbUrl = normalizeVendorFacebookUrl(vendor.facebook);
    const fbLink = fbUrl
      ? `<a
            class="vendor-directory-fb"
            href="${escapeHtml(fbUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${escapeHtml(`Facebook: ${vendor.name ?? "vendor"}`)}"
          >${renderSocialIcon("Facebook")}</a>`
      : "";
    const iconRow =
      websiteLink || igLink || fbLink
        ? `<div class="vendor-directory-icons">${websiteLink}${igLink}${fbLink}</div>`
        : "";
    return `<li class="vendor-directory-item${hasRealLogo ? " vendor-directory-item--has-avatar" : ""}">
      ${logo}
      <div class="vendor-directory-body">
        <h3 class="vendor-directory-name">${escapeHtml(vendor.name)}${iconRow}</h3>
        ${vendor.description ? `<p class="vendor-directory-desc">${formatBriefProse(vendor.description)}</p>` : ""}
      </div>
    </li>`;
  }

  function renderVendorsDirectoryPage(data) {
    const sections = data?.sections ?? [];
    const toc = sections.map((section) => ({
      id: section.id,
      label: section.title,
    }));

    const sectionHtml = sections
      .map((section) => {
        const vendors = sortVendorsDirectory(section.vendors ?? []);
        const list =
          vendors.length > 0
            ? `<ul class="vendor-directory-list">${vendors.map(renderVendorsDirectoryItem).join("")}</ul>`
            : section.emptyMessage
              ? `<p class="muted vendor-directory-empty">${escapeHtml(section.emptyMessage)}</p>`
              : `<p class="muted vendor-directory-empty">No vendors listed yet.</p>`;
        return `
      <section class="about-section vendor-directory-section ls-doc-section" id="${escapeHtml(section.id)}" data-doc-section>
        <h2>${escapeHtml(section.title)}</h2>
        ${section.intro ? `<p>${escapeHtml(section.intro)}</p>` : ""}
        ${list}
      </section>`;
      })
      .join("");

    const main = sectionHtml;

    return `
      <section class="hero">
        <h1>${escapeHtml(data?.headline ?? "Vendors")}</h1>
        ${data?.lead ? `<p class="hero-lead">${formatBriefProse(data.lead)}</p>` : ""}
      </section>
      ${wrapDocLayout(renderDocToc(toc), main)}`;
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

  function renderActivitySignupsPage(page) {
    const programs = page?.programs ?? [];
    const toc = programs.map((p) => ({
      id: p.id || slugifyHeading(p.title || "program"),
      label: p.title || "Program",
    }));
    const programsHtml = programs
      .map((p) => {
        const id = p.id || slugifyHeading(p.title || "program");
        const flier = p.flier;
        const shareTitle = p.title || "Program flier";
        const shareLabel = `Share ${shareTitle} flier`;
        const shareButtonHtml = flier?.src
          ? `<button
              type="button"
              class="ls-btn ls-btn--tertiary btn btn-tertiary programming-flier-share"
              data-share-src="${escapeHtml(flier.src)}"
              data-share-title="${escapeHtml(shareTitle)}"
              aria-label="${escapeHtml(shareLabel)}"
              hidden
            >Share flier</button>`
          : "";
        const registerHtml =
          p.ctaHref && p.ctaLabel
            ? `<a class="ls-btn ls-btn--primary btn btn-primary" href="${escapeHtml(p.ctaHref)}" target="_blank" rel="noopener">${escapeHtml(p.ctaLabel)}</a>`
            : "";
        const ctaHtml =
          registerHtml || shareButtonHtml
            ? `<p class="cta-row programming-signup-cta">${registerHtml}${shareButtonHtml}</p>`
            : "";
        const flierHtml = flier?.src
          ? `
        <figure class="programming-flier">
          <a class="programming-flier-open" href="${escapeHtml(flier.src)}" target="_blank" rel="noopener">
            <img class="programming-flier-image" src="${escapeHtml(flier.src)}" alt="${escapeHtml(flier.alt || p.title || "Program flier")}" loading="lazy" width="1080" height="1334" />
          </a>
        </figure>`
          : "";
        const contactEmail = p.contactEmail;
        let bodyHtml = p.body ? `<p>${escapeHtml(p.body)}</p>` : "";
        if (contactEmail) {
          const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(
            p.emailSubject ?? "EGLNY 2027 programming",
          )}`;
          const emailLink = `<a href="${escapeHtml(mailto)}">${escapeHtml(contactEmail)}</a>`;
          if (p.body && p.body.includes(contactEmail)) {
            bodyHtml = `<p>${escapeHtml(p.body).replace(escapeHtml(contactEmail), emailLink)}</p>`;
          } else {
            bodyHtml = `${bodyHtml}<p>${emailLink}</p>`;
          }
        }
        const linksHtml = (Array.isArray(p.links) ? p.links : [])
          .filter((l) => l?.href && l?.label)
          .map(
            (l) =>
              `<p><a href="${escapeHtml(l.href)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a></p>`,
          )
          .join("");
        return `
      <section class="content-section ls-doc-section" id="${escapeHtml(id)}" data-doc-section>
        <h2>${escapeHtml(p.title || "Program")}</h2>
        ${bodyHtml}
        ${linksHtml}
        ${ctaHtml}
        ${flierHtml}
      </section>`;
      })
      .join("");

    return `
      <section class="hero">
        <h1>${escapeHtml(page?.headline ?? "Activity sign-ups")}</h1>
        ${page?.lead ? `<p class="hero-lead">${escapeHtml(page.lead)}</p>` : ""}
      </section>
      ${wrapDocLayout(renderDocToc(toc), programsHtml)}`;
  }

  function flierShareFileName(src) {
    try {
      const path = new URL(src, window.location.href).pathname;
      const base = path.split("/").pop();
      return base && /\.[a-z0-9]+$/i.test(base) ? base : "flier.jpg";
    } catch (_) {
      return "flier.jpg";
    }
  }

  async function shareProgrammingFlier(button) {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      return;
    }
    const src = button.getAttribute("data-share-src");
    const title = button.getAttribute("data-share-title") || "Programming flier";
    const pageUrl = window.location.href;
    const text = `${title} — Elk Grove Lunar New Year Tết`;

    if (src && typeof navigator.canShare === "function") {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`Flier fetch failed (${response.status})`);
        const blob = await response.blob();
        const type = blob.type || "image/jpeg";
        const file = new File([blob], flierShareFileName(src), { type });
        const fileShare = { files: [file], title, text };
        if (navigator.canShare(fileShare)) {
          await navigator.share(fileShare);
          return { mode: "file" };
        }
      } catch (_) {
        /* fall through to URL share */
      }
    }

    await navigator.share({ title, text, url: pageUrl });
    return { mode: "url" };
  }

  function initProgrammingFlierShare(root = document) {
    const buttons = root.querySelectorAll(".programming-flier-share");
    if (!buttons.length) return;

    const shareAvailable =
      typeof navigator !== "undefined" && typeof navigator.share === "function";

    buttons.forEach((button) => {
      if (!shareAvailable) {
        button.hidden = true;
        button.setAttribute("aria-hidden", "true");
        button.disabled = true;
        return;
      }

      button.hidden = false;
      button.removeAttribute("aria-hidden");
      button.disabled = false;
      if (button.dataset.shareBound === "1") return;
      button.dataset.shareBound = "1";

      button.addEventListener("click", async () => {
        if (button.dataset.sharing === "1") return;
        button.dataset.sharing = "1";
        try {
          await shareProgrammingFlier(button);
        } catch (err) {
          if (err && err.name === "AbortError") return;
          console.warn("Programming flier share failed", err);
        } finally {
          delete button.dataset.sharing;
        }
      });
    });
  }

  function renderAttendeesPage(attendees) {
    return renderResourcesPage({
      headline: attendees?.headline ?? "Visit",
      lead: attendees?.lead,
      links: attendees?.links,
    });
  }


  /** Allow only #rgb / #rrggbb / #rrggbbaa for sponsor cardBg (inline CSS). */
  function sanitizeSponsorCardBg(value) {
    if (typeof value !== "string") return null;
    const v = value.trim();
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v) ? v : null;
  }

  /** Expand #rgb → #rrggbb for luminance checks. */
  function expandSponsorCardBgHex(hex) {
    if (!hex) return null;
    if (hex.length === 4) {
      return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    return hex.length >= 7 ? hex.slice(0, 7) : hex;
  }

  /** Relative luminance 0–1; null if unparseable. */
  function sponsorCardBgLuminance(hex) {
    const full = expandSponsorCardBgHex(hex);
    if (!full || full.length !== 7) return null;
    const r = parseInt(full.slice(1, 3), 16) / 255;
    const g = parseInt(full.slice(3, 5), 16) / 255;
    const b = parseInt(full.slice(5, 7), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /** Resolve plate color: explicit cardBg, else logoOnDark/darkBg → near-black. */
  function resolveSponsorCardBg(sponsor) {
    const fromCard = sanitizeSponsorCardBg(sponsor?.cardBg);
    if (fromCard) return fromCard;
    if (sponsor?.logoOnDark === true || sponsor?.darkBg === true) {
      return "#0a0a0a";
    }
    return null;
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
    const idPrefix = options.idPrefix ?? "";
    const docSections = options.docSections !== false;
    const sectionClass = docSections ? "ls-sponsor-tier ls-doc-section" : "ls-sponsor-tier";
    const dataAttr = docSections ? " data-doc-section" : "";
    const gridClass = options.centerGrid
      ? "ls-sponsor-grid ls-sponsor-grid--center"
      : "ls-sponsor-grid";
    return sortedTiers
      .map((tier) => {
        const tierId = `${idPrefix}${slugifyHeading(tier)}`;
        const cards = byTier
          .get(tier)
          .map((s) => {
            const inner = s.logo
              ? `<img src="${escapeHtml(logoPrefix)}${escapeHtml(s.logo)}" alt="${escapeHtml(s.name)}" />`
              : escapeHtml(s.name);
            const cardBg = resolveSponsorCardBg(s);
            const styleAttr = cardBg
              ? ` style="--ls-sponsor-card-bg:${cardBg};--ls-sponsor-opacity:1"`
              : "";
            const lum = cardBg ? sponsorCardBgLuminance(cardBg) : null;
            const onDark =
              s.logoOnDark === true ||
              s.darkBg === true ||
              (lum != null && lum < 0.25);
            const cardClass = onDark
              ? "ls-sponsor-card ls-sponsor-card--on-dark"
              : "ls-sponsor-card";
            if (s.url) {
              return `<a class="${cardClass}" href="${escapeHtml(s.url)}" target="_blank" rel="noopener"${styleAttr}>${inner}</a>`;
            }
            return `<div class="${cardClass}"${styleAttr}>${inner}</div>`;
          })
          .join("");
        return `<section class="${sectionClass}" id="${escapeHtml(tierId)}"${dataAttr}><h2 class="ls-sponsor-tier-heading">${escapeHtml(tier)}</h2><div class="${gridClass}">${cards}</div></section>`;
      })
      .join("");
  }

  /** Homepage thank-you block — same 2027 copy + tiers as /sponsorship/. */
  function renderHomeSponsors2027(sponsorship, sponsors2027Data) {
    const tiersHtml = renderSponsorTierHtml(sponsors2027Data, {
      idPrefix: "home-2027-",
      docSections: false,
      centerGrid: true,
    });
    if (!tiersHtml) return "";
    const title = sponsorship?.thankYou2027Title ?? "2027 Festival Sponsors";
    const lead =
      sponsorship?.thankYou2027Lead ??
      "Thank you to these partners and sponsors for standing with the 2027 festival.";
    return `
          <section class="content-section home-build-cta home-sponsors-2027">
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(lead)}</p>
            ${tiersHtml}
          </section>`;
  }

  function renderSponsorshipPage(sponsorship, sponsors2026Data, sponsors2027Data) {
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

    const year = sponsors2026Data?.eventYear ?? 2026;
    const thankYouTitle = sponsorship?.thankYouTitle ?? `Thank You, ${year} Festival Sponsors`;
    const thankYouLead =
      sponsorship?.thankYouLead ??
      `Our ${year} festival was made possible by these partners and sponsors.`;
    const thankYou2027Title =
      sponsorship?.thankYou2027Title ?? "2027 Festival Sponsors";
    const thankYou2027Lead =
      sponsorship?.thankYou2027Lead ??
      "Thank you to these partners and sponsors for standing with the 2027 festival.";

    // Left-aligned grid — do not pass centerGrid (homepage-only).
    const tiers2027Html = renderSponsorTierHtml(sponsors2027Data, {
      idPrefix: "2027-",
      centerGrid: false,
    });
    const tiers2026Html = renderSponsorTierHtml(sponsors2026Data, {
      centerGrid: false,
    });

    const tocItems = [
      { id: "partner", label: sponsorship?.partnerTitle ?? "Partner with us" },
      {
        id: "thank-you-2027",
        label: sponsorship?.sponsors2027TocLabel ?? "2027 sponsors",
      },
      {
        id: "thank-you-2026",
        label: sponsorship?.sponsors2026TocLabel ?? `${year} sponsors`,
      },
    ];

    const partnerEmail = sponsorship?.partnerContactEmail ?? "sponsorship@eglny.com";
    const partnerContactNote = sponsorship?.partnerContactNote
      ? `<p class="muted">${escapeHtml(sponsorship.partnerContactNote).replace(
          escapeHtml(partnerEmail),
          `<a href="mailto:${escapeHtml(partnerEmail)}?subject=${encodeURIComponent("LNY 2027 sponsorship")}">${escapeHtml(partnerEmail)}</a>`,
        )}</p>`
      : "";

    const mainHtml = `
      <section class="content-section ls-doc-section" id="partner" data-doc-section>
        <h2>${escapeHtml(sponsorship?.partnerTitle ?? "Partner with us")}</h2>
        ${sponsorship?.partnerIntro ? `<p>${escapeHtml(sponsorship.partnerIntro)}</p>` : ""}
        <div class="resource-card-grid">${partnerCards}</div>
        ${partnerContactNote}
      </section>
      <section class="sponsorship-thank-you ls-doc-section" id="thank-you-2027" data-doc-section>
        <h2 class="sponsorship-thank-you-title">${escapeHtml(thankYou2027Title)}</h2>
        <p>${escapeHtml(thankYou2027Lead)}</p>
      </section>
      ${tiers2027Html}
      <section class="sponsorship-thank-you ls-doc-section" id="thank-you-2026" data-doc-section>
        <h2 class="sponsorship-thank-you-title">${escapeHtml(thankYouTitle)}</h2>
        <p>${escapeHtml(thankYouLead)}</p>
      </section>
      ${tiers2026Html || "<p>No sponsors to display.</p>"}`;

    return `
      <section class="hero">
        <h1>${escapeHtml(sponsorship?.headline ?? "Sponsorship")}</h1>
        ${sponsorship?.lead ? `<p class="hero-lead">${escapeHtml(sponsorship.lead)}</p>` : ""}
      </section>
      ${wrapDocLayout(renderDocToc(tocItems), mainHtml)}`;
  }

  function youtubePosterInner(id, title) {
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
    const poster = `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
    return `
          <button type="button" class="video-play" aria-label="Play ${escapeHtml(title)}">
            <img class="video-poster" src="${escapeHtml(poster)}" alt="" loading="lazy" width="480" height="360" />
            <span class="video-play-icon" aria-hidden="true"></span>
          </button>
          <a class="video-fallback-link" href="${escapeHtml(watchUrl)}" target="_blank" rel="noopener">Watch on YouTube</a>`;
  }

  function renderYoutubeEmbed(id, title) {
    const embedSrc = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
    return `
        <div class="video-embed" data-youtube-id="${escapeHtml(id)}" data-embed-src="${escapeHtml(embedSrc)}">
          ${youtubePosterInner(id, title)}
        </div>`;
  }

  function restoreYoutubePoster(embed) {
    const id = embed.getAttribute("data-youtube-id");
    if (!id || !embed.querySelector("iframe")) return;
    const button = embed.querySelector(".video-play");
    const title = button?.getAttribute("aria-label")?.replace(/^Play\s+/, "") || "Festival video";
    embed.innerHTML = youtubePosterInner(id, title);
    initMediaPlayers(embed);
  }

  function renderMediaVideoCard(video) {
    const id = String(video.youtubeId ?? "").trim();
    const title = video.title ?? "Festival video";
    return `
      <figure class="video-card">
        ${renderYoutubeEmbed(id, title)}
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
      <section class="content-section ls-doc-section" id="videos" data-doc-section>
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
    const embeds = root.matches?.(".video-embed[data-embed-src]")
      ? [root]
      : [...root.querySelectorAll(".video-embed[data-embed-src]")];
    embeds.forEach((embed) => {
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

  function instagramPermalink(url) {
    const match = String(url ?? "").match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
    if (!match) return String(url ?? "").trim();
    return `https://www.instagram.com/p/${match[1]}/`;
  }

  function markInstagramEmbedFailed(wrap) {
    wrap.classList.add("is-embed-failed");
    wrap.style.height = "";
    const iframe = wrap.querySelector("iframe");
    if (iframe) iframe.remove();
    wrap.querySelectorAll("blockquote.instagram-media").forEach((el) => el.remove());
  }

  const INSTAGRAM_EMBED_NATIVE_WIDTH = 326;
  /* Official embed.js card (measured 2026-09 on /p/…/embed): 54px profile
     header, then a 4:5 media well with a centered 9:16 reel (blurred sides),
     then likes / “View more” / comments. No query param hides that chrome —
     clip to the 9:16 reel and scale to the YouTube column. */
  const INSTAGRAM_EMBED_HEADER_PX = 54;
  const INSTAGRAM_EMBED_STAGE_HEIGHT_RATIO = 5 / 4;

  function fitInstagramEmbed(wrap) {
    const iframe = wrap.querySelector("iframe");
    if (!iframe || wrap.classList.contains("is-embed-failed")) {
      wrap.style.height = "";
      return;
    }
    const colW = wrap.getBoundingClientRect().width;
    if (colW < 1) return;
    const nativeW = INSTAGRAM_EMBED_NATIVE_WIDTH;
    const stageH = nativeW * INSTAGRAM_EMBED_STAGE_HEIGHT_RATIO;
    const videoW = stageH * (9 / 16);
    const leftCrop = (nativeW - videoW) / 2;
    const scale = colW / videoW;
    iframe.style.width = `${nativeW}px`;
    iframe.style.maxWidth = `${nativeW}px`;
    iframe.style.minWidth = `${nativeW}px`;
    iframe.style.transformOrigin = "top left";
    iframe.style.transform = `scale(${scale}) translate(-${leftCrop}px, -${INSTAGRAM_EMBED_HEADER_PX}px)`;
    iframe.style.margin = "0";
    wrap.style.height = `${Math.round(colW * (16 / 9))}px`;
  }

  function watchInstagramEmbedFit(wrap) {
    if (wrap.dataset.igFitBound === "1") {
      fitInstagramEmbed(wrap);
      return;
    }
    wrap.dataset.igFitBound = "1";
    const apply = () => fitInstagramEmbed(wrap);
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    const observeFrame = (iframe) => {
      if (!iframe || iframe.dataset.igRo === "1") return;
      iframe.dataset.igRo = "1";
      ro.observe(iframe);
    };
    observeFrame(wrap.querySelector("iframe"));
    const mo = new MutationObserver(() => {
      observeFrame(wrap.querySelector("iframe"));
      apply();
    });
    mo.observe(wrap, { childList: true, subtree: true });
    apply();
  }

  function initInstagramEmbeds(root = document) {
    const wraps = [...root.querySelectorAll(".video-embed-instagram")];
    if (!wraps.length) return;

    const finish = (ok) => {
      wraps.forEach((wrap) => {
        if (!ok || !wrap.querySelector("iframe")) markInstagramEmbedFailed(wrap);
        else watchInstagramEmbedFit(wrap);
      });
    };

    const process = () => {
      const run = () => {
        try {
          window.instgrm?.Embeds?.process();
        } catch (_) {
          finish(false);
          return;
        }
        wraps.forEach(watchInstagramEmbedFit);
        window.setTimeout(() => finish(true), 4000);
      };
      requestAnimationFrame(() => requestAnimationFrame(run));
    };

    if (window.instgrm?.Embeds?.process) {
      process();
      return;
    }

    const existing = document.querySelector('script[data-eglny-instagram-embed="1"]');
    if (existing) {
      existing.addEventListener("load", process, { once: true });
      existing.addEventListener("error", () => finish(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.instagram.com/embed.js";
    script.dataset.eglnyInstagramEmbed = "1";
    script.addEventListener("load", process, { once: true });
    script.addEventListener("error", () => finish(false), { once: true });
    document.body.appendChild(script);
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
    const roleOpen = Boolean(m.roleOpen || m.open);
    const photo = m.photo;
    const img = photo
      ? `<img class="roster-photo" src="${escapeHtml(photo)}" alt="" width="88" height="88" loading="lazy" />`
      : `<span class="roster-photo roster-photo--placeholder${
          roleOpen ? " roster-photo--open" : ""
        }" aria-hidden="true">${escapeHtml(rosterInitials(m.name))}</span>`;
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
    // Open seats: name stays plain text; "Role open" (status line) is the link.
    const nameHtml =
      m.href && !roleOpen
        ? `<a class="co-chair-name" href="${escapeHtml(m.href)}">${escapeHtml(m.name)}</a>`
        : `<p class="co-chair-name">${escapeHtml(m.name)}</p>`;
    const titleText = m.roleOpenLabel ?? m.title ?? (roleOpen ? "Role open" : "");
    const roleOpenHref = roleOpen ? m.roleOpenHref ?? m.href : null;
    const titleLines = String(titleText)
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    const titleHtml = titleLines.length
      ? titleLines
          .map((line) =>
            roleOpen && roleOpenHref
              ? `<p class="co-chair-title roster-role-open"><a href="${escapeHtml(roleOpenHref)}">${escapeHtml(line)}</a></p>`
              : `<p class="co-chair-title${roleOpen ? " roster-role-open" : ""}">${escapeHtml(line)}</p>`
          )
          .join("")
      : "";
    return `
    <div class="roster-card${roleOpen ? " roster-card--open" : ""}">
      ${avatar}
      <div class="roster-card-text">
        <div class="roster-name-row">
          ${nameHtml}
          ${ig}
        </div>
        ${titleHtml}
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

  function ensureRosterLaneModal() {
    let dialog = document.getElementById("roster-lane-modal");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "roster-lane-modal";
    dialog.className = "roster-lane-modal";
    dialog.innerHTML = `
      <div class="roster-lane-modal-inner">
        <form method="dialog" class="roster-lane-modal-toolbar">
          <h2 class="roster-lane-modal-title"></h2>
          <button type="submit" class="roster-lane-modal-close" aria-label="Close">&times;</button>
        </form>
        <div class="roster-lane-modal-body"></div>
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

    const laneDialog = ensureRosterLaneModal();
    const laneTitle = laneDialog.querySelector(".roster-lane-modal-title");
    const laneBody = laneDialog.querySelector(".roster-lane-modal-body");

    root.querySelectorAll(".roster-lane-interest[data-roster-lane]").forEach((button) => {
      if (button.dataset.rosterLaneBound === "1") return;
      button.dataset.rosterLaneBound = "1";
      button.addEventListener("click", () => {
        const key = button.getAttribute("data-roster-lane");
        const template = Array.from(root.querySelectorAll("template.roster-lane-full")).find(
          (el) => el.getAttribute("data-roster-lane") === key,
        );
        if (!template || !laneBody || !laneTitle) return;
        laneTitle.textContent = button.textContent.replace(/^Interested in joining the\s+/i, "").replace(/\?$/, "").trim() || key;
        laneBody.innerHTML = template.innerHTML;
        laneDialog.showModal();
      });
    });
  }

  function renderRosterCredits(credits) {
    const blocks = (credits ?? []).filter((c) => c?.area && (c.names?.length ?? 0) > 0);
    if (!blocks.length) return "";
    return `
      <div class="roster-credits">
        ${blocks
          .map((block) => {
            const names = block.names
              .map((name) => `<li>${escapeHtml(name)}</li>`)
              .join("");
            return `
              <div class="roster-credit-block">
                <h3 class="roster-credit-area">${escapeHtml(block.area)}</h3>
                <ul class="roster-credit-names">${names}</ul>
              </div>`;
          })
          .join("")}
      </div>`;
  }

  function renderLaneBody(lane) {
    if (!lane) return "";
    return lane.layout === "responsibility-list"
      ? renderResponsibilityList(lane.roles)
      : (lane.roles ?? []).map(renderRoleCard).join("");
  }

  function renderLaneInterestCta(lane) {
    if (!lane) return "";
    const teamName = lane.joinTeamName ?? lane.title;
    const label = `Interested in joining the ${teamName} Team?`;
    return `<p class="roster-lane-interest-wrap"><button type="button" class="roster-lane-interest" data-roster-lane="${escapeHtml(lane.id)}" aria-haspopup="dialog">${escapeHtml(label)}</button></p>`;
  }

  function renderLaneModalTemplate(site, lane) {
    if (!lane) return "";
    const layoutClass = lane.layout === "responsibility-list" ? " lane-section--list" : "";
    return `
      <template class="roster-lane-full" data-roster-lane="${escapeHtml(lane.id)}">
        <div class="lane-section${layoutClass} roster-lane-modal-lane">
          <div class="lane-header">
            <p><strong>${escapeHtml(lane.subtitle)}</strong>${
              lane.intro ? ` — ${escapeHtml(lane.intro)}` : ""
            }</p>
          </div>
          ${renderLaneBody(lane)}
        </div>
        <div class="roster-lane-modal-apply">
          <h3>Apply &amp; get involved</h3>
          <p>${escapeHtml(
            site.teamPage?.join?.applyNote ??
              "Name the role or vision you’re interested in, then apply on Idealist.",
          )}</p>
          ${renderApplyBlock(site)}
        </div>
      </template>`;
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

    const sections = groups
      .map((group) => {
        const members = group.members ?? [];
        const creditsHtml = renderRosterCredits(group.credits);
        const lane = findLaneById(site, group.laneId);
        if (!members.length && !creditsHtml && !lane) return "";
        const id = group.title ? slugifyHeading(group.title) : "roster";
        const heading = group.title
          ? `<h2>${escapeHtml(group.title)}</h2>`
          : `<h2>${escapeHtml(roster.title ?? "Team")}</h2>`;
        const blurb = lane?.teamBlurb
          ? `<p class="roster-lane-blurb">${escapeHtml(lane.teamBlurb)}</p>`
          : "";
        const cards = members.map(renderRosterMemberCard).join("");
        const grid = cards
          ? `<div class="co-chairs roster-grid">${cards}</div>`
          : "";
        return `
          <section class="content-section ls-doc-section" id="${escapeHtml(id)}" data-doc-section>
            ${heading}
            ${blurb}
            ${grid}
            ${creditsHtml}
            ${renderLaneInterestCta(lane)}
          </section>`;
      })
      .filter(Boolean)
      .join("");

    const templates = (site.lanes ?? []).map((lane) => renderLaneModalTemplate(site, lane)).join("");
    return `${sections}${templates}`;
  }

  function renderRosterPage(site) {
    const faqHtml = `
          <section class="content-section ls-doc-section" id="faq" data-doc-section>
            <h2>FAQ</h2>
            ${renderFaqBlock(site)}
          </section>`;
    const mainHtml = `${renderRosterSection(site)}${renderApplySection(site)}${faqHtml}`;
    const toc = buildRosterToc(site);
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
      ? `<a class="ls-btn ls-btn--primary btn btn-primary" href="${escapeHtml(idealist)}" target="_blank" rel="noopener">${escapeHtml(idealistLabel)}</a>`
      : "";
    return `
          <section class="content-section ls-doc-section" id="get-involved" data-doc-section>
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
                  ? `<a class="ls-btn ls-btn--secondary btn btn-secondary" href="${escapeHtml(join.rolesHref)}">${escapeHtml(join.rolesCtaLabel ?? "Browse open seats")}</a>`
                  : ""
              }
              ${
                join.skillsHref && (site.teamPage?.skillsProjects?.projects?.length ?? 0) > 0
                  ? `<a class="ls-btn ls-btn--secondary btn btn-secondary" href="${escapeHtml(join.skillsHref)}">${escapeHtml(join.skillsCtaLabel ?? "Browse small projects")}</a>`
                  : ""
              }
              <a class="ls-btn ls-btn--tertiary btn btn-tertiary" href="${mailto}">Email ${escapeHtml(contactEmail)}</a>
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
      ? `<p class="cta-row"><a class="ls-btn ls-btn--tertiary btn btn-tertiary" href="${escapeHtml(join.discordHref)}"${externalLinkAttrs(join.discordHref)}>${escapeHtml(join.discordLabel ?? "Join the Discord")}</a></p>`
      : "";

    return `
          <section class="content-section ls-doc-section" id="apply" data-doc-section>
            <h2>Apply &amp; get involved</h2>
            <h3>Apply to an open role</h3>
            <p>${escapeHtml(join.applyNote ?? "Apply on Idealist — name the role or vision you’re interested in.")}</p>
            ${renderApplyBlock(site)}
            <div class="apply-side-paths">
              <div class="apply-side-path">
                <h3>Attend Zoom calls</h3>
                <p>${escapeHtml(join.zoom ?? "Weekly Zoom production calls are Tuesdays at 6:30 PM.")}</p>
                <p class="cta-row"><a class="ls-btn ls-btn--tertiary btn btn-tertiary" href="${mailtoGuest}">Email ${escapeHtml(contactEmail)}</a></p>
              </div>
              <div class="apply-side-path">
                <h3>Join Discord</h3>
                ${join.discordNote ? `<p>${escapeHtml(join.discordNote)}</p>` : ""}
                ${discordBtn}
              </div>
            </div>
          </section>`;
  }

  function renderJoinPage(site) {
    const mainHtml = `
          ${renderJoinSection(site)}
          <section class="content-section ls-doc-section" id="faq" data-doc-section>
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
    const lanesHtml = (site.lanes ?? []).map(renderLaneSection).join("");

    const mainHtml = `
          ${renderApplySection(site)}
          <section class="content-section ls-doc-section" id="faq" data-doc-section>
            <h2>FAQ</h2>
            ${renderFaqBlock(site)}
          </section>
          ${lanesHtml}`;

    return wrapDocLayout(renderDocToc(buildOpenRolesToc(site)), mainHtml);
  }

  /** @deprecated Prefer renderOpenRolesPage */
  function renderDirectorRolesPage(site) {
    return renderOpenRolesPage(site);
  }

  function formatBriefProse(text) {
    return escapeHtml(text ?? "")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((\/[^)\s]+|mailto:[^)\s]+)\)/g, '<a href="$2">$1</a>');
  }

  function renderBriefTable(table) {
    if (!table?.headers?.length) return "";
    const head = table.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
    const body = (table.rows ?? [])
      .map((row) => `<tr>${row.map((cell) => `<td>${formatBriefProse(cell)}</td>`).join("")}</tr>`)
      .join("");
    return `<div class="site-doc-table-wrap"><table class="site-doc-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  /** True when inventory JSON encodes no seats left (numeric 0 or string "0" after trim). */
  function isZeroRemainingInventoryValue(raw) {
    if (raw === null || raw === undefined) return false;
    if (typeof raw === "number") return Number.isFinite(raw) && raw === 0;
    return String(raw).trim() === "0";
  }

  /** Fee cell that means reserved / not for sale — Remaining 0 must not imply waitlist. */
  function isNaWeekendFeeInventoryValue(raw) {
    const text = String(Array.isArray(raw) ? raw[0] : raw ?? "")
      .trim()
      .toLowerCase()
      .replace(/\./g, "");
    return text === "n/a" || text === "na";
  }

  /**
   * Booth inventory table — display only. # of spots / Remaining come from vendors-booths.json
   * table cells as author-set literals; never compute them here from caps or fill counts.
   * Appends “(waitlist open)” when the Remaining cell is literally 0 — unless Weekend fee is N/A (reserved).
   * Desktop: table. Mobile: cards with booth type title, spots/remaining row, then weekend fee full-width.
   */
  function renderInventoryTable(table) {
    if (!table?.headers?.length) return "";
    const headers = table.headers;
    const remainingCol = headers.findIndex((h) => String(h ?? "").trim().toLowerCase() === "remaining");
    const feeCol = headers.findIndex((h) => {
      const label = String(h ?? "").trim().toLowerCase();
      return label === "weekend fee" || label === "fee";
    });
    /**
     * String, or string[] for multi-line cells.
     * Fee column on the first 3 rows only: booth fee first; extra lines behind collapsed “See other expenses”.
     * Other multi-line fee cells keep the full stack expanded.
     */
    const formatCell = (cell, i, row, rowIndex = 0) => {
      const lines = Array.isArray(cell) ? cell : [cell];
      const remainingRaw = Array.isArray(cell) ? cell[0] : cell;
      const feeRaw = feeCol >= 0 ? row?.[feeCol] : null;
      const suffix =
        remainingCol >= 0 &&
        i === remainingCol &&
        isZeroRemainingInventoryValue(remainingRaw) &&
        !isNaWeekendFeeInventoryValue(feeRaw)
          ? ` ${escapeHtml("(waitlist open)")}`
          : "";
      if (i === feeCol && lines.length > 1) {
        const collapseBreakdown = rowIndex < 3;
        if (collapseBreakdown) {
          // Keep leading booth-fee lines visible (e.g. $150 snacks + $500 corporate); collapse deposits / TFF / COI.
          let primaryCount = 1;
          while (
            primaryCount < lines.length &&
            /\bbooth fee\b/i.test(String(lines[primaryCount] ?? ""))
          ) {
            primaryCount += 1;
          }
          const primary = lines
            .slice(0, primaryCount)
            .map(
              (line, idx) =>
                `<div class="inventory-fee-line${idx === 0 ? " inventory-fee-line--primary" : ""}">${formatBriefProse(line)}</div>`
            )
            .join("");
          const rest = lines.slice(primaryCount);
          if (!rest.length) {
            return `<div class="inventory-fee-stack">${primary}</div>`;
          }
          const breakdown = rest
            .map((line) => `<div class="inventory-fee-line">${formatBriefProse(line)}</div>`)
            .join("");
          return `<div class="inventory-fee-stack">${primary}<details class="inventory-fee-details"><summary class="inventory-fee-details-toggle"><span class="inventory-fee-details-show">See other expenses</span><span class="inventory-fee-details-hide">Hide other expenses</span></summary><div class="inventory-fee-breakdown">${breakdown}</div></details></div>`;
        }
        return `<div class="inventory-fee-stack">${lines
          .map((line) => `<div class="inventory-fee-line">${formatBriefProse(line)}</div>`)
          .join("")}</div>`;
      }
      const primary = formatBriefProse(lines[0] ?? "");
      const notes = lines
        .slice(1)
        .map((line) => `<span class="inventory-cell-note">${formatBriefProse(line)}</span>`)
        .join("");
      return `${primary}${suffix}${notes}`;
    };
    const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
    const body = (table.rows ?? [])
      .map((row, rowIndex) => {
        const cells = (row ?? []).map((cell, i) => `<td>${formatCell(cell, i, row, rowIndex)}</td>`);
        return `<tr>${cells.join("")}</tr>`;
      })
      .join("");
    const cards = (table.rows ?? [])
      .map((row, rowIndex) => {
        const cells = row ?? [];
        const title = formatCell(cells[0] ?? "", 0, row, rowIndex);
        const compactMetrics = headers
          .slice(1)
          .map((label, offset) => {
            const i = offset + 1;
            if (i === feeCol) return "";
            return `<div class="inventory-metric"><span class="inventory-metric-label">${escapeHtml(label)}</span><span class="inventory-metric-value">${formatCell(cells[i] ?? "", i, row, rowIndex)}</span></div>`;
          })
          .join("");
        const feeHtml =
          feeCol >= 0
            ? `<div class="inventory-metric inventory-metric--fee"><span class="inventory-metric-label">${escapeHtml(headers[feeCol])}</span><span class="inventory-metric-value">${formatCell(cells[feeCol] ?? "", feeCol, row, rowIndex)}</span></div>`
            : "";
        return `<article class="inventory-card"><h3 class="inventory-card-title">${title}</h3><div class="inventory-card-metrics">${compactMetrics}</div>${feeHtml}</article>`;
      })
      .join("");
    return `<div class="inventory-display">
      <div class="site-doc-table-wrap inventory-table"><table class="site-doc-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
      <div class="inventory-cards" aria-label="Booth inventory">${cards}</div>
    </div>`;
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
    const spaced = bullets.length > 3 ? " brief-bullets--spaced" : "";
    return `<ul class="brief-bullets${spaced}">${bullets
      .map((b) => `<li>${formatBriefProse(typeof b === "string" ? b : b.text ?? "")}</li>`)
      .join("")}</ul>`;
  }

  function renderVendorRfpSection(section) {
    const paragraphs = (section.paragraphs ?? []).map((p) => `<p>${formatBriefProse(p)}</p>`).join("");
    return `
      <section class="content-section ls-doc-section" id="${escapeHtml(section.id)}" data-doc-section>
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
      <section class="content-section ls-doc-section" id="${escapeHtml(contact.id ?? "contact")}" data-doc-section>
        <h2>${escapeHtml(contact.title ?? "Submit a proposal")}</h2>
        ${contact.intro ? `<p>${formatBriefProse(contact.intro)}</p>` : ""}
        <p><a class="ls-btn ls-btn--primary btn btn-primary" href="${escapeHtml(mailto)}">${escapeHtml(label)}</a></p>
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
    <section id="${escapeHtml(sectionId)}" class="ls-doc-section host-diy-section" data-host-section data-path="diy">
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
    <section id="${escapeHtml(sectionId)}" class="ls-doc-section host-help-section" data-host-section data-path="help">
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
      <button type="button" class="ls-btn ls-btn--secondary btn btn-secondary" data-host-prompt="diy">${escapeHtml(diy.label)}</button>
      <button type="button" class="ls-btn ls-btn--secondary btn btn-secondary" data-host-prompt="help">${escapeHtml(help.label)}</button>
      <a class="host-prompt-vendor" href="${escapeHtml(vendorHref)}">${escapeHtml(vendor.label)}</a>
    </div>`;
  }

  function renderHostToc(tocItems) {
    const links = (tocItems ?? [])
      .map(
        (item) =>
          `<a class="ls-doc-toc-link" href="#${escapeHtml(item.id)}" data-toc-target="${escapeHtml(item.id)}">${escapeHtml(item.label)}</a>`,
      )
      .join("");
    return `<nav class="ls-doc-toc host-doc-toc" aria-label="On this page"><p class="ls-doc-toc-label">On this page</p>${links}</nav>`;
  }

  function renderHostApplyBlock(hostApply, prominent) {
    const formUrl = hostApply.formUrl ?? "";
    const formLabel = hostApply.formLabel ?? "Fill out the inquiry form";
    const mailto = hostApply.email
      ? `mailto:${hostApply.email}?subject=${encodeURIComponent(hostApply.emailSubject ?? "LNY 2027 — custom zone inquiry")}`
      : "";
    const primary = mailto
      ? `<a class="ls-btn ls-btn--primary btn btn-primary" id="host-contact-email" href="${mailto}">Email ${escapeHtml(hostApply.email)}</a>`
      : formUrl
        ? `<a class="ls-btn ls-btn--primary btn btn-primary" id="host-contact-form" href="${escapeHtml(formUrl)}">${escapeHtml(formLabel)}</a>`
        : "";
    const secondary =
      mailto && formUrl
        ? `<a class="ls-btn ls-btn--secondary btn btn-secondary" id="host-contact-form" href="${escapeHtml(formUrl)}">${escapeHtml(formLabel)}</a>`
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
            /\bTeam\b/,
            '<a href="/team/">Team</a>',
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

    <div class="ls-doc-layout" data-ls-toc-drawer>
      ${renderHostToc(ha.toc)}
      <div class="ls-doc-main host-doc-main">
        <section id="examples" class="ls-doc-section" data-host-section>
          <h2>${escapeHtml(ha.storiesSection?.title ?? "Examples")}</h2>
          <p class="muted">${escapeHtml(ha.storiesSection?.intro ?? "")}</p>
          <div class="host-story-grid">${featuredHtml}</div>
        </section>

        ${renderDiySection(ha.diySection, catalog)}
        ${renderHelpSection(ha.helpSection, ha, catalog)}

        <section id="contact" class="ls-doc-section" data-host-section>
          <h2>${escapeHtml(ha.apply?.title ?? "Email us to start")}</h2>
          ${renderHostApplyBlock(ha.apply, true)}
        </section>

        <section id="faq" class="ls-doc-section" data-host-section>
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
    const backHref = rfp?.backHref ?? "/team/";
    const backLabel = rfp?.backLabel ?? "← Team";
    const main =
      sections.map(renderVendorRfpSection).join("") + renderVendorRfpContact(contact);
    return `
      <section class="hero">
        <p class="hero-back"><a href="${escapeHtml(backHref)}">${escapeHtml(backLabel)}</a></p>
        <h1>${escapeHtml(rfp?.headline ?? "Vendor RFP")}</h1>
        ${status}
        ${rfp?.lead ? `<p class="hero-lead">${escapeHtml(rfp.lead)}</p>` : ""}
        ${related}
      </section>
      ${wrapDocLayout(
        renderDocToc(toc, {
          backHref,
          backLabel,
        }),
        main,
      )}`;
  }

  function renderVendorsBoothsPage(page) {
    const waitlist = page?.waitlist ?? {};
    const inventory = page?.inventory ?? {};
    const fees = page?.fees ?? {};
    const restrictions = page?.restrictions ?? {};
    const criteria = page?.criteria ?? {};
    const timeline = page?.timeline ?? {};
    const hasInventory = Boolean(inventory.title || inventory.table?.rows?.length);
    const hasFees = Boolean(fees.title || fees.notes?.length || fees.sections?.length);
    const hasRestrictions = Boolean(
      restrictions.title || restrictions.deny?.length || restrictions.sales?.length,
    );
    const hasCriteria = Boolean(criteria.title || criteria.factors?.rows?.length);
    const applyPaths = waitlist.paths ?? [];
    const tocItems = [
      { id: waitlist.id ?? "waitlist", label: waitlist.tocLabel ?? waitlist.title ?? "Apply" },
      ...(hasInventory
        ? [{ id: inventory.id ?? "inventory", label: inventory.tocLabel ?? inventory.title ?? "Inventory" }]
        : []),
      ...(hasFees
        ? [{ id: fees.id ?? "fees", label: fees.tocLabel ?? fees.title ?? "Fees & terms" }]
        : []),
      ...(hasRestrictions
        ? [
            {
              id: restrictions.id ?? "restrictions",
              label: restrictions.tocLabel ?? restrictions.title ?? "Restrictions",
            },
          ]
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
        ${round.note ? `<p>${formatBriefProse(round.note)}</p>` : ""}
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

    const applyPathCards = applyPaths
      .map((link) => {
        const isEventeny = Boolean(link.external);
        const href = isEventeny && waitlist.cta?.href ? waitlist.cta.href : link.href;
        const label = isEventeny
          ? (waitlist.cta?.label ?? "Apply on Eventeny")
          : (link.ctaLabel ?? "Learn more");
        const btnClass = isEventeny ? "ls-btn ls-btn--primary btn btn-primary" : "ls-btn ls-btn--secondary btn btn-secondary";
        const external = isEventeny ? ' target="_blank" rel="noopener"' : "";
        return `
      <article class="resource-card">
        <h3>${escapeHtml(link.title)}</h3>
        ${link.body ? `<p>${escapeHtml(link.body)}</p>` : ""}
        ${link.accent ? `<p class="vendors-round-open">${escapeHtml(link.accent)}</p>` : ""}
        <p class="resource-card-cta"><a class="${btnClass}" href="${escapeHtml(href)}"${external}>${escapeHtml(label)}</a></p>
      </article>`;
      })
      .join("");

    const waitlistCta =
      !applyPaths.length && waitlist.cta?.href
        ? `${
            waitlist.cta.note
              ? `<p class="muted vendors-waitlist-note">${formatBriefProse(waitlist.cta.note)}</p>`
              : ""
          }<p class="vendors-waitlist-cta"><a class="ls-btn ls-btn--primary btn btn-primary" href="${escapeHtml(waitlist.cta.href)}" target="_blank" rel="noopener">${escapeHtml(waitlist.cta.label ?? "Join the vendor waitlist")}</a></p>`
        : waitlist.cta?.note && applyPaths.length
          ? `<p class="muted vendors-waitlist-note">${formatBriefProse(waitlist.cta.note)}</p>`
          : "";

    const inventoryHtml = hasInventory
      ? `<section class="content-section ls-doc-section" id="${escapeHtml(inventory.id ?? "inventory")}" data-doc-section>
        <h2>${escapeHtml(inventory.title ?? "Booth inventory")}</h2>
        ${inventory.intro ? `<p>${formatBriefProse(inventory.intro)}</p>` : ""}
        ${renderInventoryTable(inventory.table)}
        ${renderBriefBullets(inventory.notes)}
        ${inventory.footnote ? `<p class="muted">${formatBriefProse(inventory.footnote)}</p>` : ""}
      </section>`
      : "";

    const feesSectionsHtml = (fees.sections ?? [])
      .map((section) => {
        const bodies = []
          .concat(section.body ?? [])
          .filter(Boolean)
          .map((p) => `<p>${formatBriefProse(p)}</p>`)
          .join("");
        const after = []
          .concat(section.after ?? [])
          .filter(Boolean)
          .map((p) => `<p>${formatBriefProse(p)}</p>`)
          .join("");
        return `
        <h3 class="booth-path-heading">${escapeHtml(section.title)}</h3>
        ${bodies}
        ${section.bullets?.length ? renderBriefBullets(section.bullets) : ""}
        ${after}`;
      })
      .join("");

    const feesHtml = hasFees
      ? `<section class="content-section ls-doc-section" id="${escapeHtml(fees.id ?? "fees")}" data-doc-section>
        <h2>${escapeHtml(fees.title ?? "Fees and terms")}</h2>
        ${fees.intro ? `<p>${formatBriefProse(fees.intro)}</p>` : ""}
        ${feesSectionsHtml || renderBriefBullets(fees.notes)}
        ${fees.footnote ? `<p class="muted">${formatBriefProse(fees.footnote)}</p>` : ""}
      </section>`
      : "";

    const restrictionsHtml = hasRestrictions
      ? `<section class="content-section ls-doc-section" id="${escapeHtml(restrictions.id ?? "restrictions")}" data-doc-section>
        <h2>${escapeHtml(restrictions.title ?? "Restrictions")}</h2>
        ${
          restrictions.deny?.length
            ? `<h3 class="booth-path-heading">${escapeHtml(restrictions.denyTitle ?? "We do not accept")}</h3>
        ${restrictions.denyIntro ? `<p>${formatBriefProse(restrictions.denyIntro)}</p>` : ""}
        ${renderBriefBullets(restrictions.deny)}`
            : ""
        }
        ${
          restrictions.sales?.length
            ? `<h3 class="booth-path-heading">${escapeHtml(restrictions.salesTitle ?? "Prohibited sales items")}</h3>
        ${restrictions.salesIntro ? `<p>${formatBriefProse(restrictions.salesIntro)}</p>` : ""}
        ${renderBriefBullets(restrictions.sales)}`
            : ""
        }
        ${restrictions.footnote ? `<p class="muted">${formatBriefProse(restrictions.footnote)}</p>` : ""}
      </section>`
      : "";

    const criteriaHtml = hasCriteria
        ? `<section class="content-section ls-doc-section" id="${escapeHtml(criteria.id ?? "criteria")}" data-doc-section>
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
      </section>`
        : "";

    const waitlistWarningHtml = waitlist.warning
      ? `<aside class="vendors-official-notice" role="note">
        <p>${formatBriefProse(waitlist.warning)}</p>
      </aside>`
      : "";

    const mainHtml = `
      <section class="content-section ls-doc-section" id="${escapeHtml(waitlist.id ?? "waitlist")}" data-doc-section>
        ${waitlistWarningHtml}
        <h2>${escapeHtml(waitlist.title ?? "Apply for single booth or an entire zone")}</h2>
        ${waitlist.partnerIntro ? `<p>${formatBriefProse(waitlist.partnerIntro)}</p>` : ""}
        ${
          applyPathCards
            ? `<div class="resource-card-grid vendors-apply-paths">${applyPathCards}</div>`
            : ""
        }
        ${
          waitlist.bodyAfter
            ? `<p class="vendors-apply-after">${formatBriefProse(waitlist.bodyAfter)}</p>`
            : waitlist.body
              ? `<p class="vendors-apply-after">${formatBriefProse(waitlist.body)}</p>`
              : ""
        }
        ${waitlistCta}
      </section>
      ${inventoryHtml}
      ${feesHtml}
      ${restrictionsHtml}
      <section class="content-section ls-doc-section" id="${escapeHtml(timeline.id ?? "timeline")}" data-doc-section>
        <h2>${escapeHtml(timeline.title ?? "How selection works")}</h2>
        ${timeline.intro ? `<p>${formatBriefProse(timeline.intro)}</p>` : ""}
        <div class="booth-rounds-grid">${roundsHtml}</div>
        <h3 class="booth-path-heading">${escapeHtml(timeline.pathTitle ?? "Your path after you apply")}</h3>
        ${timeline.pathIntro ? `<p>${formatBriefProse(timeline.pathIntro)}</p>` : ""}
        <ul class="booth-flow-list">${flowHtml}</ul>
        ${timeline.footnote ? `<p class="muted">${formatBriefProse(timeline.footnote)}</p>` : ""}
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
    const redirect = index?.redirect;
    if (redirect) {
      return `
      <section class="hero">
        <h1>${escapeHtml(index?.headline ?? "RFPs")}</h1>
        ${index?.lead ? `<p class="hero-lead">${escapeHtml(index.lead)}</p>` : ""}
        <p><a class="ls-btn ls-btn--primary btn btn-primary" href="${escapeHtml(redirect)}">Go to Team</a></p>
      </section>`;
    }
    const lots = (index?.lots ?? [])
      .map(
        (lot) => `
      <a class="resource-card" href="${escapeHtml(lot.href)}">
        <h3>${escapeHtml(lot.title)}</h3>
        ${lot.summary ? `<p>${escapeHtml(lot.summary)}</p>` : ""}
      </a>`,
      )
      .join("");
    const tocItems = lots ? [{ id: "lots", label: "Open lots" }] : [];
    const mainHtml = lots
      ? `
      <section class="content-section ls-doc-section" id="lots" data-doc-section aria-labelledby="lots-heading">
        <h2 id="lots-heading">Open lots</h2>
        <div class="resource-card-grid">${lots}</div>
        ${index?.note ? `<p class="muted">${escapeHtml(index.note)}</p>` : ""}
      </section>`
      : index?.note
        ? `<section class="content-section"><p class="muted">${escapeHtml(index.note)}</p></section>`
        : "";
    return `
      <section class="hero">
        <h1>${escapeHtml(index?.headline ?? "RFPs")}</h1>
        ${index?.lead ? `<p class="hero-lead">${escapeHtml(index.lead)}</p>` : ""}
      </section>
      ${mainHtml ? wrapDocLayout(renderDocToc(tocItems), mainHtml) : ""}`;
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

  /** History JSON is public prose. Only [label](https://…|/path) becomes a link — no *italic* or **bold**. */
  function formatHistoryText(text) {
    return escapeHtml(String(text ?? "")).replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)/g,
      (match, label, href) => {
        const external = href.startsWith("http");
        const extra = external ? ' target="_blank" rel="noopener"' : "";
        return `<a href="${escapeHtml(href)}"${extra}>${label}</a>`;
      },
    );
  }

  function renderHistoryPoster(poster) {
    if (!poster?.src) return "";
    const prefix = navPrefix();
    const src = /^https?:\/\//i.test(poster.src) ? poster.src : `${prefix}${poster.src}`;
    const alt = poster.alt ?? "Festival poster";
    return `
      <figure class="history-poster poster-card">
        <button type="button" class="history-poster-open" style="background-image: url('${escapeHtml(src)}')" data-lightbox-src="${escapeHtml(src)}" data-lightbox-alt="${escapeHtml(alt)}" aria-label="View ${escapeHtml(alt)}">
          <img class="poster-image" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" />
        </button>
      </figure>`;
  }

  function ensureHistoryLightbox() {
    let dialog = document.getElementById("history-poster-lightbox");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "history-poster-lightbox";
    dialog.className = "history-lightbox";
    dialog.setAttribute("aria-label", "Festival poster");
    dialog.innerHTML = `
      <button type="button" class="history-lightbox-close" aria-label="Close">&times;</button>
      <img class="history-lightbox-image" alt="" />`;
    document.body.appendChild(dialog);

    const img = dialog.querySelector(".history-lightbox-image");
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.querySelector(".history-lightbox-close")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => {
      if (img) {
        img.removeAttribute("src");
        img.alt = "";
      }
    });
    return dialog;
  }

  function initHistoryLightbox(root = document) {
    const dialog = ensureHistoryLightbox();
    const img = dialog.querySelector(".history-lightbox-image");

    root.querySelectorAll(".history-poster-open").forEach((button) => {
      if (button.dataset.lightboxBound === "1") return;
      button.dataset.lightboxBound = "1";
      button.addEventListener("click", () => {
        const src = button.getAttribute("data-lightbox-src");
        const alt = button.getAttribute("data-lightbox-alt") || "Festival poster";
        if (!src || !img) return;
        img.src = src;
        img.alt = alt;
        dialog.showModal();
      });
    });
  }

  function renderHistoryVideoCard(video) {
    const kind = video?.kind || "youtube";
    if (kind === "instagram") {
      const href = instagramPermalink(video.href);
      if (!href) return "";
      const title = video.title ?? "Festival video";
      const poster = String(video.poster ?? "").trim();
      const posterSrc = poster && !/^https?:\/\//i.test(poster) ? `${navPrefix()}${poster}` : poster;
      const fallbackInner = posterSrc
        ? `<img class="video-poster" src="${escapeHtml(posterSrc)}" alt="" width="326" height="580" loading="lazy" />
           <span class="video-play-icon" aria-hidden="true"></span>
           <span class="video-play-badge video-play-badge--instagram">Instagram</span>
           <span class="video-fallback-link">Watch recap on Instagram</span>`
        : `<span class="video-fallback-link">Watch recap on Instagram</span>`;
      return `
      <figure class="video-card video-card--instagram">
        <div class="video-embed-instagram">
          <blockquote
            class="instagram-media"
            data-instgrm-permalink="${escapeHtml(href)}"
            data-instgrm-version="14"
          >
            <a href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(title)}</a>
          </blockquote>
          <a class="instagram-embed-fallback" href="${escapeHtml(href)}" target="_blank" rel="noopener" aria-label="Watch recap on Instagram: ${escapeHtml(title)}">
            ${fallbackInner}
          </a>
        </div>
        <figcaption class="video-caption">${escapeHtml(title)}</figcaption>
      </figure>`;
    }
    if (kind === "facebook") {
      const href = String(video.href ?? "").trim();
      if (!href) return "";
      const title = video.title ?? "Festival video";
      const pluginSrc = String(video.pluginSrc ?? "").trim();
      const width = Number(video.width);
      const height = Number(video.height);
      if (pluginSrc && width && height) {
        const portrait = height > width;
        return `
      <figure class="video-card${portrait ? " video-card--portrait" : ""}">
        <div class="video-embed video-embed--facebook${portrait ? " video-embed--facebook-portrait" : ""}">
          <iframe
            src="${escapeHtml(pluginSrc)}"
            width="${width}"
            height="${height}"
            style="border:none;overflow:hidden"
            scrolling="no"
            frameborder="0"
            allowfullscreen="true"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen="true"
            title="${escapeHtml(title)}"
          ></iframe>
          <a class="video-fallback-link" href="${escapeHtml(href)}" target="_blank" rel="noopener">Watch on Facebook</a>
        </div>
        <figcaption class="video-caption">${escapeHtml(title)}</figcaption>
      </figure>`;
      }
      const embedSrc = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(href)}&show_text=false&width=560`;
      return `
      <figure class="video-card">
        <div class="video-embed video-embed--facebook" data-embed-src="${escapeHtml(embedSrc)}">
          <button type="button" class="video-play" aria-label="Play ${escapeHtml(title)}">
            <span class="video-play-icon" aria-hidden="true"></span>
            <span class="video-play-badge">Facebook</span>
          </button>
          <a class="video-fallback-link" href="${escapeHtml(href)}" target="_blank" rel="noopener">Watch on Facebook</a>
        </div>
        <figcaption class="video-caption">${escapeHtml(title)}</figcaption>
      </figure>`;
    }
    return renderMediaVideoCard({
      youtubeId: video.id ?? video.youtubeId,
      title: video.title,
    });
  }

  function isInstagramHistoryVideo(video) {
    return (video?.kind || "youtube") === "instagram";
  }

  function isHistoryCarousel(video) {
    return video?.kind === "carousel" || Array.isArray(video?.items);
  }

  function historyVideoUnits(videoList) {
    return (videoList ?? [])
      .map((video) => {
        const items = isHistoryCarousel(video) ? video.items ?? [] : null;
        if (items && items.length > 1) {
          return { carousel: true, title: video.title, items, isIg: false };
        }
        const item = items?.length === 1 ? items[0] : video;
        return { carousel: false, item, isIg: isInstagramHistoryVideo(item) };
      })
      .filter((unit) => (unit.carousel ? unit.items.length : unit.item));
  }

  let historyCarouselSeq = 0;

  function historyCarouselChevron(dir) {
    const d = dir === "prev" ? "M10 4 L6 8 L10 12" : "M6 4 L10 8 L6 12";
    return `<svg class="video-carousel-chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function renderHistoryCarousel(unit) {
    const items = unit.items.filter((item) => (item?.kind || "youtube") === "youtube" && (item.id || item.youtubeId));
    if (items.length < 2) {
      return items[0] ? renderHistoryVideoCard(items[0]) : "";
    }
    const carouselId = `history-carousel-${++historyCarouselSeq}`;
    const groupTitle = unit.title || items[0].title || "Festival videos";
    const slides = items
      .map((item, index) => {
        const id = String(item.id ?? item.youtubeId ?? "").trim();
        const title = item.title || groupTitle;
        return `
        <div class="video-carousel-slide${index === 0 ? " is-active" : ""}" data-slide="${index}" data-slide-title="${escapeHtml(title)}" ${index === 0 ? "" : "hidden"}>
          ${renderYoutubeEmbed(id, title)}
        </div>`;
      })
      .join("");
    const dots = items
      .map(
        (item, index) =>
          `<button type="button" class="video-carousel-dot${index === 0 ? " is-active" : ""}" data-slide-to="${index}" aria-label="Show video ${index + 1} of ${items.length}" aria-selected="${index === 0 ? "true" : "false"}"></button>`,
      )
      .join("");
    const firstTitle = items[0].title || groupTitle;
    return `
      <figure class="video-card video-card--carousel" data-video-carousel id="${escapeHtml(carouselId)}" tabindex="0">
        <div class="video-carousel">
          <div class="video-carousel-viewport">
            ${slides}
          </div>
          <div class="video-carousel-chrome">
            <button type="button" class="video-carousel-nav video-carousel-prev" aria-label="Previous video" aria-controls="${escapeHtml(carouselId)}">
              ${historyCarouselChevron("prev")}
            </button>
            <div class="video-carousel-dots" role="tablist" aria-label="${escapeHtml(groupTitle)}">${dots}</div>
            <button type="button" class="video-carousel-nav video-carousel-next" aria-label="Next video" aria-controls="${escapeHtml(carouselId)}">
              ${historyCarouselChevron("next")}
            </button>
          </div>
        </div>
        <figcaption class="video-caption"><span class="video-carousel-count" data-carousel-count>1 / ${items.length}</span>&nbsp;<span data-carousel-title>${escapeHtml(firstTitle)}</span></figcaption>
      </figure>`;
  }

  function renderHistoryVideoUnit(unit) {
    if (unit.carousel) return renderHistoryCarousel(unit);
    return renderHistoryVideoCard(unit.item);
  }

  function initHistoryCarousels(root = document) {
    root.querySelectorAll("[data-video-carousel]").forEach((card) => {
      if (card.dataset.carouselBound === "1") return;
      card.dataset.carouselBound = "1";
      const slides = [...card.querySelectorAll(".video-carousel-slide")];
      const dots = [...card.querySelectorAll(".video-carousel-dot")];
      const titleEl = card.querySelector("[data-carousel-title]");
      const countEl = card.querySelector("[data-carousel-count]");
      if (slides.length < 2) return;
      let index = 0;

      function setSlide(nextIndex) {
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach((slide, i) => {
          const active = i === index;
          slide.classList.toggle("is-active", active);
          slide.hidden = !active;
          if (!active) {
            slide.querySelectorAll(".video-embed[data-youtube-id]").forEach(restoreYoutubePoster);
          }
        });
        dots.forEach((dot, i) => {
          const active = i === index;
          dot.classList.toggle("is-active", active);
          dot.setAttribute("aria-selected", active ? "true" : "false");
        });
        const title = slides[index].getAttribute("data-slide-title") || "";
        if (titleEl) titleEl.textContent = title;
        if (countEl) countEl.textContent = `${index + 1} / ${slides.length}`;
      }

      card.querySelector(".video-carousel-prev")?.addEventListener("click", () => setSlide(index - 1));
      card.querySelector(".video-carousel-next")?.addEventListener("click", () => setSlide(index + 1));
      dots.forEach((dot) => {
        dot.addEventListener("click", () => {
          const to = Number(dot.getAttribute("data-slide-to"));
          if (!Number.isNaN(to)) setSlide(to);
        });
      });
      card.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          setSlide(index - 1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          setSlide(index + 1);
        }
      });
    });
  }

  function renderHistoryBlock(block) {
    const mafAttr = block.maf ? ' data-maf="1"' : "";
    const idAttr = block.id ? ` id="${escapeHtml(block.id)}"` : "";
    const kicker = block.kicker ? `<p class="history-kicker">${escapeHtml(block.kicker)}</p>` : "";
    const heading = block.title ? `<h3 class="history-block-title">${escapeHtml(block.title)}</h3>` : "";
    const paras = (block.paragraphs ?? []).map((p) => `<p>${formatHistoryText(p)}</p>`).join("");
    const copy = `<div class="history-year-copy">${kicker}${heading}${paras}</div>`;
    const poster = renderHistoryPoster(block.poster);
    const units = historyVideoUnits(block.videos);
    const igCards = units.filter((u) => u.isIg).map(renderHistoryVideoUnit).filter(Boolean);
    const otherCards = units.filter((u) => !u.isIg).map(renderHistoryVideoUnit).filter(Boolean);
    const videoCards = [...otherCards, ...igCards];
    const videos = videoCards.join("");

    /* Special case: poster + Instagram share a dedicated two-column row
       (same 1fr 1fr widths as the video grid). YouTube stays out of that row. */
    if (poster && igCards.length) {
      const pair = `
        <div class="video-grid history-video-grid history-poster-ig-row">
          ${poster}
          ${igCards.join("")}
        </div>`;
      if (otherCards.length === 1) {
        return `
      <article class="history-block"${idAttr}${mafAttr}>
        <div class="video-grid history-year-grid">
          ${copy}
          ${otherCards[0]}
        </div>
        ${pair}
      </article>`;
      }
      const extra =
        otherCards.length > 1
          ? `<div class="video-grid history-video-grid">${otherCards.join("")}</div>`
          : "";
      return `
      <article class="history-block"${idAttr}${mafAttr}>
        ${copy}
        ${pair}
        ${extra}
      </article>`;
    }

    if (poster) {
      return `
      <article class="history-block"${idAttr}${mafAttr}>
        <div class="video-grid history-year-grid">
          ${copy}
          ${poster}
          ${videos}
        </div>
      </article>`;
    }
    if (videoCards.length === 1) {
      return `
      <article class="history-block"${idAttr}${mafAttr}>
        <div class="video-grid history-year-grid">
          ${copy}
          ${videos}
        </div>
      </article>`;
    }
    if (videoCards.length > 1) {
      return `
      <article class="history-block"${idAttr}${mafAttr}>
        ${copy}
        <div class="video-grid history-video-grid">${videos}</div>
      </article>`;
    }
    return `
      <article class="history-block"${idAttr}${mafAttr}>
        ${copy}
      </article>`;
  }

  function renderHistoryPage(history) {
    const tocItems = (history.eras ?? []).map((era) => ({
      id: era.id,
      label: era.title,
      maf: era.maf || (era.blocks ?? []).every((b) => b.maf),
    }));

    const erasHtml = (history.eras ?? [])
      .map((era) => {
        const eraMaf = era.maf || (era.blocks ?? []).every((b) => b.maf);
        const mafAttr = eraMaf ? ' data-maf="1"' : "";
        const blocks = (era.blocks ?? []).map(renderHistoryBlock).join("");
        return `
      <section class="content-section ls-doc-section history-era" id="${escapeHtml(era.id)}" data-doc-section${mafAttr}>
        <h2>${escapeHtml(era.title)}</h2>
        ${blocks}
      </section>`;
      })
      .join("");

    const filterId = "history-hide-maf";
    const filterLabel = history.hideMafLabel ?? "Hide Tết Trung Thu";
    const filter = `
      <label class="site-doc-toc-filter" for="${filterId}">
        <input type="checkbox" id="${filterId}" />
        <span>${escapeHtml(filterLabel)}</span>
      </label>
      ${
        history.hideMafHelp
          ? `<p class="ls-sr-only" id="${filterId}-help">${escapeHtml(history.hideMafHelp)}</p>`
          : ""
      }`;

    const cta = history.cta
      ? `<p class="history-cta"><a class="ls-btn ls-btn--primary btn btn-primary" href="${escapeHtml(history.cta.href)}">${escapeHtml(history.cta.label)}</a></p>
         ${history.cta.note ? `<p class="muted">${formatHistoryText(history.cta.note)}</p>` : ""}`
      : "";

    const mainHtml = `
      ${erasHtml}
      <section class="content-section ls-doc-section" id="join-2027" data-doc-section>
        <h2>Still going</h2>
        <p>The park weekend is the civic line we are still building — same corridor pride, a lawn families can walk.</p>
        ${cta}
      </section>`;

    const toc = renderDocToc(
      [
        ...tocItems,
        { id: "join-2027", label: "Still going" },
      ],
      { footHtml: filter },
    );

    return `
      <section class="hero">
        <h1>${escapeHtml(history.headline ?? "History")}</h1>
        ${history.lead ? `<p class="hero-lead">${escapeHtml(history.lead)}</p>` : ""}
      </section>
      ${wrapDocLayout(toc, `<div class="history-page" id="history-page">${mainHtml}</div>`)}`;
  }

  function initHistoryFilter(root = document) {
    const page = root.querySelector("#history-page") || root;
    const checkbox = root.querySelector("#history-hide-maf");
    if (!checkbox) return;

    const apply = (hide) => {
      page.classList.toggle("is-hiding-maf", hide);
      root.querySelectorAll("[data-maf]").forEach((el) => {
        el.hidden = hide;
      });
      root.querySelectorAll(".ls-doc-toc-link").forEach((link) => {
        const target = root.getElementById?.(link.dataset.tocTarget) || document.getElementById(link.dataset.tocTarget);
        if (target?.hasAttribute("data-maf")) {
          link.hidden = hide;
        }
      });
      try {
        sessionStorage.setItem("eglny-history-hide-maf", hide ? "1" : "0");
      } catch (_) {}
      if (window.DocScroll && typeof window.DocScroll.refreshTocPager === "function") {
        window.DocScroll.refreshTocPager();
      }
    };

    let saved = false;
    try {
      saved = sessionStorage.getItem("eglny-history-hide-maf") === "1";
    } catch (_) {}
    checkbox.checked = saved;
    checkbox.setAttribute("aria-describedby", "history-hide-maf-help");
    apply(saved);
    checkbox.addEventListener("change", () => apply(checkbox.checked));
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
    initInstagramEmbeds,
    initRosterMedia,
    renderMediaPage,
    renderHistoryPage,
    initHistoryFilter,
    initHistoryLightbox,
    initHistoryCarousels,
    renderResourcesPage,
    renderLionDanceGroupsPage,
    renderVendorsDirectoryPage,
    renderProductionPage,
    renderActivitySignupsPage,
    initProgrammingFlierShare,
    renderAttendeesPage,
    renderSponsorshipPage,
    renderSponsorTierHtml,
    renderHomeSponsors2027,
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
    linkFirstTeam,
    navPrefix,
  };
})();
