import * as THREE from 'three';
import { lowPowerDevice, sceneMinWidth } from './scene-support.js';

const LIME = 0xb7ef66;
const VIOLET = 0xb18bd4;
const CANVAS = 0x101110;
const WAVE_BARS = 28;
const BAND_COUNT = 3;
const BAND_BASS = 0;
const BAND_MID = 1;
const BAND_TREBLE = 2;

const clamp01 = value => Math.min(1, Math.max(0, value));

const setGridOpacity = (grid, opacity) => {
  // GridHelper currently exposes a single material, but handle both shapes so
  // opacity is never assigned to an array object by mistake.
  const materials = Array.isArray(grid.material) ? grid.material : [grid.material];
  materials.forEach(material => {
    material.transparent = true;
    material.opacity = opacity;
  });
};

function buildMainScene(scene) {
  const groups = {};
  const materials = {
    solid: new THREE.MeshStandardMaterial({ color: 0x202420, roughness: .62, metalness: .28 }),
    lime: new THREE.MeshStandardMaterial({ color: LIME, emissive: LIME, emissiveIntensity: .16, roughness: .5 }),
    violet: new THREE.MeshStandardMaterial({ color: VIOLET, emissive: VIOLET, emissiveIntensity: .12, roughness: .55 }),
  };
  const box = new THREE.BoxGeometry(1, 1, 1);

  const lattice = new THREE.Group();
  for (let index = 0; index < 6; index += 1) {
    const z = -index * 2.2;
    const size = 6.6 - index * .58;
    const material = index % 3 === 2 ? materials.violet : materials.solid;
    const horizontal = new THREE.Mesh(box, material);
    horizontal.scale.set(size, .05, .05);
    horizontal.position.set(0, size / 2, z);
    lattice.add(horizontal);
    const bottom = horizontal.clone();
    bottom.position.y = -size / 2;
    lattice.add(bottom);
    const vertical = new THREE.Mesh(box, material);
    vertical.scale.set(.05, size, .05);
    vertical.position.set(size / 2, 0, z);
    lattice.add(vertical);
    const left = vertical.clone();
    left.position.x = -size / 2;
    lattice.add(left);
  }
  for (let index = 0; index < 3; index += 1) {
    const rail = new THREE.Mesh(box, index === 1 ? materials.violet : materials.lime);
    rail.scale.set(.035, 5.2, .035);
    rail.position.set(-2.6 + index * 2.6, 0, -9.5);
    lattice.add(rail);
  }
  lattice.position.x = 2.4;
  scene.add(lattice);
  groups.lattice = lattice;

  // Ambient spectrum: every bar has a position in a shared frequency field, a
  // deterministic amplitude envelope, and three overlapping band weights. The
  // procedural bands below stand in for background music; no audio is played.
  const bandWeight = (position, center, spread) =>
    Math.max(0, 1 - Math.abs(position - center) / spread);

  const waveGeometry = new THREE.BoxGeometry(.14, 1, .14);
  const waveMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .55, metalness: .06 });
  const wave = new THREE.InstancedMesh(waveGeometry, waveMaterial, WAVE_BARS);
  const waveParams = [];
  const waveHeights = new Float32Array(WAVE_BARS);
  const bandTargets = new Float32Array(BAND_COUNT);
  const bandValues = new Float32Array(BAND_COUNT).fill(.5);
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();

  for (let index = 0; index < WAVE_BARS; index += 1) {
    const position = index / (WAVE_BARS - 1);
    const bass = bandWeight(position, .16, .46);
    const mid = bandWeight(position, .5, .42);
    const treble = bandWeight(position, .84, .46);
    const total = bass + mid + treble || 1;
    const base = .58 + Math.abs(Math.sin(index * .51)) * 1.45 + Math.abs(Math.sin(index * .17)) * .5;
    const x = (index - (WAVE_BARS - 1) / 2) * .28;
    const z = Math.sin(position * Math.PI * 2) * .12;
    const params = {
      x,
      z,
      base,
      bassWeight: bass / total,
      midWeight: mid / total,
      trebleWeight: treble / total,
      envelope: .68 + Math.abs(Math.sin(index * .61 + .4)) * .34,
      driftAmplitude: .05 + (index % 5) * .012,
      driftFrequency: .00019 + (index % 4) * .000035,
      phase: index * .63,
    };
    waveParams.push(params);
    waveHeights[index] = base;
    dummy.position.set(x, base / 2, z);
    dummy.scale.set(1, base, 1);
    dummy.updateMatrix();
    wave.setMatrixAt(index, dummy.matrix);
    tint.setHex(index % 7 === 4 ? VIOLET : LIME).multiplyScalar(.82 + Math.abs(Math.sin(index * .41)) * .16);
    wave.setColorAt(index, tint);
  }
  wave.instanceMatrix.needsUpdate = true;
  wave.instanceColor.needsUpdate = true;
  wave.position.set(1.8, -1.9, -3.2);
  scene.add(wave);
  groups.wave = wave;
  groups.waveData = { params: waveParams, heights: waveHeights, bandTargets, bandValues, dummy };

  const grid = new THREE.GridHelper(28, 28, 0x303630, 0x242824);
  grid.position.y = -4.8;
  setGridOpacity(grid, .24);
  scene.add(grid);
  groups.grid = grid;

  return groups;
}

function buildBeyondScene(scene) {
  const groups = {};
  const materials = {
    solid: new THREE.MeshStandardMaterial({ color: 0x202420, roughness: .62, metalness: .3 }),
    lime: new THREE.MeshStandardMaterial({ color: LIME, emissive: LIME, emissiveIntensity: .14, roughness: .5 }),
    violet: new THREE.MeshStandardMaterial({ color: VIOLET, emissive: VIOLET, emissiveIntensity: .12, roughness: .55 }),
  };
  const box = new THREE.BoxGeometry(1, 1, 1);

  const gateway = new THREE.Group();
  for (let index = 0; index < 7; index += 1) {
    const z = -index * 2.4;
    const size = 7.4 - index * .72;
    const material = index % 3 === 1 ? materials.violet : materials.solid;
    const top = new THREE.Mesh(box, material);
    top.scale.set(size, .055, .055);
    top.position.set(0, size / 2, z);
    gateway.add(top);
    const bottom = top.clone();
    bottom.position.y = -size / 2;
    gateway.add(bottom);
    const side = new THREE.Mesh(box, material);
    side.scale.set(.055, size, .055);
    side.position.set(size / 2, 0, z);
    gateway.add(side);
    const other = side.clone();
    other.position.x = -size / 2;
    gateway.add(other);
  }
  scene.add(gateway);
  groups.gateway = gateway;

  const planes = new THREE.Group();
  for (let index = 0; index < 3; index += 1) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.1, 4.1),
      new THREE.MeshStandardMaterial({
        color: index === 1 ? VIOLET : LIME,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        roughness: .7,
        metalness: .1,
        depthWrite: false,
      })
    );
    plane.position.set((index - 1) * 4.3, 0, -1.5 - index * .7);
    plane.rotation.y = (index - 1) * -.12;
    planes.add(plane);
  }
  scene.add(planes);
  groups.planes = planes;

  const grid = new THREE.GridHelper(30, 30, 0x303630, 0x242824);
  grid.position.y = -5.2;
  setGridOpacity(grid, .22);
  scene.add(grid);
  groups.grid = grid;

  return groups;
}

/**
 * Creates one optional WebGL scene for a page. Returns null when the device or
 * viewport is unsuitable, or when direct renderer initialization fails; the
 * site is fully functional in that case because the canvas is decorative.
 */
export function createSpace(page) {
  const host = document.querySelector('.space-stage');
  if (!host) return null;

  const wideEnough = window.matchMedia(`(min-width: ${sceneMinWidth(page)}px)`);
  if (!wideEnough.matches || lowPowerDevice()) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(CANVAS, .026);
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, .1, 100);
  scene.add(new THREE.AmbientLight(0xffffff, .9));
  const key = new THREE.DirectionalLight(LIME, 2.4);
  key.position.set(6, 5, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(VIOLET, 1.8);
  rim.position.set(-7, -3, 5);
  scene.add(rim);

  const groups = page === 'beyond' ? buildBeyondScene(scene) : buildMainScene(scene);
  // Each scroll timeline owns a separate channel so overlapping triggers can
  // never fight over the same property. render() combines them once per frame.
  const state = {
    base: { x: 0, y: 0, z: 14, rot: -.08, tilt: 0 },
    hero: { z: 0, rot: 0 },
    tracker: { x: 0, tilt: 0 },
    voice: { wave: 0 },
    depth: { z: 0, rot: 0 },
    close: { opacity: 1 },
    audio: { bands: new Float32Array(BAND_COUNT).fill(.5), external: false, revision: 0 },
    gateway: 0,
    focusX: 0,
    planeOpacity: 0,
  };

  let frame = 0;
  let running = false;
  let disposed = false;
  let resizeFrame = 0;
  let lastRender = 0;
  const lastState = {
    heroZ: Number.NaN,
    heroRot: Number.NaN,
    trackerX: Number.NaN,
    trackerTilt: Number.NaN,
    voiceWave: Number.NaN,
    depthZ: Number.NaN,
    depthRot: Number.NaN,
    closeOpacity: Number.NaN,
    audioRevision: Number.NaN,
    gateway: Number.NaN,
    focusX: Number.NaN,
    planeOpacity: Number.NaN,
  };

  const stateChanged = () =>
    state.hero.z !== lastState.heroZ ||
    state.hero.rot !== lastState.heroRot ||
    state.tracker.x !== lastState.trackerX ||
    state.tracker.tilt !== lastState.trackerTilt ||
    state.voice.wave !== lastState.voiceWave ||
    state.depth.z !== lastState.depthZ ||
    state.depth.rot !== lastState.depthRot ||
    state.close.opacity !== lastState.closeOpacity ||
    state.audio.revision !== lastState.audioRevision ||
    state.gateway !== lastState.gateway ||
    state.focusX !== lastState.focusX ||
    state.planeOpacity !== lastState.planeOpacity;

  const captureState = () => {
    lastState.heroZ = state.hero.z;
    lastState.heroRot = state.hero.rot;
    lastState.trackerX = state.tracker.x;
    lastState.trackerTilt = state.tracker.tilt;
    lastState.voiceWave = state.voice.wave;
    lastState.depthZ = state.depth.z;
    lastState.depthRot = state.depth.rot;
    lastState.closeOpacity = state.close.opacity;
    lastState.audioRevision = state.audio.revision;
    lastState.gateway = state.gateway;
    lastState.focusX = state.focusX;
    lastState.planeOpacity = state.planeOpacity;
  };

  const render = time => {
    if (disposed) return;
    const rotation = state.base.rot + state.hero.rot + state.depth.rot;
    camera.position.set(
      state.base.x + state.tracker.x + state.focusX * .24,
      state.base.y,
      state.base.z + state.hero.z + state.depth.z
    );
    camera.lookAt(state.focusX * .16, 0, 0);
    if (groups.lattice) {
      groups.lattice.rotation.y = rotation + Math.sin(time * .00012) * .025;
      groups.lattice.rotation.x = state.base.tilt + state.tracker.tilt;
    }
    if (groups.gateway) {
      groups.gateway.rotation.y = rotation;
      groups.gateway.rotation.z = state.gateway + Math.sin(time * .0001) * .012;
    }
    if (groups.wave) {
      const { params, heights, bandTargets, bandValues, dummy } = groups.waveData;
      if (state.audio.external) {
        const bands = state.audio.bands;
        bandTargets[BAND_BASS] = clamp01(bands[BAND_BASS]);
        bandTargets[BAND_MID] = clamp01(bands[BAND_MID]);
        bandTargets[BAND_TREBLE] = clamp01(bands[BAND_TREBLE]);
      } else {
        // Deterministic stand-in for bass, midrange, and treble energy in a
        // quiet background track. The three rates are deliberately different.
        bandTargets[BAND_BASS] = clamp01(.5 + Math.sin(time * .00014) * .18 + Math.sin(time * .000052 + 1.7) * .1);
        bandTargets[BAND_MID] = clamp01(.48 + Math.sin(time * .00037 + .8) * .15 + Math.sin(time * .00021 + 2.4) * .09);
        bandTargets[BAND_TREBLE] = clamp01(.46 + Math.sin(time * .00094 + 2.1) * .11 + Math.sin(time * .00131 + .4) * .06);
      }
      bandValues[BAND_BASS] += (bandTargets[BAND_BASS] - bandValues[BAND_BASS]) * .09;
      bandValues[BAND_MID] += (bandTargets[BAND_MID] - bandValues[BAND_MID]) * .11;
      bandValues[BAND_TREBLE] += (bandTargets[BAND_TREBLE] - bandValues[BAND_TREBLE]) * .14;

      const intensity = .8 + state.voice.wave * .2;
      const bassDrive = (bandValues[BAND_BASS] - .42) * 1.05;
      const midDrive = (bandValues[BAND_MID] - .42) * .62;
      const trebleDrive = (bandValues[BAND_TREBLE] - .42) * .28;
      for (let index = 0; index < params.length; index += 1) {
        const item = params[index];
        const drive = item.bassWeight * bassDrive + item.midWeight * midDrive + item.trebleWeight * trebleDrive;
        const drift = Math.sin(time * item.driftFrequency + item.phase) * item.driftAmplitude;
        const target = Math.max(.18, item.base + (drive * item.envelope + drift) * intensity);
        const current = heights[index] + (target - heights[index]) * .1;
        heights[index] = current;
        dummy.position.set(item.x, current / 2, item.z);
        dummy.scale.set(1, current, 1);
        dummy.updateMatrix();
        groups.wave.setMatrixAt(index, dummy.matrix);
      }
      groups.wave.instanceMatrix.needsUpdate = true;
      groups.wave.rotation.z = (bandValues[BAND_BASS] - bandValues[BAND_MID]) * .018 + Math.sin(time * .00012) * .008;
      groups.wave.rotation.y = (bandValues[BAND_MID] - bandValues[BAND_TREBLE]) * .04;
      groups.wave.position.x = 1.8 + Math.sin(time * .00008) * .04;
    }
    if (groups.planes) {
      groups.planes.children.forEach((plane, index) => {
        const distance = Math.abs(state.focusX / 4.3 - (index - 1));
        plane.material.opacity = Math.max(.05, .38 - distance * .14) * state.planeOpacity;
      });
    }
    host.style.opacity = String(state.close.opacity);
    renderer.render(scene, camera);
    captureState();
    lastRender = time;
  };

  // Scroll-linked state changes render immediately; otherwise the subtle idle
  // drift only needs a low-frequency refresh instead of a full-rate GPU frame.
  const loop = time => {
    if (!running || disposed) return;
    if (stateChanged() || time - lastRender >= 1000 / 12) render(time);
    frame = window.requestAnimationFrame(loop);
  };
  const start = () => {
    if (running || disposed || document.hidden) return;
    running = true;
    host.classList.add('is-active');
    frame = window.requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    window.cancelAnimationFrame(frame);
  };

  const onVisibility = () => (document.hidden ? stop() : start());
  const onResize = () => {
    if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      if (disposed) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      render(0);
    });
  };
  const onContextLost = event => {
    event.preventDefault();
    stop();
    host.classList.remove('is-active');
  };
  const onContextRestored = () => {
    onResize();
    start();
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', onResize, { passive: true });
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    stop();
    if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('resize', onResize);
    renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
    renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

    const geometries = new Set();
    const materialsUsed = new Set();
    scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) {
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materialsUsed.add(material));
      }
    });
    geometries.forEach(geometry => geometry.dispose());
    materialsUsed.forEach(material => material.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    host.classList.remove('is-active');
    host.style.opacity = '';
  };

  // Optional hook for a future Web Audio analyser. The site never creates or
  // requests audio on its own; procedural bands drive the spectrum by default.
  const setAudioLevel = (level, bands) => {
    const value = clamp01(Number(level) || 0);
    if (bands && bands.length >= BAND_COUNT) {
      state.audio.bands[BAND_BASS] = clamp01(bands[BAND_BASS]);
      state.audio.bands[BAND_MID] = clamp01(bands[BAND_MID]);
      state.audio.bands[BAND_TREBLE] = clamp01(bands[BAND_TREBLE]);
    } else {
      state.audio.bands.fill(value);
    }
    state.audio.external = true;
    state.audio.revision += 1;
  };

  const clearAudioLevel = () => {
    state.audio.bands.fill(.5);
    state.audio.external = false;
    state.audio.revision += 1;
  };

  render(0);
  start();
  return { state, render, start, stop, dispose, page, setAudioLevel, clearAudioLevel };
}
