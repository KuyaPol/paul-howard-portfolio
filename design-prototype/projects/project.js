(() => {
  "use strict";

  const STATE_KEY = "phase11:network-state";
  const VALID_NODES = new Set(["browser", "voice", "experiments"]);
  const body = document.body;
  const project = body?.dataset.project || "";
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("node") || project;
  const node = VALID_NODES.has(requested) ? requested : project;

  const state = {
    from: "network",
    node,
    index: node === "browser" ? 0 : node === "voice" ? 1 : 2,
    hash: "#scene-project-network",
    updated: Date.now()
  };

  const persistState = () => {
    try {
      window.sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (_) {
      /* Return links still carry the state in their query string. */
    }
  };

  const returnHref = () => {
    const query = new URLSearchParams({
      from: "network",
      node,
      focus: "1"
    });
    return `../beyond-the-portfolio.html?${query.toString()}#scene-project-network`;
  };

  const applyReturnLinks = () => {
    document.querySelectorAll("[data-network-return]").forEach((link) => {
      link.setAttribute("href", returnHref());
    });
  };

  persistState();
  applyReturnLinks();

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    persistState();
    applyReturnLinks();
  });

  const flow = document.querySelector("[data-flow]");
  if (flow) {
    const steps = [...flow.querySelectorAll("[data-flow-step]")];
    const label = flow.querySelector(".flow-detail [data-flow-label]");
    const title = flow.querySelector(".flow-detail [data-flow-title]");
    const copy = flow.querySelector(".flow-detail [data-flow-copy]");
    const status = flow.querySelector(".flow-detail [data-flow-status]");

    const selectStep = (step) => {
      if (!step) return;
      steps.forEach((item) => {
        const active = item === step;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-expanded", String(active));
      });
      if (label) label.textContent = step.dataset.flowLabel || "";
      if (title) title.textContent = step.dataset.flowTitle || "";
      if (copy) copy.textContent = step.dataset.flowCopy || "";
      if (status) status.textContent = step.dataset.flowStatus || "";
    };

    steps.forEach((step, index) => {
      step.addEventListener("click", () => selectStep(step));
      step.addEventListener("keydown", (event) => {
        const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % steps.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + steps.length) % steps.length;
        else if (event.key === "Home") next = 0;
        else next = steps.length - 1;
        steps[next].focus();
        selectStep(steps[next]);
      });
    });

    selectStep(steps.find((step) => step.classList.contains("is-active")) || steps[0]);
  }

  const markReady = () => document.documentElement.classList.add("is-project-ready");
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    markReady();
  } else {
    window.requestAnimationFrame(() => window.requestAnimationFrame(markReady));
  }
})();
