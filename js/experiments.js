(() => {
  "use strict";

  const bench = document.querySelector("[data-lab-bench]");
  const canvas = bench?.querySelector("[data-lab-canvas]");
  const ctx = canvas?.getContext("2d");
  if (!bench || !canvas || !ctx) return;

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || false;
  const tabs = [...bench.querySelectorAll("[data-lab-tab]")];
  const panels = [...bench.querySelectorAll("[data-lab-panel]")];
  const hudName = bench.querySelector("[data-lab-hud-name]");
  const hudState = bench.querySelector("[data-lab-hud-state]");
  const live = bench.querySelector("[data-lab-live]");
  const toggle = bench.querySelector("[data-lab-toggle]");

  const pointer = { x: 0, y: 0, active: false };
  const view = { w: 0, h: 0, dpr: 1 };
  const model = {
    active: tabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.labTab || tabs[0]?.dataset.labTab || "field",
    running: !reduced,
    visible: true,
    disposed: false,
    raf: 0,
    last: 0,
    time: 0,
    field: {
      strength: 0.8,
      mode: "repel",
      seed: 91,
      particles: []
    },
    network: {
      density: 12,
      seed: 24,
      auto: true,
      nodes: [],
      edges: [],
      pulses: [],
      nextPulse: 0,
      hovered: -1
    },
    wave: {
      frequency: 2.2,
      amplitude: 0.58,
      seed: 7,
      offsets: []
    }
  };

  const announce = (message) => {
    if (live) live.textContent = message;
  };

  const random = (seed) => {
    let value = seed >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const paintGrid = () => {
    const step = 28;
    ctx.strokeStyle = "rgba(200, 169, 255, 0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = step; x < view.w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, view.h);
    }
    for (let y = step; y < view.h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(view.w, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 184, 108, 0.16)";
    ctx.strokeRect(10.5, 10.5, Math.max(0, view.w - 21), Math.max(0, view.h - 21));
  };

  const buildField = () => {
    const rand = random(model.field.seed);
    const count = Math.min(90, Math.max(36, Math.round((view.w * view.h) / 9000)));
    model.field.particles = Array.from({ length: count }, () => ({
      x: 16 + rand() * Math.max(1, view.w - 32),
      y: 16 + rand() * Math.max(1, view.h - 32),
      vx: (rand() - 0.5) * 0.18,
      vy: (rand() - 0.5) * 0.18,
      r: 0.9 + rand() * 1.4
    }));
  };

  const buildNetwork = () => {
    const rand = random(model.network.seed);
    const count = model.network.density;
    const nodes = Array.from({ length: count }, (_, index) => ({
      x: 44 + rand() * Math.max(1, view.w - 88),
      y: 38 + rand() * Math.max(1, view.h - 76),
      label: String(index + 1).padStart(2, "0")
    }));

    const edges = [];
    nodes.forEach((node, index) => {
      const nearest = nodes
        .map((other, otherIndex) => ({
          otherIndex,
          distance: (node.x - other.x) ** 2 + (node.y - other.y) ** 2
        }))
        .filter((item) => item.otherIndex !== index)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2);

      nearest.forEach(({ otherIndex }) => {
        const a = Math.min(index, otherIndex);
        const b = Math.max(index, otherIndex);
        if (!edges.some((edge) => edge.a === a && edge.b === b)) edges.push({ a, b });
      });
    });

    model.network.nodes = nodes;
    model.network.edges = edges;
    model.network.pulses = [];
    model.network.hovered = -1;
    model.network.nextPulse = model.time + 420;
  };

  const buildWave = () => {
    const rand = random(model.wave.seed);
    model.wave.offsets = Array.from({ length: 3 }, () => rand() * Math.PI * 2);
  };

  const buildScene = () => {
    if (model.active === "field") buildField();
    else if (model.active === "network") buildNetwork();
    else buildWave();
  };

  const updateField = (dt) => {
    const scale = Math.min(1.6, dt / 16);
    model.field.particles.forEach((p) => {
      if (pointer.active) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        const radius = Math.min(170, view.w * 0.28);
        if (distance < radius) {
          const falloff = (1 - distance / radius) * model.field.strength;
          const direction = model.field.mode === "repel" ? 1 : -1;
          p.vx += (dx / distance) * falloff * 0.42 * direction * scale;
          p.vy += (dy / distance) * falloff * 0.42 * direction * scale;
        }
      }
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.x += p.vx * scale;
      p.y += p.vy * scale;
      if (p.x < 12) p.x = view.w - 12;
      if (p.x > view.w - 12) p.x = 12;
      if (p.y < 12) p.y = view.h - 12;
      if (p.y > view.h - 12) p.y = 12;
    });
  };

  const drawField = () => {
    const warm = model.field.mode === "attract";
    ctx.fillStyle = warm ? "rgba(255, 184, 108, 0.9)" : "rgba(200, 169, 255, 0.85)";
    ctx.strokeStyle = warm ? "rgba(255, 184, 108, 0.16)" : "rgba(200, 169, 255, 0.14)";
    ctx.lineWidth = 1;

    model.field.particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    if (pointer.active) {
      const radius = Math.min(170, view.w * 0.28);
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 184, 108, 0.95)";
      ctx.fill();
    }
  };

  const sendPulse = () => {
    const edges = model.network.edges;
    if (!edges.length) return;
    const index = Math.floor(Math.random() * edges.length);
    model.network.pulses.push({ edge: index, t: 0, speed: 0.55 + Math.random() * 0.55 });
    if (model.network.pulses.length > 18) model.network.pulses.shift();
  };

  const updateNetwork = (dt) => {
    if (model.network.auto && model.time >= model.network.nextPulse) {
      sendPulse();
      model.network.nextPulse = model.time + 620;
    }
    model.network.pulses.forEach((pulse) => {
      pulse.t += (dt / 1000) * pulse.speed;
    });
    model.network.pulses = model.network.pulses.filter((pulse) => pulse.t <= 1);
  };

  const drawNetwork = () => {
    const nodes = model.network.nodes;
    const edges = model.network.edges;

    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(200, 169, 255, 0.2)";
    edges.forEach((edge) => {
      const a = nodes[edge.a];
      const b = nodes[edge.b];
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    model.network.pulses.forEach((pulse) => {
      const edge = edges[pulse.edge];
      if (!edge) return;
      const a = nodes[edge.a];
      const b = nodes[edge.b];
      if (!a || !b) return;
      const eased = pulse.t * pulse.t * (3 - 2 * pulse.t);
      const x = a.x + (b.x - a.x) * eased;
      const y = a.y + (b.y - a.y) * eased;
      ctx.fillStyle = "rgba(255, 184, 108, 0.95)";
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    nodes.forEach((node, index) => {
      const hovered = index === model.network.hovered;
      ctx.fillStyle = hovered ? "rgba(255, 184, 108, 0.95)" : "rgba(200, 169, 255, 0.72)";
      ctx.beginPath();
      ctx.arc(node.x, node.y, hovered ? 5.5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
      if (hovered) {
        ctx.strokeStyle = "rgba(255, 184, 108, 0.42)";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  };

  const updateWave = (dt) => {
    model.wave.offsets.forEach((offset, index) => {
      model.wave.offsets[index] = offset + (dt / 1000) * (0.2 + index * 0.08);
    });
  };

  const drawWave = () => {
    const layers = 3;
    const mid = view.h / 2;
    for (let layer = 0; layer < layers; layer += 1) {
      const amplitude = (view.h * 0.16) * model.wave.amplitude * (1 - layer * 0.19);
      const phase = model.wave.offsets[layer] + (pointer.active ? (pointer.x / Math.max(1, view.w)) * 1.4 : 0);
      ctx.beginPath();
      ctx.lineWidth = layer === 0 ? 2 : 1;
      ctx.strokeStyle = layer === 0
        ? "rgba(200, 169, 255, 0.9)"
        : `rgba(255, 184, 108, ${0.42 - layer * 0.1})`;
      for (let x = 16; x <= view.w - 16; x += 3) {
        const normalized = (x - 16) / Math.max(1, view.w - 32);
        const envelope = Math.sin(Math.PI * normalized);
        const y = mid
          + Math.sin(normalized * Math.PI * 2 * model.wave.frequency + phase) * amplitude * envelope
          + Math.sin(normalized * Math.PI * 2 * model.wave.frequency * 0.37 - phase * 0.6) * amplitude * 0.24;
        if (x === 16) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(241, 245, 242, 0.12)";
    ctx.beginPath();
    ctx.moveTo(16, mid);
    ctx.lineTo(view.w - 16, mid);
    ctx.stroke();
  };

  const update = (dt) => {
    if (model.active === "field") updateField(dt);
    else if (model.active === "network") updateNetwork(dt);
    else updateWave(dt);
  };

  const render = () => {
    if (!view.w || !view.h) return;
    ctx.clearRect(0, 0, view.w, view.h);
    paintGrid();
    if (model.active === "field") drawField();
    else if (model.active === "network") drawNetwork();
    else drawWave();
  };

  const frame = (now) => {
    if (model.disposed || !model.running || !model.visible || reduced) {
      model.raf = 0;
      return;
    }
    const dt = model.last ? Math.min(40, now - model.last) : 16;
    model.last = now;
    model.time += dt;
    update(dt);
    render();
    model.raf = window.requestAnimationFrame(frame);
  };

  const start = () => {
    if (reduced || !model.running || !model.visible || model.disposed || model.raf) return;
    model.last = 0;
    model.raf = window.requestAnimationFrame(frame);
  };

  const stop = () => {
    if (!model.raf) return;
    window.cancelAnimationFrame(model.raf);
    model.raf = 0;
  };

  const setRunning = (next, message) => {
    model.running = next;
    if (toggle) {
      toggle.textContent = reduced ? "STATIC / REDUCED" : next ? "PAUSE" : "RESUME";
      toggle.setAttribute("aria-pressed", String(!next));
      toggle.disabled = reduced;
    }
    if (hudState) hudState.textContent = reduced ? "STATIC FRAME" : next ? "RUNNING" : "PAUSED";
    if (message) announce(message);
    if (next) start();
    else {
      stop();
      render();
    }
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    view.w = rect.width;
    view.h = rect.height;
    view.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(rect.width * view.dpr));
    const height = Math.max(1, Math.round(rect.height * view.dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    buildScene();
    render();
  };

  const activate = (name, focus = false) => {
    if (!tabs.some((tab) => tab.dataset.labTab === name)) return;
    model.active = name;
    tabs.forEach((tab) => {
      const selected = tab.dataset.labTab === name;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.labPanel !== name;
    });
    const label = tabs.find((tab) => tab.dataset.labTab === name)?.dataset.labLabel || name;
    if (hudName) hudName.textContent = label;
    buildScene();
    render();
    announce(`${label} loaded. ${reduced ? "Static frame shown for reduced motion." : "Pointer and keyboard controls are active."}`);
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(tab.dataset.labTab));
    tab.addEventListener("keydown", (event) => {
      const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else next = tabs.length - 1;
      activate(tabs[next].dataset.labTab, true);
    });
  });

  bench.querySelectorAll("[data-lab-range]").forEach((input) => {
    const key = input.dataset.labRange;
    const output = bench.querySelector(`[data-lab-output="${key}"]`);
    const apply = (announceChange) => {
      const value = Number(input.value);
      if (key === "field-strength") {
        model.field.strength = value;
        if (output) output.textContent = `${value.toFixed(1)}×`;
      } else if (key === "network-density") {
        model.network.density = Math.round(value);
        if (output) output.textContent = String(Math.round(value));
        buildScene();
      } else if (key === "wave-frequency") {
        model.wave.frequency = value;
        if (output) output.textContent = `${value.toFixed(1)}`;
      } else if (key === "wave-amplitude") {
        model.wave.amplitude = value;
        if (output) output.textContent = `${value.toFixed(2)}`;
      }
      render();
      if (announceChange && output) announce(`${input.dataset.labLabel || "Value"} set to ${output.textContent}.`);
    };
    input.addEventListener("input", () => apply(false));
    input.addEventListener("change", () => apply(true));
    apply(false);
  });

  bench.querySelectorAll("[data-lab-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.labAction;
      if (action === "field-mode") {
        model.field.mode = model.field.mode === "repel" ? "attract" : "repel";
        button.textContent = `MODE: ${model.field.mode.toUpperCase()}`;
        button.setAttribute("aria-pressed", String(model.field.mode === "attract"));
        announce(`Pointer field set to ${model.field.mode}.`);
      } else if (action === "network-pulse") {
        sendPulse();
        announce("Pulse injected into a random edge.");
      } else if (action === "network-auto") {
        model.network.auto = !model.network.auto;
        button.textContent = `AUTO PULSE: ${model.network.auto ? "ON" : "OFF"}`;
        button.setAttribute("aria-pressed", String(model.network.auto));
        announce(`Automatic pulses ${model.network.auto ? "enabled" : "disabled"}.`);
      } else if (action === "wave-reseed") {
        model.wave.seed += 17;
        buildWave();
        announce("Wave phases reseeded.");
      }
      render();
    });
  });

  if (toggle) {
    toggle.addEventListener("click", () => {
      setRunning(!model.running, model.running ? "Experiment paused." : "Experiment resumed.");
    });
  }

  const setPointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
    if (model.active === "network") {
      let hovered = -1;
      let closest = 18 ** 2;
      model.network.nodes.forEach((node, index) => {
        const distance = (node.x - pointer.x) ** 2 + (node.y - pointer.y) ** 2;
        if (distance < closest) {
          closest = distance;
          hovered = index;
        }
      });
      model.network.hovered = hovered;
    }
    if (!model.running) render();
  };

  canvas.addEventListener("pointermove", setPointer);
  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
    model.network.hovered = -1;
    if (!model.running) render();
  });

  let resizeObserver = null;
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
  } else {
    window.addEventListener("resize", resize);
  }

  let intersectionObserver = null;
  if ("IntersectionObserver" in window) {
    intersectionObserver = new IntersectionObserver((entries) => {
      model.visible = entries.some((entry) => entry.isIntersecting);
      if (model.visible) start();
      else stop();
    }, { threshold: 0.05 });
    intersectionObserver.observe(bench);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const dispose = () => {
    model.disposed = true;
    stop();
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    canvas.removeEventListener("pointermove", setPointer);
  };
  window.addEventListener("pagehide", dispose, { once: true });

  buildWave();
  activate(model.active);
  setRunning(model.running);
  resize();
  start();
})();
