/* Global refresh reset: any real reload returns to the opening SIGNAL scene.
   Loaded in <head> before the page body so the previous page cannot flash. */
(() => {
  "use strict";

  const REDIRECT_FLAG = "ph-reload-to-signal";
  const TRANSIENT_KEYS = ["phase11:network-state", "ph-about-page-fade"];

  const clearTransientState = () => {
    try {
      TRANSIENT_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
    } catch (_) {
      /* Storage can be unavailable; page navigation still works. */
    }
  };

  let isRedirectTarget = false;
  try {
    isRedirectTarget = window.sessionStorage.getItem(REDIRECT_FLAG) === "1";
    window.sessionStorage.removeItem(REDIRECT_FLAG);
  } catch (_) {
    /* Storage can be unavailable; navigation-type detection remains. */
  }

  if (isRedirectTarget) {
    clearTransientState();
    return;
  }

  const navigationEntry = window.performance.getEntriesByType?.("navigation")[0];
  const isReload = navigationEntry
    ? navigationEntry.type === "reload"
    : window.performance.navigation?.type === 1;

  if (!isReload) return;

  clearTransientState();

  let home;
  try {
    const scriptUrl = new URL(document.currentScript.src);
    home = new URL(scriptUrl.pathname.includes("/js/") ? "../" : "./", scriptUrl);
  } catch (_) {
    home = new URL("./", window.location.href);
  }

  home.search = "";
  home.hash = "scene-hero";

  const current = new URL(window.location.href);
  const sameDocument = current.origin === home.origin &&
    current.pathname === home.pathname &&
    current.search === home.search;

  /* A hash-only update does not create a new document, so no guard is needed. */
  if (!sameDocument) {
    try {
      window.sessionStorage.setItem(REDIRECT_FLAG, "1");
    } catch (_) {
      /* The redirect is still safe if the guard cannot be written. */
    }
  }

  window.location.replace(home.href);
})();
