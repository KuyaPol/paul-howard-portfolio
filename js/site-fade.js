/* Small cross-page fade plus the About page's mobile menu.
   The main portfolio's existing scene/menu script stays untouched. */
(() => {
  const FLAG = "ph-about-page-fade";
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const readFlag = () => {
    try {
      return window.sessionStorage.getItem(FLAG) === "1";
    } catch {
      return false;
    }
  };

  const setFlag = () => {
    try {
      window.sessionStorage.setItem(FLAG, "1");
    } catch {
      // Navigation works without the fade when storage is unavailable.
    }
  };

  const clearFlag = () => {
    try {
      window.sessionStorage.removeItem(FLAG);
    } catch {
      // Nothing to clear when storage is unavailable.
    }
  };

  if (readFlag()) {
    clearFlag();
    if (!reduced.matches) {
      root.classList.add("ph-fade-entering");
      window.setTimeout(() => root.classList.remove("ph-fade-entering"), 360);
    }
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[data-page-fade]");
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")) return;

    if (reduced.matches) return;

    event.preventDefault();
    setFlag();
    root.classList.add("ph-fade-exiting");
    window.setTimeout(() => {
      window.location.assign(link.href);
    }, 220);
  });

  /* Responsive navigation lives in js/nav.js so it can measure content width. */

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    clearFlag();
    root.classList.remove("ph-fade-exiting", "ph-fade-entering");
  });
})();
