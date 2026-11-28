var LSDS = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/lsds.js
  var lsds_exports = {};
  __export(lsds_exports, {
    closeLightbox: () => closeLightbox,
    initAll: () => initAll,
    initDocScroll: () => initDocScroll,
    initFliers: () => initFliers,
    initHeadingAnchors: () => initHeadingAnchors,
    initLangSwitch: () => initLangSwitch,
    initLightbox: () => initLightbox,
    initNavShell: () => initNavShell,
    initSchemeToggle: () => initSchemeToggle,
    initSheets: () => initSheets,
    initTabs: () => initTabs,
    initTocDrawer: () => initTocDrawer,
    openLightbox: () => openLightbox,
    refreshTocPager: () => refreshTocPager
  });

  // src/patterns/nav-shell/nav-shell.js
  var VALID_SCHEMES = /* @__PURE__ */ new Set(["auto", "light", "dark"]);
  var STORED_SCHEMES = /* @__PURE__ */ new Set(["light", "dark"]);
  function resolvedAppearance(scheme) {
    if (scheme === "light" || scheme === "dark") return scheme;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  function schemeIconSvg(appearance) {
    if (appearance === "dark") {
      return '<svg class="ls-theme-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
    }
    return '<svg class="ls-theme-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
  function initSchemeToggle(root = document, options = {}) {
    const storageKey = options.storageKey || "lsds-scheme";
    const mirrorLegacyAttr = options.mirrorDataTheme !== false;
    const target = document.documentElement;
    const toggles = [...root.querySelectorAll("[data-ls-scheme-toggle]")];
    function loadStored() {
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (STORED_SCHEMES.has(saved)) return saved;
      } catch {
      }
      return target.getAttribute("data-ls-scheme") || options.defaultScheme || "dark";
    }
    function apply(scheme) {
      const next = VALID_SCHEMES.has(scheme) ? scheme : "auto";
      target.setAttribute("data-ls-scheme", next);
      if (mirrorLegacyAttr) {
        target.setAttribute("data-theme", next);
      }
      const appearance = resolvedAppearance(next);
      const labelMap = { auto: "System", light: "Light", dark: "Dark" };
      const label = `Color theme: ${labelMap[next] || "System"}`;
      for (const btn of toggles) {
        btn.innerHTML = `${schemeIconSvg(appearance)}<span class="ls-sr-only">${label}</span>`;
        btn.setAttribute("aria-label", label);
      }
    }
    function setScheme(scheme) {
      const next = STORED_SCHEMES.has(scheme) ? scheme : "auto";
      apply(next);
      try {
        if (STORED_SCHEMES.has(next)) sessionStorage.setItem(storageKey, next);
        else sessionStorage.removeItem(storageKey);
      } catch {
      }
    }
    apply(loadStored());
    for (const btn of toggles) {
      if (btn.dataset.lsSchemeBound) continue;
      btn.dataset.lsSchemeBound = "1";
      btn.addEventListener("click", () => {
        const cur = resolvedAppearance(target.getAttribute("data-ls-scheme") || "auto");
        setScheme(cur === "dark" ? "light" : "dark");
      });
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => {
      if ((target.getAttribute("data-ls-scheme") || "auto") === "auto") {
        apply("auto");
      }
    });
    return { apply, setScheme };
  }
  function initNavShell(root = document) {
    const navs = [...root.querySelectorAll("[data-ls-nav], .ls-nav")];
    const controllers = [];
    for (const nav of navs) {
      let setInert = function(isOpen) {
        for (const el of document.querySelectorAll(inertSelector)) {
          if (!nav.contains(el)) {
            el.inert = isOpen;
          }
        }
      }, setOpen = function(open, trigger = null) {
        if (trigger) lastTrigger = trigger;
        if (desktopQuery.matches) {
          nav.classList.remove("ls-is-open", "is-open");
          toggle.setAttribute("aria-expanded", "false");
          drawer.setAttribute("aria-hidden", "false");
          if (backdrop) {
            backdrop.hidden = true;
            backdrop.setAttribute("aria-hidden", "true");
          }
          document.body.classList.remove("ls-nav-open", "nav-open");
          setInert(false);
          if (srLabel) srLabel.textContent = toggle.dataset.openLabel || "Open menu";
          return;
        }
        const next = Boolean(open);
        nav.classList.toggle("ls-is-open", next);
        nav.classList.toggle("is-open", next);
        toggle.setAttribute("aria-expanded", next ? "true" : "false");
        drawer.setAttribute("aria-hidden", next ? "false" : "true");
        if (backdrop) {
          backdrop.hidden = !next;
          backdrop.setAttribute("aria-hidden", next ? "false" : "true");
        }
        document.body.classList.toggle("ls-nav-open", next);
        document.body.classList.toggle("nav-open", next);
        setInert(next);
        if (srLabel) {
          srLabel.textContent = next ? toggle.dataset.closeLabel || "Close menu" : toggle.dataset.openLabel || "Open menu";
        }
        if (!next && lastTrigger) {
          lastTrigger.focus?.();
          lastTrigger = null;
        }
      };
      if (nav.dataset.lsNavBound) continue;
      nav.dataset.lsNavBound = "1";
      const toggle = nav.querySelector("[data-ls-nav-toggle], .ls-nav-toggle");
      const drawer = nav.querySelector("[data-ls-nav-drawer], .ls-nav-drawer");
      const backdrop = nav.querySelector("[data-ls-nav-backdrop], .ls-nav-backdrop");
      const srLabel = toggle?.querySelector(".ls-sr-only, .sr-only");
      if (!toggle || !drawer) continue;
      const bp = nav.getAttribute("data-ls-nav-breakpoint") || "880px";
      const desktopQuery = window.matchMedia(`(min-width: ${bp})`);
      const inertSelector = nav.getAttribute("data-ls-nav-inert") || "main";
      let lastTrigger = null;
      toggle.addEventListener("click", () => {
        setOpen(!nav.classList.contains("ls-is-open"), toggle);
      });
      backdrop?.addEventListener("click", () => setOpen(false));
      nav.querySelectorAll(".ls-nav-links a, .ls-nav-drawer-footer a").forEach((link) => {
        link.addEventListener("click", () => setOpen(false));
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && nav.classList.contains("ls-is-open")) {
          event.preventDefault();
          setOpen(false);
        }
      });
      desktopQuery.addEventListener("change", (event) => {
        if (event.matches) setOpen(false);
      });
      if (desktopQuery.matches) {
        drawer.setAttribute("aria-hidden", "false");
      }
      controllers.push({ nav, setOpen, close: () => setOpen(false) });
    }
    return controllers;
  }

  // src/patterns/doc-layout/doc-toc.js
  var tocPagers = [];
  function defaultScrollSpyOffsetPx() {
    const nav = document.querySelector("[data-ls-nav], .ls-nav, #site-nav");
    const navHeight = nav?.getBoundingClientRect().height || 52;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return navHeight + rem;
  }
  function chevronSvg(dir) {
    const d = dir === "up" ? "M4 10.5 L8 6.5 L12 10.5" : "M4 6.5 L8 10.5 L12 6.5";
    return `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function outerHeight(el) {
    if (!el || el.hidden) return 0;
    const style = getComputedStyle(el);
    if (style.display === "none") return 0;
    return el.offsetHeight + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
  }
  function enhanceTocPager(nav, desktopQuery) {
    const label = nav.querySelector(
      ".ls-doc-toc-label:not(.ls-doc-toc-label--section), .site-doc-toc-label:not(.site-doc-toc-label--section), .host-doc-toc-label, .toc-label"
    );
    if (!label) return null;
    let head = nav.querySelector(":scope > .ls-doc-toc-head, :scope > .toc-head");
    if (!head) {
      head = document.createElement("div");
      head.className = "ls-doc-toc-head toc-head";
      label.parentNode.insertBefore(head, label);
      head.appendChild(label);
    }
    let pager = head.querySelector(".ls-doc-toc-pager, .toc-pager");
    let prevBtn;
    let nextBtn;
    if (!pager) {
      pager = document.createElement("div");
      pager.className = "ls-doc-toc-pager toc-pager";
      pager.hidden = true;
      pager.setAttribute("role", "group");
      pager.setAttribute("aria-label", "Table of contents pages");
      prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "ls-doc-toc-page-btn toc-page-btn toc-page-btn--prev";
      prevBtn.setAttribute("aria-label", "Previous headings");
      prevBtn.innerHTML = chevronSvg("up");
      nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "ls-doc-toc-page-btn toc-page-btn toc-page-btn--next";
      nextBtn.setAttribute("aria-label", "Next headings");
      nextBtn.innerHTML = chevronSvg("down");
      pager.appendChild(prevBtn);
      pager.appendChild(nextBtn);
      head.appendChild(pager);
    } else {
      prevBtn = pager.querySelector(".toc-page-btn--prev");
      nextBtn = pager.querySelector(".toc-page-btn--next");
    }
    let items = Array.from(nav.children).filter(
      (el) => el.hasAttribute("data-toc-target") || el.classList.contains("ls-doc-toc-label--section") || el.classList.contains("site-doc-toc-label--section")
    );
    let list = nav.querySelector(":scope > .ls-doc-toc-list, :scope > .toc-list");
    if (!list && items.length) {
      list = document.createElement("div");
      list.className = "ls-doc-toc-list toc-list";
      nav.insertBefore(list, items[0]);
      items.forEach((el) => list.appendChild(el));
    } else if (list) {
      items = Array.from(list.children);
    }
    if (!items.length) return null;
    let pageIndex = 0;
    let measureTimer = null;
    let lastHeights = null;
    let followTargetId = null;
    const desktopMq = window.matchMedia(desktopQuery);
    function visibleItems() {
      return items.filter((el) => !el.hidden);
    }
    function listBudget() {
      const style = getComputedStyle(nav);
      const padBottom = parseFloat(style.paddingBottom) || 0;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const foot = nav.querySelector(":scope > .ls-doc-toc-foot, :scope > .toc-foot");
      const listTop = list ? list.getBoundingClientRect().top : nav.getBoundingClientRect().top + outerHeight(head);
      let reserve = padBottom + rem;
      if (foot && !foot.hidden && getComputedStyle(foot).display !== "none") {
        reserve += outerHeight(foot);
      }
      const rectBudget = window.innerHeight - listTop - reserve;
      if (rectBudget > 0) return rectBudget;
      const stickyTop = parseFloat(style.top) || 0;
      const padY = (parseFloat(style.paddingTop) || 0) + padBottom;
      const back = nav.querySelector(".ls-doc-toc-back, .site-doc-toc-back, .toc-back");
      let chrome = padY + outerHeight(head);
      if (back) chrome += outerHeight(back);
      if (foot && !foot.hidden) chrome += outerHeight(foot);
      return Math.max(0, window.innerHeight - stickyTop - rem - chrome);
    }
    function applyPage(vis, start, count) {
      const end = start + count;
      vis.forEach((el, i) => {
        const off = i < start || i >= end;
        el.classList.toggle("ls-doc-toc-page-off", off);
        el.classList.toggle("is-toc-page-off", off);
      });
    }
    function measure(opts = {}) {
      const vis = visibleItems();
      const shouldUnhide = opts.unhide !== false || !lastHeights || lastHeights.length !== vis.length;
      if (shouldUnhide) {
        vis.forEach((el) => el.classList.remove("ls-doc-toc-page-off", "is-toc-page-off"));
      }
      const tocVisible = desktopMq.matches && getComputedStyle(nav).display !== "none" && getComputedStyle(nav).position === "sticky";
      if (!tocVisible || vis.length <= 1) {
        pager.hidden = true;
        nav.classList.remove("is-toc-paged");
        pageIndex = 0;
        lastHeights = null;
        return;
      }
      const heights = shouldUnhide ? vis.map(outerHeight) : lastHeights;
      lastHeights = heights;
      let total = 0;
      for (let i = 0; i < heights.length; i++) total += heights[i];
      const budget = listBudget();
      if (total <= budget) {
        pager.hidden = true;
        nav.classList.remove("is-toc-paged");
        vis.forEach((el) => el.classList.remove("ls-doc-toc-page-off", "is-toc-page-off"));
        pageIndex = 0;
        return;
      }
      const pages = [];
      let idx = 0;
      while (idx < vis.length) {
        let sum = 0;
        let count = 0;
        while (idx + count < vis.length) {
          const h = heights[idx + count];
          if (count > 0 && sum + h > budget) break;
          sum += h;
          count++;
        }
        pages.push({ start: idx, count: Math.max(1, count) });
        idx += Math.max(1, count);
      }
      if (pages.length <= 1) {
        pager.hidden = true;
        nav.classList.remove("is-toc-paged");
        vis.forEach((el) => el.classList.remove("ls-doc-toc-page-off", "is-toc-page-off"));
        pageIndex = 0;
        return;
      }
      if (followTargetId) {
        const targetPos = vis.findIndex((el) => el.getAttribute("data-toc-target") === followTargetId);
        if (targetPos !== -1) {
          for (let p = 0; p < pages.length; p++) {
            if (targetPos >= pages[p].start && targetPos < pages[p].start + pages[p].count) {
              pageIndex = p;
              break;
            }
          }
        }
      }
      pageIndex = Math.max(0, Math.min(pageIndex, pages.length - 1));
      pager.hidden = false;
      nav.classList.add("is-toc-paged");
      applyPage(vis, pages[pageIndex].start, pages[pageIndex].count);
      prevBtn.disabled = pageIndex === 0;
      nextBtn.disabled = pageIndex >= pages.length - 1;
    }
    function scheduleMeasure() {
      clearTimeout(measureTimer);
      measureTimer = setTimeout(() => measure({ unhide: true }), 40);
    }
    prevBtn.addEventListener("click", () => {
      followTargetId = null;
      pageIndex = Math.max(0, pageIndex - 1);
      measure({ unhide: false });
    });
    nextBtn.addEventListener("click", () => {
      followTargetId = null;
      pageIndex += 1;
      measure({ unhide: false });
    });
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    desktopMq.addEventListener("change", scheduleMeasure);
    if (document.fonts?.ready) {
      document.fonts.ready.then(scheduleMeasure);
    }
    const controller = {
      nav,
      measure: (opts) => measure(opts),
      follow(targetId) {
        followTargetId = targetId || null;
        measure({ unhide: false });
      }
    };
    tocPagers.push(controller);
    measure({ unhide: true });
    return controller;
  }
  function initHeadingAnchors(root = document) {
    const containers = root.querySelectorAll(".ls-doc-main, .site-doc-main");
    containers.forEach((container) => {
      container.querySelectorAll("h2[id], h3[id], h4[id]").forEach((heading) => {
        if (heading.querySelector(".ls-doc-heading-anchor, .doc-heading-anchor")) return;
        heading.classList.add("ls-doc-heading", "doc-heading");
        const id = heading.getAttribute("id");
        if (!id) return;
        const a = document.createElement("a");
        a.className = "ls-doc-heading-anchor doc-heading-anchor";
        a.href = `#${encodeURIComponent(id)}`;
        a.textContent = "#";
        a.setAttribute("aria-label", `Copy link to ${heading.textContent.trim()}`);
        a.addEventListener("click", async (event) => {
          event.preventDefault();
          const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(id)}`;
          try {
            await navigator.clipboard.writeText(url);
            a.classList.remove("ls-is-copy-failed", "is-copy-failed");
            a.classList.add("ls-is-copied", "is-copied");
            window.history.replaceState(null, "", `#${encodeURIComponent(id)}`);
          } catch {
            a.classList.remove("ls-is-copied", "is-copied");
            a.classList.add("ls-is-copy-failed", "is-copy-failed");
          }
          setTimeout(() => {
            a.classList.remove("ls-is-copied", "is-copied", "ls-is-copy-failed", "is-copy-failed");
          }, 1600);
        });
        heading.appendChild(a);
      });
    });
  }
  function initDocScroll(options = {}) {
    const navSelector = options.navSelector || "[data-ls-toc], .ls-doc-toc, .site-doc-toc";
    const desktopQuery = options.desktopQuery || "(min-width: 1100px)";
    const syncHash = options.syncHash !== false;
    const nav = typeof navSelector === "string" ? document.querySelector(navSelector) : navSelector;
    if (!nav) return null;
    initHeadingAnchors(document);
    const pager = enhanceTocPager(nav, desktopQuery);
    const links = [...nav.querySelectorAll("[data-toc-target]")];
    if (!links.length) return { pager };
    let pinnedId = null;
    let pinTimer = null;
    function setActive(targetId) {
      for (const link of links) {
        const match = link.getAttribute("data-toc-target") === targetId;
        link.classList.toggle("ls-is-active", match);
        link.classList.toggle("is-active", match);
        if (match) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
      pager?.follow(targetId);
    }
    function resolveCurrent() {
      const offset = options.offsetPx ?? defaultScrollSpyOffsetPx();
      let current = links[0].getAttribute("data-toc-target");
      for (const link of links) {
        const id = link.getAttribute("data-toc-target");
        const target = id ? document.getElementById(id) : null;
        if (!target) continue;
        if (target.getBoundingClientRect().top <= offset + 12) {
          current = id;
        }
      }
      return current;
    }
    let rafPending = false;
    function onScroll() {
      if (pinnedId) return;
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        const id = resolveCurrent();
        setActive(id);
        if (syncHash && id && window.location.hash !== `#${id}`) {
          try {
            window.history.replaceState(null, "", `#${id}`);
          } catch {
          }
        }
      });
    }
    function scrollToSection(id, behavior = "smooth") {
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      target.scrollIntoView({ behavior, block: "start" });
    }
    function navigateToSection(id, behavior = "smooth") {
      if (!id) return;
      pinnedId = id;
      setActive(id);
      scrollToSection(id, behavior);
      if (syncHash) {
        try {
          window.history.replaceState(null, "", `#${encodeURIComponent(id)}`);
        } catch {
        }
      }
      clearTimeout(pinTimer);
      pinTimer = setTimeout(() => {
        pinnedId = null;
      }, 900);
    }
    links.forEach((link) => {
      link.addEventListener("click", () => {
        const id = link.getAttribute("data-toc-target");
        if (!id) return;
        pinnedId = id;
        setActive(id);
        clearTimeout(pinTimer);
        pinTimer = setTimeout(() => {
          pinnedId = null;
        }, 900);
      });
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    setActive(window.location.hash.replace(/^#/, "") || resolveCurrent());
    return {
      pager,
      scrollToSection,
      navigateToSection,
      refresh() {
        pager?.measure({ unhide: true });
        setActive(resolveCurrent());
      }
    };
  }
  function refreshTocPager() {
    for (const p of tocPagers) {
      p.measure({ unhide: true });
    }
  }

  // src/patterns/lang-switch/lang-switch.js
  var VALID_LANGS = /* @__PURE__ */ new Set(["en", "vi"]);
  function initLangSwitch(root = document, options = {}) {
    const storageKey = options.storageKey || "lsds-lang";
    const buttons = [...root.querySelectorAll("[data-ls-lang-toggle]")];
    if (!buttons.length) return null;
    function detectLang() {
      const attr = (document.documentElement.lang || "").toLowerCase().slice(0, 2);
      if (VALID_LANGS.has(attr)) return attr;
      try {
        const saved = localStorage.getItem(storageKey);
        if (VALID_LANGS.has(saved)) return saved;
      } catch {
      }
      return "en";
    }
    function apply(lang, emit = false) {
      const next = VALID_LANGS.has(lang) ? lang : "en";
      document.documentElement.lang = next;
      try {
        localStorage.setItem(storageKey, next);
      } catch {
      }
      for (const btn of buttons) {
        const code = btn.querySelector(".ls-lang-code");
        if (code) code.textContent = next.toUpperCase();
        btn.setAttribute(
          "aria-label",
          next === "en" ? "Chuy\u1EC3n sang ti\u1EBFng Vi\u1EC7t" : "Switch to English"
        );
        btn.setAttribute("aria-pressed", next === "vi" ? "true" : "false");
      }
      if (emit) {
        document.dispatchEvent(new CustomEvent("ls:lang-change", { detail: { lang: next } }));
      }
    }
    apply(detectLang(), false);
    for (const btn of buttons) {
      if (btn.dataset.lsLangBound) continue;
      btn.dataset.lsLangBound = "1";
      btn.addEventListener("click", () => {
        const cur = (document.documentElement.lang || "en").toLowerCase().slice(0, 2);
        apply(cur === "vi" ? "en" : "vi", true);
      });
    }
    return { apply };
  }

  // src/experimental/sheet/sheet.js
  function initSheets(root = document) {
    const sheets = [...root.querySelectorAll("[data-ls-sheet]")];
    const controllers = [];
    for (const sheet of sheets) {
      let setOpen = function(open, trigger = null) {
        const next = Boolean(open);
        if (trigger) lastTrigger = trigger;
        sheet.classList.toggle("ls-is-open", next);
        sheet.setAttribute("aria-hidden", String(!next));
        if (overlay) overlay.hidden = !next;
        if (id) {
          root.querySelectorAll(`[data-ls-sheet-open="${id}"]`).forEach((btn) => {
            btn.setAttribute("aria-expanded", String(next));
          });
        }
        if (!next && lastTrigger) {
          lastTrigger.focus?.();
          lastTrigger = null;
        }
      };
      if (sheet.dataset.lsSheetBound) continue;
      sheet.dataset.lsSheetBound = "1";
      const id = sheet.id || sheet.getAttribute("data-ls-sheet");
      const overlay = id ? root.querySelector(`[data-ls-sheet-overlay="${id}"]`) : null;
      let lastTrigger = null;
      if (id) {
        root.querySelectorAll(`[data-ls-sheet-open="${id}"]`).forEach((btn) => {
          btn.addEventListener("click", () => {
            setOpen(!sheet.classList.contains("ls-is-open"), btn);
          });
        });
      }
      sheet.querySelectorAll("[data-ls-sheet-close]").forEach((btn) => {
        btn.addEventListener("click", () => setOpen(false));
      });
      overlay?.addEventListener("click", () => setOpen(false));
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && sheet.classList.contains("ls-is-open")) {
          event.preventDefault();
          setOpen(false);
        }
      });
      controllers.push({ sheet, setOpen, close: () => setOpen(false) });
    }
    return controllers;
  }

  // src/experimental/toc-drawer/toc-drawer.js
  var ICON_OPEN = '<svg class="ls-toc-fab-icon ls-toc-fab-icon--open" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="4.5" cy="6" r="1.4" fill="currentColor"/><circle cx="4.5" cy="12" r="1.4" fill="currentColor"/><circle cx="4.5" cy="18" r="1.4" fill="currentColor"/></svg>';
  var ICON_CLOSE = '<svg class="ls-toc-fab-icon ls-toc-fab-icon--close" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var idCounter = 0;
  function initTocDrawer(root = document, options = {}) {
    const desktopQuery = window.matchMedia(options.desktopQuery || "(min-width: 1100px)");
    const controllers = [];
    for (const layout of root.querySelectorAll(".ls-doc-layout[data-ls-toc-drawer]")) {
      let setInert = function(on) {
        for (const el of layout.querySelectorAll(inertSelector)) el.inert = on;
      }, setOpen = function(open, { restoreFocus = true } = {}) {
        const next = Boolean(open) && !desktopQuery.matches;
        if (next === nav.classList.contains("ls-is-open")) return;
        nav.classList.toggle("ls-is-open", next);
        overlay.hidden = !next;
        fab.setAttribute("aria-expanded", String(next));
        document.documentElement.classList.toggle("ls-toc-drawer-lock", next);
        setInert(next);
        if (next) {
          const target = nav.querySelector('[aria-current="location"]') || nav.querySelector("a[href], button");
          target?.scrollIntoView({ block: "nearest" });
          target?.focus({ preventScroll: true });
        } else if (restoreFocus) {
          fab.focus({ preventScroll: true });
        }
      };
      if (layout.dataset.lsTocDrawerBound) continue;
      const nav = layout.querySelector(".ls-doc-toc");
      if (!nav) continue;
      layout.dataset.lsTocDrawerBound = "1";
      if (!nav.id) nav.id = `ls-doc-toc-${++idCounter}`;
      const inertSelector = layout.getAttribute("data-ls-toc-drawer") || ".ls-doc-main";
      const fab = document.createElement("button");
      fab.type = "button";
      fab.className = "ls-toc-fab";
      fab.setAttribute("aria-controls", nav.id);
      fab.setAttribute("aria-expanded", "false");
      fab.setAttribute("aria-label", nav.getAttribute("aria-label") || "On this page");
      fab.innerHTML = ICON_OPEN + ICON_CLOSE;
      const overlay = document.createElement("div");
      overlay.className = "ls-toc-drawer-overlay";
      overlay.hidden = true;
      layout.append(overlay, fab);
      fab.addEventListener("click", () => setOpen(!nav.classList.contains("ls-is-open")));
      overlay.addEventListener("click", () => setOpen(false));
      nav.addEventListener("click", (event) => {
        if (event.target.closest("a[href]") && nav.classList.contains("ls-is-open")) {
          setOpen(false, { restoreFocus: false });
        }
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && nav.classList.contains("ls-is-open")) {
          event.preventDefault();
          setOpen(false);
        }
      });
      desktopQuery.addEventListener("change", () => {
        if (desktopQuery.matches) setOpen(false, { restoreFocus: false });
      });
      controllers.push({ layout, nav, fab, open: () => setOpen(true), close: () => setOpen(false) });
    }
    return controllers;
  }

  // src/experimental/tabs/tabs.js
  function initTabs(root = document) {
    if (!root?.querySelectorAll) return;
    for (const container of root.querySelectorAll("[data-ls-tabs]")) {
      if (container.dataset.lsTabsReady === "1") continue;
      const tablist = container.querySelector('[role="tablist"]');
      if (!tablist) continue;
      container.dataset.lsTabsReady = "1";
      const getTabs = () => [...tablist.querySelectorAll('[role="tab"]')];
      const activate = (tab, moveFocus = false) => {
        const tabs = getTabs();
        const targetId = tab.getAttribute("aria-controls");
        for (const t of tabs) {
          const active = t === tab;
          t.setAttribute("aria-selected", active ? "true" : "false");
          t.classList.toggle("ls-is-active", active);
          t.tabIndex = active ? 0 : -1;
          const panelId = t.getAttribute("aria-controls");
          if (panelId) {
            const panel = container.querySelector(`#${CSS.escape(panelId)}`);
            if (panel) panel.hidden = !active;
          }
        }
        if (moveFocus) tab.focus();
        container.dispatchEvent(
          new CustomEvent("ls:tab-change", {
            bubbles: true,
            detail: { tab, panelId: targetId }
          })
        );
      };
      const initial = getTabs().find((t) => t.getAttribute("aria-selected") === "true" && !t.disabled) || getTabs().find((t) => !t.disabled);
      if (initial) activate(initial, false);
      tablist.addEventListener("click", (event) => {
        const tab = event.target.closest?.('[role="tab"]');
        if (!tab || tab.disabled || !tablist.contains(tab)) return;
        activate(tab, false);
      });
      tablist.addEventListener("keydown", (event) => {
        const enabled = getTabs().filter((t) => !t.disabled);
        if (!enabled.length) return;
        const idx = enabled.indexOf(document.activeElement);
        if (idx === -1) return;
        let nextIdx = -1;
        if (event.key === "ArrowRight") nextIdx = (idx + 1) % enabled.length;
        else if (event.key === "ArrowLeft") nextIdx = (idx - 1 + enabled.length) % enabled.length;
        else if (event.key === "Home") nextIdx = 0;
        else if (event.key === "End") nextIdx = enabled.length - 1;
        else return;
        event.preventDefault();
        activate(enabled[nextIdx], true);
      });
    }
  }

  // src/experimental/lightbox/lightbox.js
  var DIALOG_ID = "ls-lightbox";
  var bound = /* @__PURE__ */ new WeakSet();
  var hooks = { renderChrome: null };
  var ui = null;
  var LABELS = {
    en: {
      close: "Close",
      previous: "Previous",
      next: "Next",
      viewer: "Image viewer",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      zoomReset: "Reset zoom"
    },
    vi: {
      close: "\u0110\xF3ng",
      previous: "Tr\u01B0\u1EDBc",
      next: "Ti\u1EBFp",
      viewer: "Tr\xECnh xem h\xECnh \u1EA3nh",
      zoomIn: "Ph\xF3ng to",
      zoomOut: "Thu nh\u1ECF",
      zoomReset: "\u0110\u1EB7t l\u1EA1i thu ph\xF3ng"
    }
  };
  var ICON_CLOSE2 = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_ZOOM_IN = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg>';
  var ICON_ZOOM_OUT = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 12h12"/></svg>';
  var ICON_PREV = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6l-6 6 6 6"/></svg>';
  var ICON_NEXT = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 6l6 6-6 6"/></svg>';
  function youtubeId(value) {
    const v = String(value || "").trim();
    if (/^[\w-]{11}$/.test(v)) return v;
    const m = v.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
    return m ? m[1] : "";
  }
  function labelsFor() {
    const lang = (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
    return LABELS[lang] || LABELS.en;
  }
  function build(labels) {
    const dialog = document.createElement("dialog");
    dialog.id = DIALOG_ID;
    dialog.className = "ls-lightbox";
    dialog.setAttribute("aria-label", labels.viewer);
    dialog.innerHTML = `
    <div class="ls-lightbox-stage">
      <img class="ls-lightbox-img" alt="" hidden />
      <video class="ls-lightbox-video" controls playsinline preload="metadata" hidden></video>
      <iframe class="ls-lightbox-youtube" hidden allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" title=""></iframe>
      <button type="button" class="ls-lightbox-nav ls-lightbox-prev" hidden>${ICON_PREV}</button>
      <button type="button" class="ls-lightbox-nav ls-lightbox-next" hidden>${ICON_NEXT}</button>
    </div>
    <div class="ls-lightbox-bar">
      <div class="ls-lightbox-meta">
        <p class="ls-lightbox-caption" hidden></p>
        <p class="ls-lightbox-counter" hidden></p>
      </div>
      <div class="ls-lightbox-actions" hidden></div>
    </div>
    <div class="ls-lightbox-top">
      <div class="ls-lightbox-zoom-group" hidden>
        <button type="button" class="ls-lightbox-zoom-btn ls-lightbox-zoom-out">${ICON_ZOOM_OUT}</button>
        <button type="button" class="ls-lightbox-zoom-btn ls-lightbox-zoom-reset">100%</button>
        <button type="button" class="ls-lightbox-zoom-btn ls-lightbox-zoom-in">${ICON_ZOOM_IN}</button>
      </div>
      <button type="button" class="ls-lightbox-close">${ICON_CLOSE2}</button>
    </div>
  `;
    document.body.appendChild(dialog);
    const q = (sel) => dialog.querySelector(sel);
    const parts = {
      dialog,
      stage: q(".ls-lightbox-stage"),
      img: q(".ls-lightbox-img"),
      video: q(".ls-lightbox-video"),
      youtube: q(".ls-lightbox-youtube"),
      prev: q(".ls-lightbox-prev"),
      next: q(".ls-lightbox-next"),
      caption: q(".ls-lightbox-caption"),
      counter: q(".ls-lightbox-counter"),
      actions: q(".ls-lightbox-actions"),
      zoomGroup: q(".ls-lightbox-zoom-group"),
      zoomOut: q(".ls-lightbox-zoom-out"),
      zoomReset: q(".ls-lightbox-zoom-reset"),
      zoomIn: q(".ls-lightbox-zoom-in"),
      close: q(".ls-lightbox-close"),
      zoom: { scale: 1, tx: 0, ty: 0 },
      session: null
    };
    parts.close.addEventListener("click", () => dialog.close());
    parts.prev.addEventListener("click", () => step(parts, -1));
    parts.next.addEventListener("click", () => step(parts, 1));
    parts.zoomIn.addEventListener("click", () => setZoom(parts, parts.zoom.scale + 0.5));
    parts.zoomOut.addEventListener("click", () => setZoom(parts, parts.zoom.scale - 0.5));
    parts.zoomReset.addEventListener("click", () => resetZoom(parts));
    let drag = null;
    let dragged = false;
    const pointers = /* @__PURE__ */ new Map();
    let pinch = null;
    const pinchMetrics = () => {
      const [a, b] = [...pointers.values()];
      return {
        dist: Math.hypot(b.x - a.x, b.y - a.y) || 1,
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      };
    };
    const startDrag = (id, x, y) => {
      drag = { id, x, y, tx: parts.zoom.tx, ty: parts.zoom.ty };
      parts.img.classList.add("ls-is-dragging");
    };
    parts.img.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      parts.img.setPointerCapture?.(event.pointerId);
      dragged = false;
      if (pointers.size === 2) {
        const m = pinchMetrics();
        pinch = {
          dist: m.dist,
          mid: m.mid,
          scale: parts.zoom.scale,
          tx: parts.zoom.tx,
          ty: parts.zoom.ty
        };
        drag = null;
        dragged = true;
        return;
      }
      if (parts.zoom.scale > 1) startDrag(event.pointerId, event.clientX, event.clientY);
    });
    parts.img.addEventListener("pointermove", (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pinch && pointers.size >= 2) {
        const m = pinchMetrics();
        const next = Math.min(4, Math.max(1, pinch.scale * (m.dist / pinch.dist)));
        parts.zoom.scale = next;
        parts.zoom.tx = pinch.tx + (m.mid.x - pinch.mid.x);
        parts.zoom.ty = pinch.ty + (m.mid.y - pinch.mid.y);
        if (next <= 1) {
          parts.zoom.tx = 0;
          parts.zoom.ty = 0;
        }
        applyZoom(parts);
        return;
      }
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragged = true;
      parts.zoom.tx = drag.tx + dx;
      parts.zoom.ty = drag.ty + dy;
      applyZoom(parts);
    });
    const endPointer = (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.delete(event.pointerId);
      if (pinch) {
        pinch = null;
        const [rest] = [...pointers.entries()];
        if (rest && parts.zoom.scale > 1) startDrag(rest[0], rest[1].x, rest[1].y);
        return;
      }
      if (drag && event.pointerId === drag.id) {
        drag = null;
        parts.img.classList.remove("ls-is-dragging");
      }
    };
    parts.img.addEventListener("pointerup", endPointer);
    parts.img.addEventListener("pointercancel", endPointer);
    parts.img.addEventListener("click", (event) => {
      event.stopPropagation();
      if (dragged) {
        dragged = false;
        return;
      }
      setZoom(parts, parts.zoom.scale > 1 ? 1 : 2);
    });
    parts.stage.addEventListener(
      "wheel",
      (event) => {
        if (parts.img.hidden) return;
        event.preventDefault();
        const delta = event.deltaY < 0 ? 0.25 : -0.25;
        setZoom(parts, parts.zoom.scale + delta);
      },
      { passive: false }
    );
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog || event.target === parts.stage) dialog.close();
    });
    dialog.addEventListener("keydown", (event) => {
      if (event.target.closest?.("video, iframe")) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(parts, -1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(parts, 1);
      } else if (!parts.img.hidden && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        setZoom(parts, parts.zoom.scale + 0.5);
      } else if (!parts.img.hidden && (event.key === "-" || event.key === "_")) {
        event.preventDefault();
        setZoom(parts, parts.zoom.scale - 0.5);
      } else if (!parts.img.hidden && event.key === "0") {
        event.preventDefault();
        resetZoom(parts);
      }
    });
    dialog.addEventListener("close", () => onClose(parts));
    return parts;
  }
  function ensure(labels) {
    if (ui && ui.dialog.isConnected) {
      applyLabels(ui, labels);
      return ui;
    }
    ui = build(labels);
    return ui;
  }
  function applyLabels(parts, labels) {
    parts.dialog.setAttribute("aria-label", labels.viewer);
    parts.close.setAttribute("aria-label", labels.close);
    parts.prev.setAttribute("aria-label", labels.previous);
    parts.next.setAttribute("aria-label", labels.next);
    parts.zoomIn.setAttribute("aria-label", labels.zoomIn);
    parts.zoomOut.setAttribute("aria-label", labels.zoomOut);
    parts.zoomReset.setAttribute("aria-label", labels.zoomReset);
  }
  function applyZoom(parts) {
    const { scale, tx, ty } = parts.zoom;
    const zoomed = scale > 1;
    parts.img.classList.toggle("ls-is-zoomed", zoomed);
    parts.img.style.transform = zoomed ? `translate(${tx}px, ${ty}px) scale(${scale})` : "";
    parts.zoomReset.textContent = `${Math.round(scale * 100)}%`;
    parts.zoomOut.disabled = scale <= 1;
    parts.zoomReset.disabled = !zoomed;
    parts.zoomIn.disabled = scale >= 4;
  }
  function setZoom(parts, nextScale) {
    const clamped = Math.min(4, Math.max(1, Math.round(nextScale * 4) / 4));
    parts.zoom.scale = clamped;
    if (clamped <= 1) {
      parts.zoom.tx = 0;
      parts.zoom.ty = 0;
    }
    applyZoom(parts);
  }
  function resetZoom(parts) {
    parts.zoom.scale = 1;
    parts.zoom.tx = 0;
    parts.zoom.ty = 0;
    applyZoom(parts);
  }
  function stopMedia(parts) {
    parts.video.pause();
    parts.video.removeAttribute("src");
    parts.video.removeAttribute("poster");
    parts.video.load();
    parts.youtube.removeAttribute("src");
  }
  function render(parts) {
    const { items, index, renderChrome } = parts.session;
    const item = items[index];
    stopMedia(parts);
    const isVideo = Boolean(item.video);
    const ytId = youtubeId(item.youtube);
    const isYoutube = !isVideo && Boolean(ytId);
    const isImage = !isVideo && !isYoutube;
    parts.img.hidden = !isImage;
    parts.zoomGroup.hidden = !isImage;
    resetZoom(parts);
    if (isImage) {
      parts.img.src = item.src || "";
      parts.img.alt = item.alt || "";
    } else {
      parts.img.removeAttribute("src");
    }
    parts.video.hidden = !isVideo;
    if (isVideo) {
      parts.video.src = item.video;
      if (item.poster) parts.video.poster = item.poster;
    }
    parts.youtube.hidden = !isYoutube;
    if (isYoutube) {
      parts.youtube.title = item.alt || item.caption || "Video";
      parts.youtube.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytId)}?rel=0&autoplay=1`;
    }
    const multi = items.length > 1;
    parts.prev.hidden = !multi;
    parts.next.hidden = !multi;
    if (item.captionHtml) {
      parts.caption.innerHTML = item.captionHtml;
    } else {
      parts.caption.textContent = item.caption || "";
    }
    parts.caption.hidden = !(item.captionHtml || item.caption);
    parts.counter.textContent = multi ? `${index + 1} / ${items.length}` : "";
    parts.counter.hidden = !multi;
    parts.actions.replaceChildren();
    const chrome = renderChrome || hooks.renderChrome;
    if (typeof chrome === "function") chrome(item, parts.actions, { index, total: items.length });
    parts.actions.hidden = parts.actions.childElementCount === 0;
  }
  function step(parts, delta) {
    const s = parts.session;
    if (!s || s.items.length < 2) return;
    s.index = (s.index + delta + s.items.length) % s.items.length;
    render(parts);
  }
  function onClose(parts) {
    stopMedia(parts);
    resetZoom(parts);
    document.documentElement.classList.remove("ls-lightbox-open");
    const session = parts.session;
    parts.session = null;
    parts.actions.replaceChildren();
    const trigger = session?.trigger;
    if (trigger && trigger.isConnected && typeof trigger.focus === "function") {
      trigger.focus({ preventScroll: true });
    }
  }
  function openLightbox(items, index = 0, options = {}) {
    const list = (Array.isArray(items) ? items : [items]).filter((i) => i && (i.src || i.video || youtubeId(i.youtube)));
    if (!list.length) return;
    const labels = options.labels || labelsFor();
    const parts = ensure(labels);
    parts.session = {
      items: list,
      index: Math.min(Math.max(0, index), list.length - 1),
      renderChrome: typeof options.renderChrome === "function" ? options.renderChrome : null,
      trigger: options.trigger || null
    };
    render(parts);
    document.documentElement.classList.add("ls-lightbox-open");
    if (!parts.dialog.open) parts.dialog.showModal();
    parts.close.focus({ preventScroll: true });
  }
  function closeLightbox() {
    if (ui?.dialog.open) ui.dialog.close();
  }
  function itemFromTrigger(trigger) {
    const ds = trigger.dataset;
    const img = trigger.querySelector?.("img");
    const href = trigger.tagName === "A" ? trigger.getAttribute("href") : "";
    const src = ds.lsLightboxSrc || href || img?.getAttribute("src") || "";
    const video = ds.lsLightboxVideo || "";
    const youtube = ds.lsLightboxYoutube || "";
    if (!src && !video && !youtube) return null;
    return {
      src,
      video,
      youtube,
      poster: ds.lsLightboxPoster || "",
      alt: ds.lsLightboxAlt || img?.getAttribute("alt") || "",
      caption: ds.lsLightboxCaption || "",
      captionHtml: ds.lsLightboxCaptionHtml || ""
    };
  }
  function onTriggerClick(event, root) {
    const trigger = event.target.closest?.("[data-ls-lightbox]");
    if (!trigger || !root.contains(trigger)) return;
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const item = itemFromTrigger(trigger);
    if (!item) return;
    event.preventDefault();
    const group = trigger.dataset.lsLightboxGroup;
    if (!group) {
      openLightbox([item], 0, { trigger });
      return;
    }
    const pairs = [...root.querySelectorAll("[data-ls-lightbox][data-ls-lightbox-group]")].filter((t) => t.dataset.lsLightboxGroup === group).map((t) => ({ t, item: itemFromTrigger(t) })).filter((p) => p.item);
    const index = pairs.findIndex((p) => p.t === trigger);
    openLightbox(
      pairs.map((p) => p.item),
      Math.max(0, index),
      { trigger }
    );
  }
  function initLightbox(root = document, options = {}) {
    if (!root?.querySelectorAll) return;
    if (typeof options.renderChrome === "function") hooks.renderChrome = options.renderChrome;
    if (bound.has(root)) return;
    bound.add(root);
    root.addEventListener("click", (event) => onTriggerClick(event, root));
  }

  // src/experimental/flier/flier.js
  var MOBILE_QUERY = "(max-width: 768px)";
  var bound2 = /* @__PURE__ */ new WeakSet();
  var toastTimer = null;
  var LABELS2 = {
    en: {
      share: "Share",
      copyLink: "Copy link",
      shareAria: "Share {title}",
      copyAria: "Copy link to {title}",
      linkCopied: "Link copied",
      copyFailed: "Could not copy link",
      scanQr: "Scan QR code to register"
    },
    vi: {
      share: "Chia s\u1EBB",
      copyLink: "Sao ch\xE9p li\xEAn k\u1EBFt",
      shareAria: "Chia s\u1EBB {title}",
      copyAria: "Sao ch\xE9p li\xEAn k\u1EBFt {title}",
      linkCopied: "\u0110\xE3 sao ch\xE9p li\xEAn k\u1EBFt",
      copyFailed: "Kh\xF4ng th\u1EC3 sao ch\xE9p li\xEAn k\u1EBFt",
      scanQr: "Qu\xE9t m\xE3 QR \u0111\u1EC3 \u0111\u0103ng k\xFD"
    }
  };
  var ICON_ZOOM = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/><path d="M11 8v6M8 11h6"/></svg>';
  var ICON_SHARE = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  var ICON_LINK = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
  var ICON_EXTERNAL = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>';
  function labelsFor2() {
    const lang = (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
    return LABELS2[lang] || LABELS2.en;
  }
  var canWebShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";
  var isMobile = () => window.matchMedia(MOBILE_QUERY).matches;
  function titleFor(figure, trigger) {
    return figure.dataset.lsFlierTitle || trigger.dataset.lsFlierAlt || "Flier";
  }
  function shareUrlFor(figure) {
    return figure.dataset.lsFlierShareUrl || window.location.href;
  }
  function srcFor(trigger) {
    return trigger.dataset.lsFlierSrc || trigger.getAttribute("href") || "";
  }
  function fileNameFor(src) {
    try {
      const base = new URL(src, window.location.href).pathname.split("/").pop();
      return base && /\.[a-z0-9]+$/i.test(base) ? base : "flier.jpg";
    } catch (_) {
      return "flier.jpg";
    }
  }
  function showToast(message, anchor) {
    const host = anchor?.closest?.(".ls-lightbox[open]") || document.body;
    let toast = document.querySelector(".ls-flier-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "ls-flier-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
    }
    if (toast.parentNode !== host) host.appendChild(toast);
    toast.textContent = message;
    toast.classList.add("ls-is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("ls-is-visible"), 2200);
  }
  async function copyLink(url, anchor, L) {
    try {
      await navigator.clipboard.writeText(url);
      showToast(L.linkCopied, anchor);
    } catch (_) {
      showToast(L.copyFailed, anchor);
    }
  }
  async function shareFlier(src, title, url) {
    if (src && typeof navigator.canShare === "function") {
      try {
        const res = await fetch(new URL(src, window.location.href));
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], fileNameFor(src), { type: blob.type || "image/jpeg" });
          const payload = { files: [file], title, text: title };
          if (navigator.canShare(payload)) {
            await navigator.share(payload);
            return;
          }
        }
      } catch (err) {
        if (err?.name === "AbortError") throw err;
      }
    }
    await navigator.share({ title, text: title, url });
  }
  async function runAction(figure, trigger, L, anchor) {
    if (anchor.dataset.busy === "1") return;
    anchor.dataset.busy = "1";
    const url = shareUrlFor(figure);
    const title = titleFor(figure, trigger);
    try {
      if (canWebShare()) await shareFlier(srcFor(trigger), title, url);
      else await copyLink(url, anchor, L);
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.warn("Flier share failed", err);
      await copyLink(url, anchor, L);
    } finally {
      delete anchor.dataset.busy;
    }
  }
  function actionSpec(L, title) {
    return canWebShare() ? { icon: ICON_SHARE, label: L.share, aria: L.shareAria.replace("{title}", title) } : { icon: ICON_LINK, label: L.copyLink, aria: L.copyAria.replace("{title}", title) };
  }
  function ensureQrIcon(figure) {
    figure.querySelectorAll(":scope > .ls-flier-qr").forEach((qr) => {
      if (qr.querySelector(":scope > .ls-flier-qr-icon")) return;
      const icon = document.createElement("span");
      icon.className = "ls-flier-qr-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = ICON_EXTERNAL;
      qr.appendChild(icon);
    });
  }
  function ensureZoomBadge(trigger) {
    if (trigger.querySelector(":scope > .ls-flier-zoom")) return;
    const badge = document.createElement("span");
    badge.className = "ls-flier-zoom";
    badge.setAttribute("aria-hidden", "true");
    badge.innerHTML = ICON_ZOOM;
    trigger.appendChild(badge);
  }
  function ensureAction(figure, title, L) {
    let btn = figure.querySelector(":scope > .ls-flier-action");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ls-flier-action";
      figure.appendChild(btn);
    }
    const spec = actionSpec(L, title);
    btn.innerHTML = spec.icon;
    btn.title = spec.label;
    btn.setAttribute("aria-label", spec.aria);
    return btn;
  }
  function openInLightbox(figure, trigger, L, title) {
    openLightbox(
      [
        {
          src: srcFor(trigger),
          alt: trigger.dataset.lsFlierAlt || "",
          caption: trigger.dataset.lsFlierCaption || title
        }
      ],
      0,
      {
        trigger,
        renderChrome: (_item, actionsEl) => {
          const dialog = actionsEl.closest(".ls-lightbox");
          dialog?.querySelectorAll(".ls-flier-action-chrome").forEach((el) => el.remove());
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "ls-lightbox-action ls-flier-action-chrome";
          const spec = actionSpec(L, title);
          btn.innerHTML = spec.icon;
          btn.title = spec.label;
          btn.setAttribute("aria-label", spec.aria);
          btn.addEventListener("click", () => runAction(figure, trigger, L, btn));
          const close = dialog?.querySelector(".ls-lightbox-top .ls-lightbox-close");
          if (close) close.before(btn);
          else actionsEl.appendChild(btn);
        }
      }
    );
  }
  function initFliers(root = document) {
    root.querySelectorAll?.(".ls-flier").forEach((figure) => {
      if (bound2.has(figure)) return;
      const trigger = figure.querySelector(".ls-flier-open");
      if (!trigger) return;
      bound2.add(figure);
      const L = labelsFor2();
      const title = titleFor(figure, trigger);
      ensureZoomBadge(trigger);
      ensureQrIcon(figure);
      const action = ensureAction(figure, title, L);
      action.addEventListener("click", () => runAction(figure, trigger, L, action));
      trigger.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (isMobile()) return;
        openInLightbox(figure, trigger, L, title);
      });
    });
  }

  // src/lsds.js
  function initAll(root = document, options = {}) {
    initSchemeToggle(root, options.scheme);
    initNavShell(root);
    initLangSwitch(root, options.lang);
    initSheets(root);
    initTabs(root);
    initLightbox(root);
    initFliers(root);
    if (root.querySelector?.("[data-ls-toc]")) {
      initDocScroll(options.docScroll);
    }
    initTocDrawer(root, options.tocDrawer);
  }
  if (typeof window !== "undefined") {
    window.LSDS = {
      initAll,
      initNavShell,
      initSchemeToggle,
      initDocScroll,
      initHeadingAnchors,
      refreshTocPager,
      initLangSwitch,
      initSheets,
      initTocDrawer,
      initTabs,
      initLightbox,
      openLightbox,
      closeLightbox,
      initFliers
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => initAll(document), { once: true });
    } else {
      initAll(document);
    }
  }
  return __toCommonJS(lsds_exports);
})();
