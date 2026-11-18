const DRAG_SLOP = 8;
const MOUTH_Y = 0.55;
const IDLE_FEED_MS = 15000;
const TREAT_KEYS = ["envelope", "cabbage"];

const TREATS = {
  envelope: { art: "../assets/kids-village/envelope.webp" },
  cabbage: { art: "../assets/kids-village/cabbage.webp" },
};

const els = {
  lion: document.getElementById("kvLion"),
  treats: document.getElementById("kvTreats"),
  hint: document.getElementById("kvHint"),
  flyer: document.getElementById("kvFlyer"),
  pop: document.getElementById("kvPop"),
};

let feeding = null;
let idleTimer = null;

const { initPageShell, loadSiteData, setPageTitle, revealPage, escapeHtml } = window.EglnySite;

function mouthPoint() {
  const rect = els.lion.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height * MOUTH_Y };
}

function overLion(x, y) {
  const rect = els.lion.getBoundingClientRect();
  const m = mouthPoint();
  return Math.hypot(x - m.x, y - m.y) < rect.width * 0.36;
}

function setHungry(on) {
  els.lion.classList.toggle("is-hungry", on);
}

function placeFlyer(x, y, scale = 1) {
  const half = els.flyer.offsetWidth / 2;
  els.flyer.style.transform = `translate(${x - half}px, ${y - half}px) scale(${scale})`;
}

function flyTo(x, y, scale, ms) {
  return new Promise((resolve) => {
    els.flyer.style.transition = `transform ${ms}ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity ${ms}ms`;
    requestAnimationFrame(() => {
      placeFlyer(x, y, scale);
      setTimeout(resolve, ms);
    });
  });
}

function startFlyer(treat, x, y) {
  els.flyer.innerHTML = `<img src="${TREATS[treat].art}" alt="" />`;
  els.flyer.style.transition = "none";
  els.flyer.style.opacity = "1";
  els.flyer.hidden = false;
  placeFlyer(x, y, 1.05);
}

function endFlyer() {
  els.flyer.hidden = true;
  els.flyer.style.transition = "none";
}

function detachTreatPointerWatch() {
  document.removeEventListener("pointermove", onTreatMove);
  document.removeEventListener("pointerup", onTreatUp);
  document.removeEventListener("pointercancel", onTreatUp);
  document.removeEventListener("lostpointercapture", onTreatLostCapture);
}

function releaseTreatCapture(f) {
  if (!f?.btn || f.pointerId == null) return;
  try {
    if (f.btn.hasPointerCapture?.(f.pointerId)) f.btn.releasePointerCapture(f.pointerId);
  } catch {
    /* already released */
  }
}

function resetTreatVisuals(btn) {
  endFlyer();
  btn?.classList.remove("is-lifted");
  setHungry(false);
}

function bumpIdle() {
  clearTimeout(idleTimer);
  idleTimer = null;
  if (document.hidden) return;
  idleTimer = setTimeout(() => {
    if (feeding || document.hidden) {
      bumpIdle();
      return;
    }
    const treat = TREAT_KEYS[Math.floor(Math.random() * TREAT_KEYS.length)];
    feedByKey(treat);
  }, IDLE_FEED_MS);
}

function onTreatDown(e) {
  const btn = e.currentTarget;
  const treat = btn.dataset.treat;
  if (feeding) return;
  if (e.button !== undefined && e.button !== 0) return;
  e.preventDefault();
  bumpIdle();
  const rect = btn.querySelector(".kv-treat-art").getBoundingClientRect();
  feeding = {
    btn,
    treat,
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    homeX: rect.left + rect.width / 2,
    homeY: rect.top + rect.height / 2,
    dragging: false,
    busy: false,
  };
  document.addEventListener("pointermove", onTreatMove);
  document.addEventListener("pointerup", onTreatUp);
  document.addEventListener("pointercancel", onTreatUp);
  document.addEventListener("lostpointercapture", onTreatLostCapture);
  try {
    btn.setPointerCapture(e.pointerId);
  } catch {
    /* document listeners still end the drag */
  }
}

function onTreatMove(e) {
  if (!feeding || feeding.busy || e.pointerId !== feeding.pointerId) return;
  const dist = Math.hypot(e.clientX - feeding.startX, e.clientY - feeding.startY);
  if (!feeding.dragging && dist > DRAG_SLOP) {
    feeding.dragging = true;
    feeding.btn.classList.add("is-lifted");
    startFlyer(feeding.treat, feeding.homeX, feeding.homeY);
  }
  if (feeding.dragging) {
    placeFlyer(e.clientX, e.clientY, 1.05);
    setHungry(overLion(e.clientX, e.clientY));
  }
}

function onTreatLostCapture(e) {
  if (!feeding || feeding.busy || e.pointerId !== feeding.pointerId) return;
  onTreatUp(
    new PointerEvent("pointercancel", {
      pointerId: e.pointerId,
      clientX: feeding.startX,
      clientY: feeding.startY,
      bubbles: true,
    })
  );
}

async function onTreatUp(e) {
  if (!feeding || feeding.busy || e.pointerId !== feeding.pointerId) return;
  const f = feeding;
  f.busy = true;
  detachTreatPointerWatch();
  releaseTreatCapture(f);

  if (!f.dragging && Math.hypot(e.clientX - f.startX, e.clientY - f.startY) > DRAG_SLOP) {
    f.dragging = true;
    f.btn.classList.add("is-lifted");
    startFlyer(f.treat, e.clientX, e.clientY);
  }

  try {
    if (!f.dragging) {
      f.btn.classList.add("is-lifted");
      startFlyer(f.treat, f.homeX, f.homeY);
      setHungry(true);
      const m = mouthPoint();
      await flyTo(m.x, m.y, 0.35, 480);
      eat();
    } else if (e.type === "pointerup" && overLion(e.clientX, e.clientY)) {
      const m = mouthPoint();
      await flyTo(m.x, m.y, 0.35, 220);
      eat();
    } else {
      setHungry(false);
      await flyTo(f.homeX, f.homeY, 1, 260);
    }
  } finally {
    resetTreatVisuals(f.btn);
    feeding = null;
    document.body.classList.remove("kv-scroll-lock");
    bumpIdle();
  }
}

function eat() {
  const lion = els.lion;
  lion.classList.remove("is-hungry", "is-idle", "is-chomp");
  void lion.offsetWidth;
  lion.classList.add("is-chomp");
  setTimeout(() => {
    lion.classList.remove("is-chomp");
    lion.classList.add("is-idle");
  }, 520);

  const m = mouthPoint();
  const pop = els.pop;
  pop.hidden = false;
  pop.textContent = "Yum!";
  pop.style.left = `${m.x}px`;
  pop.style.top = `${m.y - 40}px`;
  pop.classList.remove("is-pop");
  void pop.offsetWidth;
  pop.classList.add("is-pop");
  setTimeout(() => {
    pop.classList.remove("is-pop");
    pop.hidden = true;
  }, 800);
}

function buildTreats() {
  els.treats.querySelectorAll(".kv-treat-art").forEach((slot) => {
    const t = TREATS[slot.dataset.art];
    slot.innerHTML = `<img src="${t.art}" alt="" draggable="false" />`;
  });
}

function bindToddlerGuards() {
  const feed = document.querySelector(".kv-feed");
  if (!feed) return;

  const inFeed = (target) => feed.contains(target) || target === els.flyer || target === els.pop;

  // Stop page scroll / rubber-banding while a finger is on the play card (or mid-feed).
  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 1 || feeding || inFeed(e.target)) e.preventDefault();
    },
    { passive: false }
  );

  // Older iOS Safari pinch gesture.
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  document.addEventListener("gesturechange", (e) => e.preventDefault());

  feed.addEventListener("contextmenu", (e) => e.preventDefault());
  feed.addEventListener(
    "pointerdown",
    () => {
      document.body.classList.add("kv-scroll-lock");
      bumpIdle();
    },
    { capture: true }
  );
  const unlockScroll = () => {
    if (!feeding) document.body.classList.remove("kv-scroll-lock");
  };
  document.addEventListener("pointerup", unlockScroll);
  document.addEventListener("pointercancel", unlockScroll);
}

function bindEvents() {
  els.treats.querySelectorAll(".kv-treat").forEach((btn) => {
    btn.addEventListener("pointerdown", onTreatDown);
  });
  document.addEventListener("keydown", (e) => {
    if (feeding) return;
    if (e.key === "e" || e.key === "E" || e.key === "1") {
      bumpIdle();
      feedByKey("envelope");
    } else if (e.key === "c" || e.key === "C") {
      bumpIdle();
      feedByKey("cabbage");
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTimeout(idleTimer);
    else bumpIdle();
  });
  bindToddlerGuards();
}

function feedByKey(treat) {
  if (feeding) return;
  const btn = els.treats.querySelector(`[data-treat="${treat}"]`);
  if (!btn) return;
  clearTimeout(idleTimer);
  idleTimer = null;
  const rect = btn.querySelector(".kv-treat-art").getBoundingClientRect();
  feeding = { btn, treat, busy: true };
  (async () => {
    try {
      btn.classList.add("is-lifted");
      startFlyer(treat, rect.left + rect.width / 2, rect.top + rect.height / 2);
      setHungry(true);
      const m = mouthPoint();
      await flyTo(m.x, m.y, 0.35, 480);
      eat();
    } finally {
      resetTreatVisuals(btn);
      feeding = null;
      document.body.classList.remove("kv-scroll-lock");
      bumpIdle();
    }
  })();
}

async function init() {
  initPageShell("kids-village");
  buildTreats();
  bindEvents();
  bumpIdle();
  try {
    const site = await loadSiteData();
    setPageTitle(site, "Kids Village");
  } catch (err) {
    console.warn(err);
    document.title = "Kids Village — Elk Grove Lunar New Year Tết";
  }
  if (typeof revealPage === "function") revealPage();
}

init().catch((err) => {
  document.getElementById("main").innerHTML = `<p class="error-panel">${escapeHtml?.(err.message) ?? err.message}</p>`;
  if (typeof revealPage === "function") revealPage();
});
