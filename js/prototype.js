(() => {
  "use strict";

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const prefersReducedMotion = () => motionQuery.matches;
  const pad = (n) => String(n).padStart(2, "0");

  const SCENE_FADE_MS = 720;
  const NETWORK_ACTIVATE_MS = 640;
  const NETWORK_STATE_KEY = "phase11:network-state";
  const PROJECT_NODE_INDEX = { browser: 0, voice: 1, experiments: 2, serein: 3 };
  const WHEEL_THRESHOLD = 48;
  const WHEEL_IDLE_MS = 220;
  const TOUCH_THRESHOLD = 56;

  const setInert = (element, value) => {
    if (!element) return;
    if ("inert" in element) {
      element.inert = value;
    } else if (value) {
      element.setAttribute("inert", "");
    } else {
      element.removeAttribute("inert");
    }
  };

  const focusSafely = (element) => {
    if (!element) return;
    try {
      element.focus({ preventScroll: true });
    } catch (_) {
      element.focus();
    }
  };

  const emit = (name, detail) => {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  };

  const readNetworkState = () => {
    try {
      const value = JSON.parse(window.sessionStorage.getItem(NETWORK_STATE_KEY) || "null");
      return value && typeof value === "object" ? value : null;
    } catch (_) {
      return null;
    }
  };

  const writeNetworkState = (node) => {
    if (!Object.prototype.hasOwnProperty.call(PROJECT_NODE_INDEX, node)) return;
    try {
      window.sessionStorage.setItem(NETWORK_STATE_KEY, JSON.stringify({
        from: "network",
        node,
        index: PROJECT_NODE_INDEX[node],
        hash: "#scene-project-network",
        updated: Date.now()
      }));
    } catch (_) {
      /* Query parameters on both routes remain the fallback. */
    }
  };

  const openDialogs = () => document.querySelector("dialog[open]");

  const setOverlayActive = (active) => {
    emit("prototype:overlay", { active });
  };

  /* Mobile navigation */
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.getElementById("primary-links");

  const setMenu = (open) => {
    if (!menuToggle || !navLinks) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.textContent = open ? "Close" : "Menu";
    navLinks.classList.toggle("is-open", open);
  };

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    navLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });
  }

  /* Overlay dialogs keep long content out of the fixed scenes and pause the background. */
  let lastDialogTrigger = null;
  const closingDialogs = new WeakSet();

  const openOverlay = (dialog, trigger) => {
    if (!dialog) return;
    lastDialogTrigger = trigger;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    setOverlayActive(true);
  };

  const closeOverlay = (dialog) => {
    if (!dialog || closingDialogs.has(dialog)) return;

    if (!dialog.classList.contains("study-dialog") || prefersReducedMotion()) {
      closingDialogs.delete(dialog);
      dialog.close();
      return;
    }

    closingDialogs.add(dialog);
    dialog.classList.add("is-closing");

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      closingDialogs.delete(dialog);
      dialog.classList.remove("is-closing");
      dialog.close();
    };

    dialog.addEventListener("animationend", finish, { once: true });
    window.setTimeout(finish, 260);
  };

  document.querySelectorAll("[data-dialog]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      openOverlay(document.getElementById(trigger.dataset.dialog), trigger);
    });
  });

  document.querySelectorAll("[data-study]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      openOverlay(document.getElementById(trigger.dataset.study), trigger);
    });
  });

  document.querySelectorAll("dialog.detail-dialog, dialog.study-dialog").forEach((dialog) => {
    dialog.querySelector(".dialog-close")?.addEventListener("click", () => closeOverlay(dialog));

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeOverlay(dialog);
    });

    dialog.addEventListener("cancel", (event) => {
      if (!dialog.classList.contains("study-dialog")) return;
      event.preventDefault();
      closeOverlay(dialog);
    });

    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab" || !dialog.classList.contains("study-dialog")) return;

      const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const inside = dialog.contains(document.activeElement);

      if (event.shiftKey && (document.activeElement === first || !inside)) {
        event.preventDefault();
        focusSafely(last);
      } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
        event.preventDefault();
        focusSafely(first);
      }
    });

    dialog.addEventListener("close", () => {
      dialog.classList.remove("is-closing");
      setOverlayActive(false);
      focusSafely(lastDialogTrigger);
      lastDialogTrigger = null;
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (menuToggle && menuToggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      focusSafely(menuToggle);
    }
  });

  /* Scene architecture: a fixed stage with stacked, crossfading scenes.
     Native scroll snap cannot crossfade without spatial movement or blank frames,
     so input is adapted to one scene at a time. Overflowing content still scrolls natively. */
  const stage = document.querySelector(".scene-stage");
  const scenes = [...document.querySelectorAll("[data-scene]")];
  const progressCurrent = document.querySelector(".progress-current");
  const progressTotal = document.querySelector(".progress-total");
  const fallbackLayers = [...document.querySelectorAll("[data-fallback]")];

  if (!stage || !scenes.length) return;

  let background = null;

  try {
    setupSceneStage();
    setupBackground();
    setupCrossPageProject();
  } catch (_) {
    document.documentElement.classList.remove("has-scenes", "has-webgl");
    background?.dispose();
    background = null;
  }

  function setupSceneStage() {
    if (progressTotal) progressTotal.textContent = pad(scenes.length);

    document.documentElement.classList.add("has-scenes");

    let activeIndex = -1;
    let leaveTimer = 0;
    let navLockUntil = 0;

    let wheelAccumulator = 0;
    let wheelGestureActive = false;
    let lastWheelTime = 0;

    let touchStartY = null;
    let touchStartTarget = null;

    const clamp = (index) => Math.max(0, Math.min(scenes.length - 1, index));
    const currentVisual = () => scenes[activeIndex]?.dataset.visual || "hero";

    const setHash = (id, mode) => {
      if (!id || mode === "none") return;
      const next = `#${id}`;
      if (window.location.hash === next) return;
      try {
        if (mode === "push" && window.history.pushState) {
          window.history.pushState({ scene: id }, "", next);
        } else if (window.history.replaceState) {
          window.history.replaceState({ scene: id }, "", next);
        } else {
          window.location.hash = id;
        }
      } catch (_) {
        /* Hash updates are cosmetic; navigation still works without them. */
      }
    };

    const refreshInnerFocus = () => {
      scenes.forEach((scene) => {
        const inner = scene.querySelector(".scene__inner");
        if (!inner) return;
        const scrollable = inner.scrollHeight > inner.clientHeight + 2;
        inner.dataset.scrollable = String(scrollable);
        if (scrollable) {
          inner.setAttribute("tabindex", "0");
          inner.setAttribute("aria-label", "Scroll within this scene");
        } else {
          inner.removeAttribute("tabindex");
          inner.removeAttribute("aria-label");
        }
      });
    };

    const setActiveScene = (index, { moveFocus = false, historyMode = "replace" } = {}) => {
      const nextIndex = clamp(index);
      if (nextIndex === activeIndex) return false;

      const previousIndex = activeIndex;
      const previousScene = scenes[previousIndex];
      const focusedInPrevious = Boolean(previousScene?.contains(document.activeElement));

      activeIndex = nextIndex;
      window.clearTimeout(leaveTimer);
      scenes.forEach((scene) => scene.classList.remove("is-leaving"));

      scenes.forEach((scene, i) => {
        const isActive = i === nextIndex;
        const isLeaving = i === previousIndex && !isActive;
        scene.classList.toggle("is-active", isActive);
        scene.classList.toggle("is-leaving", isLeaving);
        setInert(scene, !isActive);
        if (isActive) scene.removeAttribute("aria-hidden");
        else scene.setAttribute("aria-hidden", "true");
      });

      if (previousIndex >= 0 && previousIndex !== nextIndex) {
        leaveTimer = window.setTimeout(() => {
          scenes[previousIndex]?.classList.remove("is-leaving");
        }, SCENE_FADE_MS + 80);
      }

      if (progressCurrent) progressCurrent.textContent = pad(nextIndex + 1);

      document.querySelectorAll('.nav-links a[href^="#"]').forEach((link) => {
        if (link.getAttribute("href") === `#${scenes[nextIndex].id}`) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      const visual = currentVisual();
      fallbackLayers.forEach((layer) => {
        layer.classList.toggle("is-active", layer.dataset.fallback === visual);
      });

      setHash(scenes[nextIndex].id, historyMode);
      emit("prototype:scene", { index: nextIndex, id: scenes[nextIndex].id, visual });

      if (moveFocus && focusedInPrevious) {
        const target = scenes[nextIndex].querySelector("[data-scene-focus]") ||
          scenes[nextIndex].querySelector(".scene__inner");
        requestAnimationFrame(() => focusSafely(target));
      }

      return true;
    };

    const goToScene = (index, options) => setActiveScene(index, options);

    const scrollableInnerFor = (target) => {
      if (!(target instanceof Element)) return null;
      return target.closest('.scene__inner[data-scrollable="true"]');
    };

    const canScrollWithin = (inner, direction) => {
      if (!inner) return false;
      const max = inner.scrollHeight - inner.clientHeight;
      if (max <= 2) return false;
      if (direction > 0) return inner.scrollTop < max - 2;
      if (direction < 0) return inner.scrollTop > 2;
      return false;
    };

    const normalizedWheelDelta = (event) => {
      let delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      else if (event.deltaMode === 2) delta *= window.innerHeight;
      return delta;
    };

    window.addEventListener("wheel", (event) => {
      const now = performance.now();
      if (now - lastWheelTime > WHEEL_IDLE_MS) {
        wheelGestureActive = false;
        wheelAccumulator = 0;
      }
      lastWheelTime = now;

      if (openDialogs() || event.ctrlKey) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      const inner = scrollableInnerFor(event.target);
      const delta = normalizedWheelDelta(event);
      if (inner && canScrollWithin(inner, delta)) return;

      if (wheelGestureActive || now < navLockUntil) {
        event.preventDefault();
        return;
      }

      wheelAccumulator += delta;
      if (Math.abs(wheelAccumulator) < WHEEL_THRESHOLD) return;

      const direction = wheelAccumulator > 0 ? 1 : -1;
      wheelAccumulator = 0;
      wheelGestureActive = true;
      navLockUntil = now + SCENE_FADE_MS + 40;
      event.preventDefault();
      goToScene(activeIndex + direction, { historyMode: "replace" });
    }, { passive: false });

    stage.addEventListener("touchstart", (event) => {
      if (openDialogs() || event.touches.length !== 1) return;
      touchStartY = event.touches[0].clientY;
      touchStartTarget = event.target;
    }, { passive: true });

    stage.addEventListener("touchend", (event) => {
      if (touchStartY === null || openDialogs() || event.changedTouches.length !== 1) return;

      const delta = touchStartY - event.changedTouches[0].clientY;
      const target = touchStartTarget;
      touchStartY = null;
      touchStartTarget = null;

      if (Math.abs(delta) < TOUCH_THRESHOLD) return;

      const inner = scrollableInnerFor(target);
      if (inner && canScrollWithin(inner, delta)) return;

      const now = performance.now();
      if (now < navLockUntil) return;
      navLockUntil = now + SCENE_FADE_MS + 40;
      goToScene(activeIndex + (delta > 0 ? 1 : -1), { historyMode: "replace" });
    }, { passive: true });

    const sceneKeys = new Set(["ArrowDown", "PageDown", "ArrowUp", "PageUp", "Home", "End"]);

    document.addEventListener("keydown", (event) => {
      if (!sceneKeys.has(event.key) || event.repeat) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (openDialogs()) return;
      if (menuToggle?.getAttribute("aria-expanded") === "true") return;

      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

      const inner = scrollableInnerFor(target);
      if (inner) {
        const goingDown = event.key === "ArrowDown" || event.key === "PageDown";
        const goingUp = event.key === "ArrowUp" || event.key === "PageUp";
        if ((goingDown && canScrollWithin(inner, 1)) || (goingUp && canScrollWithin(inner, -1))) return;
        if (event.key === "Home" && inner.scrollTop > 2) return;
        if (event.key === "End" && inner.scrollTop < inner.scrollHeight - inner.clientHeight - 2) return;
      }

      const now = performance.now();
      if (now < navLockUntil) {
        event.preventDefault();
        return;
      }

      let nextIndex = activeIndex;
      if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = scenes.length - 1;
      else nextIndex = activeIndex + (event.key === "ArrowDown" || event.key === "PageDown" ? 1 : -1);

      if (nextIndex < 0 || nextIndex >= scenes.length || nextIndex === activeIndex) return;
      event.preventDefault();
      navLockUntil = now + SCENE_FADE_MS + 40;
      goToScene(nextIndex, { moveFocus: true, historyMode: "replace" });
    });

    document.addEventListener("click", (event) => {
      const link = event.target.closest?.('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute("href").slice(1);
      const index = scenes.findIndex((scene) => scene.id === id);
      if (index < 0) return;
      event.preventDefault();
      setMenu(false);
      setHash(id, "push");
      goToScene(index, { moveFocus: true, historyMode: "none" });
    });

    const syncFromHash = () => {
      const id = window.location.hash.slice(1);
      const index = scenes.findIndex((scene) => scene.id === id);
      if (index >= 0) goToScene(index, { historyMode: "none" });
    };

    window.addEventListener("popstate", syncFromHash);
    window.addEventListener("hashchange", syncFromHash);

    let resizeTimer = 0;
    const handleResize = () => {
      refreshInnerFocus();
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => emit("prototype:resize"), 80);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.visualViewport?.addEventListener("resize", handleResize, { passive: true });
    document.fonts?.ready.then(refreshInnerFocus);

    const initialParams = new URLSearchParams(window.location.search);
    const isProjectReturn = initialParams.get("from") === "network" &&
      Object.prototype.hasOwnProperty.call(PROJECT_NODE_INDEX, initialParams.get("node"));
    const initialId = isProjectReturn ? "scene-project-network" : window.location.hash.slice(1);
    const initialIndex = Math.max(0, scenes.findIndex((scene) => scene.id === initialId));

    setActiveScene(initialIndex, { historyMode: "replace" });
    refreshInnerFocus();
    setupNetwork();
  }

  /* Phase 10 — HTML controls stay the source of truth for node names, copy,
     destinations, focus order, and activation. The WebGL scene mirrors them. */
  function setupNetwork() {
    const scene = document.querySelector(".scene-network");
    const nodes = [...document.querySelectorAll("[data-network-node]")];
    const detail = document.getElementById("network-detail");
    if (!scene || !nodes.length) return;

    const fields = {
      kicker: detail?.querySelector(".network-detail__kicker"),
      title: detail?.querySelector(".network-detail__title"),
      copy: detail?.querySelector(".network-detail__copy"),
      action: detail?.querySelector(".network-detail__action")
    };
    const idle = {
      kicker: fields.kicker?.textContent || "NETWORK / IDLE",
      title: fields.title?.textContent || "Choose a node",
      copy: fields.copy?.textContent || "",
      action: fields.action?.textContent || ""
    };

    let activationTimer = 0;
    let selectedNode = null;

    const writeDetail = (data) => {
      if (fields.kicker) fields.kicker.textContent = data.kicker;
      if (fields.title) fields.title.textContent = data.title;
      if (fields.copy) fields.copy.textContent = data.copy;
      if (fields.action) fields.action.textContent = data.action;
    };

    const preview = (node) => {
      writeDetail({
        kicker: node.dataset.previewKicker || "NODE / PREVIEW",
        title: node.dataset.previewTitle || "",
        copy: node.dataset.previewCopy || "",
        action: `${node.dataset.previewMeta || "EXISTING DESTINATION"} · ACTIVATE TO OPEN`
      });
    };

    const clearPreview = () => {
      if (selectedNode) {
        preview(selectedNode);
        return;
      }
      writeDetail(idle);
    };

    const activate = (node) => {
      window.clearTimeout(activationTimer);
      selectedNode = node;
      nodes.forEach((item) => {
        item.classList.toggle("is-selected", item === node);
        item.classList.toggle("is-previewed", item === node);
      });
      preview(node);
      scene.classList.add("is-departing");
      const nodeId = node.dataset.nodeId;
      const index = Number(node.dataset.nodeIndex || 0);
      emit("prototype:network-select", { id: nodeId, index });

      if (Object.prototype.hasOwnProperty.call(PROJECT_NODE_INDEX, nodeId)) {
        writeNetworkState(nodeId);
        try {
          const next = new URL(window.location.href);
          next.searchParams.set("from", "network");
          next.searchParams.set("node", nodeId);
          next.searchParams.set("focus", "1");
          next.hash = "#scene-project-network";
          window.history.replaceState(window.history.state, "", `${next.pathname}${next.search}${next.hash}`);
        } catch (_) {
          /* Navigation still works without a rewritten history URL. */
        }
      }

      activationTimer = window.setTimeout(() => {
        const dialogId = node.dataset.targetDialog;
        if (dialogId) {
          const dialog = document.getElementById(dialogId);
          if (dialog) openOverlay(dialog, node);
          return;
        }
        const destination = node.dataset.destination;
        if (destination) window.location.assign(destination);
      }, prefersReducedMotion() ? 0 : NETWORK_ACTIVATE_MS);
    };

    const restoreProjectReturn = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("from") !== "network") return;

      let nodeId = params.get("node");
      if (!Object.prototype.hasOwnProperty.call(PROJECT_NODE_INDEX, nodeId)) {
        nodeId = readNetworkState()?.node;
      }
      if (!Object.prototype.hasOwnProperty.call(PROJECT_NODE_INDEX, nodeId)) return;

      const node = nodes.find((item) => item.dataset.nodeId === nodeId);
      if (!node) return;

      scene.classList.remove("is-departing");
      selectedNode = node;
      nodes.forEach((item) => {
        item.classList.toggle("is-selected", item === node);
        item.classList.toggle("is-previewed", item === node);
      });
      preview(node);
      const restoreDetail = {
        id: nodeId,
        index: PROJECT_NODE_INDEX[nodeId]
      };
      window.__prototypeNetworkRestore = restoreDetail;
      emit("prototype:network-restore", restoreDetail);

      if (params.get("focus") === "1") {
        window.requestAnimationFrame(() => focusSafely(node));
      }
    };

    nodes.forEach((node) => {
      node.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "touch") return;
        node.classList.add("is-previewed");
        preview(node);
      });

      node.addEventListener("pointerleave", () => {
        if (node === selectedNode) return;
        node.classList.remove("is-previewed");
        clearPreview();
      });

      node.addEventListener("focus", () => {
        node.classList.add("is-previewed");
        preview(node);
      });

      node.addEventListener("blur", () => {
        if (node === selectedNode) return;
        node.classList.remove("is-previewed");
        clearPreview();
      });

      node.addEventListener("click", (event) => {
        event.preventDefault();
        activate(node);
      });
    });

    restoreProjectReturn();

    window.addEventListener("pageshow", (event) => {
      if (event.persisted) restoreProjectReturn();
    });

    window.addEventListener("prototype:overlay", (event) => {
      if (event.detail?.active) return;
      window.clearTimeout(activationTimer);
      scene.classList.remove("is-departing");
      nodes.forEach((node) => node.classList.remove("is-selected", "is-previewed"));
      selectedNode = null;
      writeDetail(idle);
      emit("prototype:network-reset", {});
    });
  }

  /* Phase 11 addendum, extended in Phase 16: all four project nodes now use
     dedicated destinations. Old Work-dialog URLs are redirected so no project
     lands on a brief panel. */
  function setupCrossPageProject() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("from") !== "network") return;

    const projectRoot = document.body.classList.contains("lab-page")
      ? "../projects/"
      : "projects/";
    const routes = {
      browser: `${projectRoot}browser-tracker.html?from=network&node=browser`,
      voice: `${projectRoot}live-voice-to-text.html?from=network&node=voice`,
      experiments: `${projectRoot}interactive-experiments.html?from=network&node=experiments`,
      serein: `${projectRoot}serein.html?from=network&node=serein`
    };
    const target = routes[params.get("project")];
    if (target) window.location.replace(target);
  }

  function setupBackground() {
    const canvas = document.getElementById("scene-canvas");
    if (!canvas) return;

    const supportsWebGL = () => {
      try {
        const probe = document.createElement("canvas");
        const context = probe.getContext("webgl2") || probe.getContext("webgl");
        if (!context) return false;
        context.getExtension("WEBGL_lose_context")?.loseContext();
        return true;
      } catch (_) {
        return false;
      }
    };

    const finePointer = window.matchMedia
      ? window.matchMedia("(pointer: fine)").matches
      : true;

    const eligible = () =>
      !prefersReducedMotion() &&
      window.innerWidth >= 900 &&
      finePointer &&
      typeof window.WebGLRenderingContext !== "undefined" &&
      supportsWebGL();

    if (!eligible()) {
      document.documentElement.classList.add("no-webgl");
      return;
    }

    import("./prototype-scene.js")
      .then(({ createSceneBackground }) => {
        background = createSceneBackground({ canvas, reducedMotion: false });
        document.documentElement.classList.add(background ? "has-webgl" : "no-webgl");
        if (window.__prototypeNetworkRestore) {
          emit("prototype:network-restore", window.__prototypeNetworkRestore);
        }
      })
      .catch(() => {
        document.documentElement.classList.add("no-webgl");
      });
  }
})();
