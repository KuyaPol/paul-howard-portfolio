(() => {
  "use strict";

  const STORAGE_KEY = "ph:visitor-tour:v1";
  const VERSION = 1;
  const STATUSES = ["skipped", "in_progress", "completed"];
  const WELCOME_DELAY = 1200;

  const STEPS = [
    {
      label: "SIGNAL",
      title: "Start at SIGNAL",
      copy: "The opening scene is SIGNAL. Use the links above or scroll to move between the five main scenes.",
      scene: "scene-hero",
      target: () => document.querySelector("#hero-title") || document.querySelector("#scene-hero")
    },
    {
      label: "WORK",
      title: "Browse selected work",
      copy: "WORK holds four project records. Open a card to read its deep dive; planned work is clearly marked.",
      scene: "scene-work",
      target: () => document.querySelector("#work-title") || document.querySelector("#scene-work .scene__inner")
    },
    {
      label: "CAPABILITIES",
      title: "See the capabilities",
      copy: "CAPABILITIES groups practical development, IT support, administration, and creative work.",
      scene: "scene-capabilities",
      target: () => document.querySelector("#capabilities-title") || document.querySelector("#scene-capabilities .scene__inner")
    },
    {
      label: "PROFILE",
      title: "Meet the person",
      copy: "PROFILE introduces Paul and the kinetic identity sculpture. View More opens the full About page.",
      scene: "scene-profile",
      target: () => document.querySelector(".profile-copy") || document.querySelector("#profile-title")
    },
    {
      label: "CONTACT",
      title: "Find the contact routes",
      copy: "CONTACT collects the available email, GitHub, and LinkedIn links. Contact is optional.",
      scene: "scene-contact",
      target: () => document.querySelector("#contact-title") || document.querySelector("#scene-contact .contact-layout")
    },
    {
      label: "BEYOND THE PORTFOLIO",
      title: "Enter the lab",
      copy: "BEYOND THE PORTFOLIO is a separate lab for clearly labelled concepts and local tools.",
      scene: "scene-contact",
      target: () => document.querySelector("#lab-inline-title") || document.querySelector(".nav-lab")
    },
    {
      label: "COMPLETION",
      title: "You’re oriented",
      copy: "That’s the full route. Replay Site Tour stays in the navigation whenever you want it again.",
      scene: null,
      target: () => visible(document.querySelector("[data-tour-replay]"))
        ? document.querySelector("[data-tour-replay]")
        : document.querySelector(".scene-progress")
    }
  ];

  const welcome = document.getElementById("tour-welcome");
  const overlay = document.getElementById("visitor-tour");
  if (!welcome || !overlay) return;

  const spotlight = overlay.querySelector("[data-tour-spotlight]");
  const panel = overlay.querySelector(".tour-panel");
  const count = overlay.querySelector("[data-tour-count]");
  const title = overlay.querySelector("[data-tour-title]");
  const copy = overlay.querySelector("[data-tour-copy]");
  const back = overlay.querySelector("[data-tour-back]");
  const next = overlay.querySelector("[data-tour-next]");
  const skip = overlay.querySelector("[data-tour-skip]");
  const live = overlay.querySelector("[data-tour-live]");
  const segments = [...overlay.querySelectorAll(".tour-progress i")];
  const replayButtons = [...document.querySelectorAll("[data-tour-replay]")];

  let memory = null;
  let welcomeTimer = 0;
  let placeTimer = 0;
  let sequence = 0;
  let currentStep = 0;
  let returnFocus = null;

  const pad = (value) => String(value).padStart(2, "0");

  const visible = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0.05;
  };

  const readPreference = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return memory;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== VERSION || !STATUSES.includes(parsed.status)) return null;
      memory = parsed;
      return parsed;
    } catch (_) {
      return memory;
    }
  };

  const writePreference = (status, step = 0) => {
    memory = { status, step, version: VERSION };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    } catch (_) {
      /* Private browsing or blocked storage must never interrupt the tour. */
    }
  };

  const emitTour = (active) => {
    window.dispatchEvent(new CustomEvent("prototype:tour-active", { detail: { active } }));
  };

  const navigate = (sceneId) => new Promise((resolve) => {
    if (!sceneId) {
      resolve();
      return;
    }
    const scene = document.getElementById(sceneId);
    if (scene?.classList.contains("is-active")) {
      resolve();
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener("prototype:scene", onScene);
      window.clearTimeout(timer);
      resolve();
    };
    const onScene = (event) => {
      if (event.detail?.id === sceneId) finish();
    };
    const timer = window.setTimeout(finish, 1400);
    window.addEventListener("prototype:scene", onScene);
    window.location.hash = sceneId;
  });

  const intersects = (a, b, gap = 12) => !(
    a.right + gap <= b.left ||
    a.left - gap >= b.right ||
    a.bottom + gap <= b.top ||
    a.top - gap >= b.bottom
  );

  const place = () => {
    const step = STEPS[currentStep];
    const target = step.target();
    if (!visible(target)) {
      spotlight.style.width = "0px";
      spotlight.style.height = "0px";
      return;
    }

    const rect = target.getBoundingClientRect();
    const mobile = window.innerWidth <= 760;
    const padding = mobile ? 4 : 8;
    const left = Math.max(padding, rect.left - padding);
    const top = Math.max(padding, rect.top - padding);
    const right = Math.min(window.innerWidth - padding, rect.right + padding);
    const bottom = Math.min(window.innerHeight - padding, rect.bottom + padding);
    spotlight.style.left = `${Math.round(left)}px`;
    spotlight.style.top = `${Math.round(top)}px`;
    spotlight.style.width = `${Math.max(0, Math.round(right - left))}px`;
    spotlight.style.height = `${Math.max(0, Math.round(bottom - top))}px`;

    if (mobile) {
      panel.style.left = "16px";
      panel.style.right = "16px";
      panel.style.bottom = "max(16px, env(safe-area-inset-bottom))";
      panel.style.top = "auto";
      return;
    }

    panel.style.right = "auto";
    panel.style.bottom = "auto";
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const gap = 16;
    const candidates = [
      { left: rect.left, top: rect.bottom + gap },
      { left: rect.left, top: rect.top - height - gap },
      { left: rect.right + gap, top: rect.top },
      { left: rect.left - width - gap, top: rect.top }
    ];
    let chosen = null;
    for (const candidate of candidates) {
      const clamped = {
        left: Math.max(gap, Math.min(window.innerWidth - width - gap, candidate.left)),
        top: Math.max(gap, Math.min(window.innerHeight - height - gap, candidate.top))
      };
      const panelRect = {
        left: clamped.left, top: clamped.top,
        right: clamped.left + width, bottom: clamped.top + height
      };
      if (!intersects(rect, panelRect)) {
        chosen = clamped;
        break;
      }
    }
    if (!chosen) {
      chosen = {
        left: Math.max(gap, Math.min(window.innerWidth - width - gap, rect.left)),
        top: Math.max(gap, Math.min(window.innerHeight - height - gap, rect.bottom + gap))
      };
    }
    panel.style.left = `${Math.round(chosen.left)}px`;
    panel.style.top = `${Math.round(chosen.top)}px`;
  };

  const renderStep = (index) => {
    const step = STEPS[index];
    currentStep = index;
    count.textContent = `${pad(index + 1)} / ${pad(STEPS.length)}`;
    title.textContent = step.title;
    copy.textContent = step.copy;
    back.disabled = index === 0;
    next.textContent = index === STEPS.length - 1 ? "Finish" : "Next";
    segments.forEach((segment, i) => segment.classList.toggle("is-done", i <= index));
    live.textContent = `${step.label}. Step ${index + 1} of ${STEPS.length}. ${step.title} ${step.copy}`;
    writePreference("in_progress", index);
    place();
    /* Scene swaps animate for 720ms; re-measure once the DOM settles so the
       spotlight and panel never sit at the outgoing scene's coordinates. */
    window.clearTimeout(placeTimer);
    placeTimer = window.setTimeout(() => {
      if (!overlay.hidden) place();
    }, 800);
  };

  const showStep = async (index) => {
    const token = ++sequence;
    window.clearTimeout(placeTimer);
    await navigate(STEPS[index].scene);
    if (token !== sequence || overlay.hidden) return;
    renderStep(index);
    window.requestAnimationFrame(() => {
      if (token === sequence && !overlay.hidden) place();
    });
  };

  const hideWelcome = () => {
    window.clearTimeout(welcomeTimer);
    welcome.hidden = true;
  };

  const startTour = () => {
    hideWelcome();
    returnFocus = document.activeElement;
    sequence += 1;
    overlay.hidden = false;
    document.body.classList.add("tour-active");
    emitTour(true);
    writePreference("in_progress", 0);
    showStep(0);
    title.focus({ preventScroll: true });
  };

  const endTour = (status) => {
    sequence += 1;
    window.clearTimeout(placeTimer);
    overlay.hidden = true;
    document.body.classList.remove("tour-active");
    emitTour(false);
    writePreference(status, currentStep);
    const focusTarget = status === "completed" || !visible(returnFocus)
      ? document.querySelector("[data-tour-replay]")
      : returnFocus;
    if (visible(focusTarget)) focusTarget.focus({ preventScroll: true });
    returnFocus = null;
  };

  const maybeWelcome = () => {
    if (readPreference()) return;
    if (new URLSearchParams(window.location.search).get("from") === "network") return;
    const hash = window.location.hash.replace("#", "");
    if (hash && hash !== "scene-hero") return;

    welcomeTimer = window.setTimeout(() => {
      if (readPreference()) return;
      const hero = document.getElementById("scene-hero");
      if (!hero?.classList.contains("is-active")) return;
      if (document.querySelector("dialog[open]")) return;
      if (document.visibilityState !== "visible") return;
      welcome.hidden = false;
      const yes = welcome.querySelector("[data-tour-yes]");
      if (visible(yes)) yes.focus({ preventScroll: true });
    }, WELCOME_DELAY);
  };

  welcome.querySelectorAll("[data-tour-no]").forEach((button) => {
    button.addEventListener("click", () => {
      writePreference("skipped", 0);
      hideWelcome();
      const fallback = document.querySelector(".wordmark");
      if (visible(fallback)) fallback.focus({ preventScroll: true });
    });
  });

  welcome.querySelector("[data-tour-yes]")?.addEventListener("click", startTour);

  replayButtons.forEach((button) => {
    button.addEventListener("click", () => {
      hideWelcome();
      startTour();
    });
  });

  back.addEventListener("click", () => {
    if (currentStep > 0) showStep(currentStep - 1);
  });

  next.addEventListener("click", () => {
    if (currentStep === STEPS.length - 1) {
      endTour("completed");
    } else {
      showStep(currentStep + 1);
    }
  });

  skip.addEventListener("click", () => endTour("skipped"));

  document.addEventListener("keydown", (event) => {
    if (overlay.hidden && welcome.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (!overlay.hidden) endTour("skipped");
      else {
        writePreference("skipped", 0);
        hideWelcome();
      }
      return;
    }
    if (event.key === "Tab") {
      const container = overlay.hidden ? welcome : panel;
      const focusable = [...container.querySelectorAll("button:not([disabled])")].filter(visible);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
      return;
    }
    if (!overlay.hidden && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener("prototype:scene", (event) => {
    if (welcome.hidden && event.detail?.id && event.detail.id !== "scene-hero") hideWelcome();
  });

  window.addEventListener("resize", () => {
    if (!overlay.hidden) place();
  }, { passive: true });

  window.addEventListener("pagehide", () => {
    hideWelcome();
    if (!overlay.hidden) emitTour(false);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", maybeWelcome, { once: true });
  } else {
    maybeWelcome();
  }
})();
