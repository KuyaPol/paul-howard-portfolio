(() => {
  "use strict";

  const REPLAY_LABEL = "Replay Site Tour";
  const COMPACT_REPLAY_LABEL = "Site Tour / Replay Tour";
  const SAFETY_PX = 12;

  const api = {
    open: () => {},
    close: () => {},
    isOpen: () => false,
    isCompact: () => false,
    menuButton: () => null,
    onModeChange: () => () => {}
  };
  window.PortfolioNav = api;

  const nav = document.querySelector(".nav[data-responsive-nav]");
  if (!nav) return;

  const wordmark = nav.querySelector(".wordmark");
  const desktopLinks = nav.querySelector(".nav-links");
  const compactMenu = nav.querySelector(".compact-links");
  const toggle = nav.querySelector(".menu-toggle");
  if (!wordmark || !desktopLinks || !toggle) return;

  const dropdown = compactMenu || desktopLinks;
  const replayButton = document.querySelector("[data-tour-replay]");
  const footerHost = document.querySelector("[data-tour-replay-host]");
  const listeners = new Set();

  let compact = false;
  let menuOpen = false;
  let measured = false;
  let measuring = false;

  const setToggle = (open) => {
    toggle.textContent = open ? "Close" : "Menu";
    toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    toggle.setAttribute("aria-expanded", String(open));
  };

  const setMenu = (open, restoreFocus = false) => {
    const allowed = compact && open;
    menuOpen = allowed;
    dropdown.classList.toggle("is-open", menuOpen);
    setToggle(menuOpen);
    if (restoreFocus && !menuOpen) toggle.focus({ preventScroll: true });
  };

  api.open = () => setMenu(true);
  api.close = () => setMenu(false);
  api.isOpen = () => menuOpen;
  api.isCompact = () => compact;
  api.menuButton = () => toggle;
  api.onModeChange = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  toggle.setAttribute("aria-controls", dropdown.id || "primary-links");
  setToggle(false);

  const placeReplayButton = () => {
    if (!replayButton) return;
    const host = compact && compactMenu ? compactMenu : footerHost;
    if (!host) return;
    if (replayButton.parentElement !== host) host.appendChild(replayButton);
    replayButton.textContent = compact ? COMPACT_REPLAY_LABEL : REPLAY_LABEL;
    replayButton.setAttribute(
      "aria-label",
      compact ? "Start or replay the guided site tour" : "Replay the guided site tour"
    );
  };

  const measureRequiredWidth = () => {
    if (measuring) return null;
    measuring = true;
    nav.classList.add("is-measuring");

    const wordmarkRect = wordmark.getBoundingClientRect();
    const linksRect = desktopLinks.getBoundingClientRect();
    const navStyle = getComputedStyle(nav);
    const wordmarkStyle = getComputedStyle(wordmark);
    const linksStyle = getComputedStyle(desktopLinks);

    const gap = parseFloat(navStyle.columnGap) || 0;
    const leftMargin = parseFloat(wordmarkStyle.marginLeft) || 0;
    const rightMargin = parseFloat(linksStyle.marginRight) || 0;

    nav.classList.remove("is-measuring");
    measuring = false;

    return wordmarkRect.width + linksRect.width + gap + leftMargin + rightMargin + SAFETY_PX;
  };

  const update = () => {
    const required = measureRequiredWidth();
    if (required === null || !Number.isFinite(required)) return;

    const shouldCompact = nav.clientWidth < required;
    const changed = !measured || shouldCompact !== compact;
    compact = shouldCompact;
    measured = true;

    nav.classList.add("is-measured");
    nav.classList.toggle("is-compact", compact);

    if (!changed) return;
    setMenu(false);
    placeReplayButton();
    window.dispatchEvent(new CustomEvent("prototype:nav-mode", { detail: { compact } }));
    listeners.forEach((listener) => listener({ compact }));
  };

  const scheduleUpdate = () => window.requestAnimationFrame(update);

  toggle.addEventListener("click", () => setMenu(!menuOpen));

  dropdown.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) setMenu(false);
  });

  document.addEventListener("pointerdown", (event) => {
    if (menuOpen && !nav.contains(event.target)) setMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !menuOpen) return;
    event.preventDefault();
    event.stopPropagation();
    setMenu(false, true);
  });

  window.addEventListener("resize", scheduleUpdate, { passive: true });
  window.addEventListener("orientationchange", scheduleUpdate, { passive: true });
  window.addEventListener("load", scheduleUpdate, { once: true });
  if ("ResizeObserver" in window) {
    new ResizeObserver(scheduleUpdate).observe(nav);
  }
  if (document.fonts?.ready) document.fonts.ready.then(scheduleUpdate);
  scheduleUpdate();
})();
