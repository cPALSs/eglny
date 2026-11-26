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
    initAll: () => initAll,
    initDocScroll: () => initDocScroll,
    initHeadingAnchors: () => initHeadingAnchors,
    initLangSwitch: () => initLangSwitch,
    initNavShell: () => initNavShell,
    initSchemeToggle: () => initSchemeToggle,
    initSheets: () => initSheets,
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

  // src/lsds.js
  function initAll(root = document, options = {}) {
    initSchemeToggle(root, options.scheme);
    initNavShell(root);
    initLangSwitch(root, options.lang);
    initSheets(root);
    if (root.querySelector?.("[data-ls-toc]")) {
      initDocScroll(options.docScroll);
    }
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
      initSheets
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => initAll(document), { once: true });
    } else {
      initAll(document);
    }
  }
  return __toCommonJS(lsds_exports);
})();
