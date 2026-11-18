const DRAG_SLOP = 8;
const MOUTH_Y = 0.55;
const IDLE_FEED_MS = 15000;
const CHOMP_MIN_MS = 420;
const YUM_MS = 750; // keep in sync with .kv-pop.is-pop animation duration
const MAX_FLYERS = 14;
/** Position can ease normally; scale stays large early, then shrinks late (comic suck-in). */
const FLY_MOVE_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const FLY_SCALE_EASE = "cubic-bezier(0.75, 0, 0.9, 0.2)";
const TREAT_KEYS = ["envelope", "cabbage"];

const LIONS = [
  { id: "red", label: "Red lion", art: "../assets/kids-village/lion-red.webp" },
  { id: "black", label: "Black lion", art: "../assets/kids-village/lion-black.webp" },
  { id: "green", label: "Green lion", art: "../assets/kids-village/lion-green.webp" },
  { id: "gold", label: "Gold lion", art: "../assets/kids-village/lion-gold.webp" },
  { id: "blue", label: "Blue lion", art: "../assets/kids-village/lion-blue.webp" },
  { id: "orange", label: "Orange lion", art: "../assets/kids-village/lion-orange.webp" },
];

const TREATS = {
  envelope: { art: "../assets/kids-village/envelope.webp" },
  cabbage: { art: "../assets/kids-village/cabbage.webp" },
};

const els = {
  viewport: document.getElementById("kvViewport"),
  track: document.getElementById("kvTrack"),
  dots: document.getElementById("kvDots"),
  prev: document.getElementById("kvPrev"),
  next: document.getElementById("kvNext"),
  treats: document.getElementById("kvTreats"),
  hint: document.getElementById("kvHint"),
  flyLayer: document.getElementById("kvFlyLayer"),
  pop: document.getElementById("kvPop"),
};

let lionIndex = 0; // logical 0..n-1
let trackPos = 1; // visual slot: [cloneLast]=0, reals=1..n, [cloneFirst]=n+1
let carouselBusy = false;
let activeDrag = null; // one drag gesture at a time; taps spawn parallel flyers
let liveFlyers = 0;
let lastChompAt = 0;
let yumPlaying = false;
let yumTimer = null;
let idleTimer = null;
let swipe = { active: false, startX: 0, deltaX: 0, baseTx: 0 };
/** Pixabay Content License — carrotnom (freesound_community / j1987 CC0). */
const CHOMP_SRC = "../assets/kids-village/chomp.mp3";
let chompReady = null;
let audioUnlocked = false;

const { initPageShell, loadSiteData, setPageTitle, revealPage, escapeHtml } = window.EglnySite;

function chompTemplate() {
  if (!chompReady) {
    chompReady = new Audio(CHOMP_SRC);
    chompReady.preload = "auto";
  }
  return chompReady;
}

/** Unlock HTMLAudio on a user gesture (required by mobile browsers). */
function ensureAudio() {
  const tpl = chompTemplate();
  if (audioUnlocked) return;
  const unlock = tpl.cloneNode(true);
  unlock.muted = true;
  unlock
    .play()
    .then(() => {
      unlock.pause();
      audioUnlocked = true;
    })
    .catch(() => {});
}

/** Pixabay carrotnom chomp — clone so rapid feeds can overlap cleanly. */
function playMunch() {
  ensureAudio();
  const a = chompTemplate().cloneNode(true);
  a.muted = false;
  a.volume = 0.9;
  a.currentTime = 0;
  a.play().catch(() => {});
}

function currentLion() {
  return els.track.querySelector(`.kv-lion-wrap[data-real][data-index="${lionIndex}"]`);
}

function mouthPoint() {
  const rect = currentLion().getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 28,
    y: rect.top + rect.height * MOUTH_Y + (Math.random() - 0.5) * 16,
  };
}

function overLion(x, y) {
  const rect = currentLion().getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height * MOUTH_Y;
  return Math.hypot(x - cx, y - cy) < rect.width * 0.36;
}

function setHungry(on) {
  currentLion()?.classList.toggle("is-hungry", on);
}

function placeFlyerEl(el, x, y, scale = 1) {
  const half = (el.offsetWidth || 124) / 2;
  // Separate CSS translate/scale so size can ease differently from movement.
  el.style.translate = `${x - half}px ${y - half}px`;
  el.style.scale = String(scale);
}

function createFlyer(treat) {
  const el = document.createElement("div");
  el.className = "kv-flyer";
  el.innerHTML = `<img src="${TREATS[treat].art}" alt="" draggable="false" />`;
  els.flyLayer.appendChild(el);
  liveFlyers += 1;
  return el;
}

function destroyFlyer(el) {
  el.remove();
  liveFlyers = Math.max(0, liveFlyers - 1);
}

function flyFlyerTo(el, x, y, scale, ms) {
  return new Promise((resolve) => {
    el.style.transition = [
      `translate ${ms}ms ${FLY_MOVE_EASE}`,
      `scale ${ms}ms ${FLY_SCALE_EASE}`,
      `opacity ${ms}ms ${FLY_MOVE_EASE}`,
    ].join(", ");
    requestAnimationFrame(() => {
      placeFlyerEl(el, x, y, scale);
      setTimeout(resolve, ms);
    });
  });
}

function bumpIdle() {
  clearTimeout(idleTimer);
  idleTimer = null;
  if (document.hidden) return;
  idleTimer = setTimeout(() => {
    if (activeDrag || document.hidden) {
      bumpIdle();
      return;
    }
    const treat = TREAT_KEYS[Math.floor(Math.random() * TREAT_KEYS.length)];
    feedByKey(treat, { sound: false });
  }, IDLE_FEED_MS);
}

function slideHtml(lion, i, { clone = false } = {}) {
  const realAttr = clone ? "" : ` data-real id="kvLion-${lion.id}"`;
  const cloneAttr = clone ? ` data-clone="true" aria-hidden="true"` : "";
  return `
    <div class="kv-slide" data-id="${lion.id}"${cloneAttr}>
      <div class="kv-lion-wrap is-idle" data-index="${i}"${realAttr}${cloneAttr}>
        <img src="${lion.art}" alt="${lion.label}" draggable="false" decoding="async" width="768" height="768" />
      </div>
    </div>`;
}

function buildStage() {
  const first = LIONS[0];
  const last = LIONS[LIONS.length - 1];
  const reals = LIONS.map((lion, i) => slideHtml(lion, i)).join("");
  els.track.innerHTML =
    slideHtml(last, LIONS.length - 1, { clone: true }) + reals + slideHtml(first, 0, { clone: true });

  els.dots.innerHTML = LIONS.map(
    (_, i) =>
      `<button type="button" class="kv-dot" data-index="${i}" role="tab" aria-label="Lion ${i + 1}"></button>`
  ).join("");
}

function syncDots() {
  els.dots.querySelectorAll(".kv-dot").forEach((dot, i) => {
    dot.classList.toggle("is-active", i === lionIndex);
  });
}

function setTrack(pos, { animate = true } = {}) {
  trackPos = pos;
  if (animate) els.track.classList.remove("is-instant");
  else els.track.classList.add("is-instant");
  els.track.style.transform = `translateX(${-pos * 100}%)`;
  if (!animate) void els.track.offsetWidth;
}

function normalizeAfterTransition() {
  const n = LIONS.length;
  if (trackPos === n + 1) setTrack(1, { animate: false });
  else if (trackPos === 0) setTrack(n, { animate: false });
  carouselBusy = false;
}

function goNext() {
  if (carouselBusy || activeDrag) return;
  const n = LIONS.length;
  carouselBusy = true;
  lionIndex = (lionIndex + 1) % n;
  syncDots();
  setTrack(trackPos + 1, { animate: true });
  bumpIdle();
}

function goPrev() {
  if (carouselBusy || activeDrag) return;
  const n = LIONS.length;
  carouselBusy = true;
  lionIndex = (lionIndex - 1 + n) % n;
  syncDots();
  setTrack(trackPos - 1, { animate: true });
  bumpIdle();
}

function goTo(index) {
  if (carouselBusy || activeDrag) return;
  const n = LIONS.length;
  const next = ((index % n) + n) % n;
  if (next === lionIndex) {
    setTrack(trackPos, { animate: true });
    return;
  }
  carouselBusy = true;
  lionIndex = next;
  syncDots();
  setTrack(next + 1, { animate: true });
  bumpIdle();
}

function playChomp({ sound = true } = {}) {
  const now = performance.now();
  if (now - lastChompAt < CHOMP_MIN_MS) return;
  lastChompAt = now;
  if (sound) playMunch();
  const lion = currentLion();
  if (!lion) return;
  lion.classList.remove("is-hungry", "is-idle", "is-chomp");
  void lion.offsetWidth;
  lion.classList.add("is-chomp");
  setTimeout(() => {
    lion.classList.remove("is-chomp");
    if (!lion.classList.contains("is-hungry")) lion.classList.add("is-idle");
  }, 520);
}

function playYum() {
  // Never restart mid-cycle — overlapping remove/add + stale timeouts caused flicker.
  if (yumPlaying) return;
  yumPlaying = true;
  const m = mouthPoint();
  const pop = els.pop;
  pop.hidden = false;
  pop.textContent = "Yum!";
  pop.style.left = `${m.x}px`;
  pop.style.top = `${m.y - 40}px`;
  pop.style.opacity = "";
  pop.style.transform = "";
  pop.classList.remove("is-pop");
  void pop.offsetWidth;
  pop.classList.add("is-pop");
  clearTimeout(yumTimer);
  yumTimer = setTimeout(() => {
    pop.classList.remove("is-pop");
    pop.hidden = true;
    yumPlaying = false;
    yumTimer = null;
  }, YUM_MS);
}

function onTreatArrive({ sound = true } = {}) {
  playChomp({ sound });
  playYum();
  bumpIdle();
}

/** Spawn a treat flying into the mouth — can overlap with other flyers. */
async function launchFeed(treat, fromX, fromY, { duration = 420, endScale = 0.35, sound = true } = {}) {
  if (liveFlyers >= MAX_FLYERS) return;
  const el = createFlyer(treat);
  el.style.transition = "none";
  el.style.opacity = "1";
  placeFlyerEl(el, fromX, fromY, 1.05);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const m = mouthPoint();
  await flyFlyerTo(el, m.x, m.y, endScale, duration);
  destroyFlyer(el);
  onTreatArrive({ sound });
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

function onTreatDown(e) {
  const btn = e.currentTarget;
  const treat = btn.dataset.treat;
  if (activeDrag) return;
  if (e.button !== undefined && e.button !== 0) return;
  e.preventDefault();
  ensureAudio();
  bumpIdle();
  const rect = btn.querySelector(".kv-treat-art").getBoundingClientRect();
  activeDrag = {
    btn,
    treat,
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    homeX: rect.left + rect.width / 2,
    homeY: rect.top + rect.height / 2,
    dragging: false,
    busy: false,
    flyerEl: null,
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
  if (!activeDrag || activeDrag.busy || e.pointerId !== activeDrag.pointerId) return;
  const dist = Math.hypot(e.clientX - activeDrag.startX, e.clientY - activeDrag.startY);
  if (!activeDrag.dragging && dist > DRAG_SLOP) {
    if (liveFlyers >= MAX_FLYERS) return;
    activeDrag.dragging = true;
    activeDrag.btn.classList.add("is-lifted");
    activeDrag.flyerEl = createFlyer(activeDrag.treat);
    activeDrag.flyerEl.style.transition = "none";
    activeDrag.flyerEl.style.opacity = "1";
    placeFlyerEl(activeDrag.flyerEl, activeDrag.homeX, activeDrag.homeY, 1.05);
  }
  if (activeDrag.dragging && activeDrag.flyerEl) {
    placeFlyerEl(activeDrag.flyerEl, e.clientX, e.clientY, 1.05);
    setHungry(overLion(e.clientX, e.clientY));
  }
}

function onTreatLostCapture(e) {
  if (!activeDrag || activeDrag.busy || e.pointerId !== activeDrag.pointerId) return;
  onTreatUp(
    new PointerEvent("pointercancel", {
      pointerId: e.pointerId,
      clientX: activeDrag.startX,
      clientY: activeDrag.startY,
      bubbles: true,
    })
  );
}

async function onTreatUp(e) {
  if (!activeDrag || activeDrag.busy || e.pointerId !== activeDrag.pointerId) return;
  const f = activeDrag;
  f.busy = true;
  detachTreatPointerWatch();
  releaseTreatCapture(f);
  // Clear gesture lock immediately so rapid taps can stack flyers.
  activeDrag = null;
  document.body.classList.remove("kv-scroll-lock");

  if (!f.dragging && Math.hypot(e.clientX - f.startX, e.clientY - f.startY) > DRAG_SLOP) {
    f.dragging = true;
    if (!f.flyerEl && liveFlyers < MAX_FLYERS) {
      f.btn.classList.add("is-lifted");
      f.flyerEl = createFlyer(f.treat);
      f.flyerEl.style.transition = "none";
      f.flyerEl.style.opacity = "1";
      placeFlyerEl(f.flyerEl, e.clientX, e.clientY, 1.05);
    }
  }

  try {
    if (!f.dragging) {
      // Tap: spawn a flyer without locking the tray for the whole flight.
      f.btn.classList.remove("is-lifted");
      await launchFeed(f.treat, f.homeX, f.homeY, { duration: 400 });
    } else if (e.type === "pointerup" && f.flyerEl && overLion(e.clientX, e.clientY)) {
      const m = mouthPoint();
      await flyFlyerTo(f.flyerEl, m.x, m.y, 0.35, 220);
      destroyFlyer(f.flyerEl);
      f.flyerEl = null;
      onTreatArrive();
    } else if (f.flyerEl) {
      setHungry(false);
      await flyFlyerTo(f.flyerEl, f.homeX, f.homeY, 1, 260);
      destroyFlyer(f.flyerEl);
      f.flyerEl = null;
    }
  } finally {
    f.btn.classList.remove("is-lifted");
    setHungry(false);
    if (f.flyerEl) {
      destroyFlyer(f.flyerEl);
      f.flyerEl = null;
    }
    bumpIdle();
  }
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

  const inFeed = (target) =>
    feed.contains(target) || target === els.flyLayer || els.flyLayer.contains(target) || target === els.pop;

  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 1 || activeDrag || inFeed(e.target)) e.preventDefault();
    },
    { passive: false }
  );

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
    if (!activeDrag) document.body.classList.remove("kv-scroll-lock");
  };
  document.addEventListener("pointerup", unlockScroll);
  document.addEventListener("pointercancel", unlockScroll);
}

function bindCarousel() {
  els.prev.addEventListener("click", goPrev);
  els.next.addEventListener("click", goNext);
  els.dots.addEventListener("click", (e) => {
    const dot = e.target.closest(".kv-dot");
    if (dot) goTo(Number(dot.dataset.index));
  });
  els.track.addEventListener("transitionend", (e) => {
    if (e.target !== els.track || e.propertyName !== "transform") return;
    normalizeAfterTransition();
  });

  const vp = els.viewport;
  vp.addEventListener("pointerdown", (e) => {
    if (activeDrag || carouselBusy || (e.button !== undefined && e.button !== 0)) return;
    if (e.target.closest(".kv-chevron")) return;
    swipe = {
      active: true,
      startX: e.clientX,
      deltaX: 0,
      baseTx: -trackPos * vp.clientWidth,
    };
    els.track.classList.add("is-instant");
    vp.classList.add("is-dragging");
    vp.setPointerCapture(e.pointerId);
  });
  vp.addEventListener("pointermove", (e) => {
    if (!swipe.active) return;
    swipe.deltaX = e.clientX - swipe.startX;
    els.track.style.transform = `translateX(${swipe.baseTx + swipe.deltaX}px)`;
  });
  const endSwipe = () => {
    if (!swipe.active) return;
    swipe.active = false;
    vp.classList.remove("is-dragging");
    const threshold = Math.min(80, vp.clientWidth * 0.22);
    if (swipe.deltaX <= -threshold) goNext();
    else if (swipe.deltaX >= threshold) goPrev();
    else {
      setTrack(trackPos, { animate: true });
      carouselBusy = false;
    }
  };
  vp.addEventListener("pointerup", endSwipe);
  vp.addEventListener("pointercancel", endSwipe);
}

function bindEvents() {
  els.treats.querySelectorAll(".kv-treat").forEach((btn) => {
    btn.addEventListener("pointerdown", onTreatDown);
  });
  document.addEventListener("keydown", (e) => {
    if (activeDrag) return;
    if (e.key === "ArrowLeft") goPrev();
    else if (e.key === "ArrowRight") goNext();
    else if (e.key === "e" || e.key === "E" || e.key === "1") {
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
  bindCarousel();
  bindToddlerGuards();
}

function feedByKey(treat, { sound = true } = {}) {
  if (liveFlyers >= MAX_FLYERS) return;
  const btn = els.treats.querySelector(`[data-treat="${treat}"]`);
  if (!btn) return;
  if (sound) ensureAudio();
  clearTimeout(idleTimer);
  idleTimer = null;
  const rect = btn.querySelector(".kv-treat-art").getBoundingClientRect();
  launchFeed(treat, rect.left + rect.width / 2, rect.top + rect.height / 2, { duration: 400, sound });
}

async function init() {
  initPageShell("kids-village");
  buildStage();
  buildTreats();
  bindEvents();
  lionIndex = 0;
  setTrack(1, { animate: false });
  syncDots();
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
