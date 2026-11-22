import * as THREE from "./vendor/three.module.js";

const LIME = 0xc7f36b;
const VIOLET = 0x9a82ff;
const NETWORK_CYAN = 0x62e2ff;
const WHITE = 0xf1f5f2;
const BACKGROUND = 0x090b0e;
const FADE_MS = 720;

const ease = (t) => 1 - Math.pow(1 - t, 3);
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/* Constructor-only work uses the initial tier. Runtime tier changes only adjust
   live settings (cadence, resolution, lights, and particle draw range); no scene
   objects are rebuilt. */
const QUALITY = {
  high: {
    tier: "high", dpr: 1.5, antialias: true, particle: 1, detail: 1,
    physical: true, transmission: true,
    frameMs: 32, idleMs: 1400, lights: "full", scale: 0.84
  },
  balanced: {
    tier: "balanced", dpr: 1.25, antialias: false, particle: 0.6, detail: 0.8,
    physical: true, transmission: false,
    frameMs: 40, idleMs: 1000, lights: "balanced", scale: 0.82
  },
  low: {
    tier: "low", dpr: 1, antialias: false, particle: 0.22, detail: 0.55,
    physical: false, transmission: false,
    frameMs: 64, idleMs: 700, lights: "low", scale: 0.78
  },
  mobile: { tier: "mobile", webgl: false }
};

const pickTier = () => {
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  if (coarse || window.innerWidth < 900) return QUALITY.mobile;

  const cores = navigator.hardwareConcurrency || 8;
  const memory = navigator.deviceMemory || 8;
  const saveData = navigator.connection?.saveData === true;
  const dpr = window.devicePixelRatio || 1;

  if (saveData || (cores <= 2 && memory <= 4)) return QUALITY.low;
  if (cores <= 4 || memory <= 4 || dpr > 2) return QUALITY.balanced;
  return QUALITY.high;
};

export function createSceneBackground({ canvas, reducedMotion = false }) {
  const quality = { ...pickTier() };
  if (!quality.webgl && quality.tier === "mobile") return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: quality.antialias,
      alpha: true,
      powerPreference: quality.tier === "high" ? "high-performance" : "low-power"
    });
  } catch (_) {
    return null;
  }

  if (!renderer || !renderer.getContext()) return null;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.dpr));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = quality.tier === "low" ? THREE.LinearToneMapping : THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BACKGROUND, 0.024);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 14);

  /* Direct key/rim/fill lights replace the Phase 7 PMREM render target. This keeps
     metallic highlights readable while removing a full env-map framebuffer chain. */

  /* Key light comes from the left so the rebalanced desktop art rail reads as volume. */
  scene.add(new THREE.HemisphereLight(0x9fb6c9, 0x05070a, quality.tier === "low" ? 0.7 : 0.5));

  const keyLight = new THREE.DirectionalLight(0xeaf4ff, quality.tier === "low" ? 2.2 : 2.5);
  keyLight.position.set(-4.5, 6, 8);

  const limeRim = new THREE.DirectionalLight(LIME, quality.tier === "low" ? 1.1 : 1.75);
  limeRim.position.set(5, 2.5, 4);

  const violetRim = new THREE.DirectionalLight(VIOLET, 2);
  violetRim.position.set(-3, -5, -6);

  const coolFill = new THREE.PointLight(0x8fb4ff, 24, 20, 2);
  coolFill.position.set(-4, 1, 6);

  const warmFill = new THREE.PointLight(LIME, 18, 16, 2);
  warmFill.position.set(4, -2, 5);

  scene.add(keyLight, limeRim);
  if (quality.lights === "full" || quality.lights === "balanced") scene.add(violetRim);
  if (quality.lights === "full") scene.add(coolFill, warmFill);

  const root = new THREE.Group();
  scene.add(root);

  const groups = {};
  const builders = {};
  const disposables = [];
  const particleFields = [];
  let seed = 48271;
  let disposed = false;

  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const keep = (resource) => {
    disposables.push(resource);
    return resource;
  };

  const createGroup = (name) => {
    const group = new THREE.Group();
    group.name = name;
    group.userData.materials = [];
    group.userData.baseX = 0;
    group.userData.baseY = 0;
    group.visible = false;
    root.add(group);
    groups[name] = group;
    return group;
  };

  const trackMaterial = (group, material) => {
    material.userData.baseOpacity = material.opacity;
    group.userData.materials.push(material);
    disposables.push(material);
    return material;
  };

  const metalMaterial = (group, color, options = {}) => {
    const params = {
      color,
      metalness: options.metalness ?? 0.82,
      roughness: options.roughness ?? 0.28,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissiveIntensity ?? 0,
      transparent: true,
      opacity: options.opacity ?? 1,
      depthWrite: options.depthWrite ?? true,
      side: THREE.FrontSide
    };
    if (quality.physical) {
      params.clearcoat = options.clearcoat ?? 0.34;
      params.clearcoatRoughness = 0.22;
      params.envMapIntensity = options.envMapIntensity ?? 1.15;
    }
    const material = quality.physical
      ? new THREE.MeshPhysicalMaterial(params)
      : new THREE.MeshStandardMaterial(params);
    return trackMaterial(group, material);
  };

  const glassMaterial = (group, color, options = {}) => {
    const params = {
      color,
      metalness: 0,
      roughness: options.roughness ?? 0.1,
      emissive: color,
      emissiveIntensity: options.emissiveIntensity ?? 0.04,
      transparent: true,
      opacity: options.opacity ?? 0.58,
      depthWrite: false,
      side: THREE.DoubleSide
    };
    let material;
    if (quality.transmission) {
      Object.assign(params, {
        transmission: options.transmission ?? 0.72,
        thickness: options.thickness ?? 1.1,
        ior: 1.45,
        envMapIntensity: 1.35
      });
      material = new THREE.MeshPhysicalMaterial(params);
    } else {
      material = new THREE.MeshStandardMaterial(params);
    }
    return trackMaterial(group, material);
  };

  const accentMaterial = (group, color, opacity = 0.9, intensity = 0.75) => trackMaterial(group, new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    metalness: 0.28,
    roughness: 0.32,
    transparent: true,
    opacity,
    depthWrite: false
  }));

  const pointMaterial = (group, color, opacity, size, vertexColors = false) => trackMaterial(group, new THREE.PointsMaterial({
    color: vertexColors ? WHITE : color,
    size,
    sizeAttenuation: true,
    vertexColors,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));

  /* Hero network materials share one focus uniform set. Per-frame work is limited
     to three scalar/vector writes; node and connection buffers are never rebuilt. */
  const networkLineMaterial = (group, uniforms) => trackMaterial(group, new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 1 },
      uTime: uniforms.time,
      uFocus: uniforms.focus,
      uFocusStrength: uniforms.focusStrength
    },
    vertexShader: `
      attribute vec3 aColor;
      varying vec3 vColor;
      varying vec3 vLocal;
      varying float vDepth;
      void main() {
        vColor = aColor;
        vLocal = position;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vDepth = -viewPosition.z;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      uniform float uTime;
      uniform vec3 uFocus;
      uniform float uFocusStrength;
      varying vec3 vColor;
      varying vec3 vLocal;
      varying float vDepth;
      void main() {
        float focusDistance = distance(vLocal, uFocus);
        float focus = exp(-focusDistance * focusDistance * 0.72) * uFocusStrength;
        float depth = 1.0 - smoothstep(12.0, 20.0, vDepth) * 0.55;
        float drift = 0.93 + 0.07 * sin(uTime * 1.1 + vDepth * 0.45);
        vec3 color = vColor * (0.88 + focus * 2.1) * drift;
        gl_FragColor = vec4(color, uOpacity * depth * (1.0 + focus * 0.9));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));

  const networkPointMaterial = (group, uniforms, sizeScale, baseOpacity) => {
    const material = trackMaterial(group, new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: baseOpacity },
        uTime: uniforms.time,
        uFocus: uniforms.focus,
        uFocusStrength: uniforms.focusStrength,
        uPixelRatio: uniforms.pixelRatio,
        uSizeScale: { value: sizeScale }
      },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        uniform float uPixelRatio;
        uniform float uSizeScale;
        varying vec3 vColor;
        varying vec3 vLocal;
        void main() {
          vColor = aColor;
          vLocal = position;
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uSizeScale * uPixelRatio * (210.0 / max(1.0, -viewPosition.z));
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        uniform vec3 uFocus;
        uniform float uFocusStrength;
        varying vec3 vColor;
        varying vec3 vLocal;
        void main() {
          float radius = length(gl_PointCoord - vec2(0.5)) * 2.0;
          if (radius > 1.0) discard;
          float core = 1.0 - smoothstep(0.12, 0.62, radius);
          float halo = pow(1.0 - radius, 2.4);
          float focusDistance = distance(vLocal, uFocus);
          float focus = exp(-focusDistance * focusDistance * 0.7) * uFocusStrength;
          vec3 color = vColor * (1.0 + focus * 1.8);
          float alpha = (core * 0.72 + halo * 0.34) * uOpacity * (1.0 + focus * 0.8);
          gl_FragColor = vec4(color, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    material.userData.baseOpacity = baseOpacity;
    material.opacity = baseOpacity;
    return material;
  };

  const networkAtmosphereMaterial = (group, uniforms) => trackMaterial(group, new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 1 },
      uTime: uniforms.time,
      uColorA: { value: new THREE.Color(NETWORK_CYAN) },
      uColorB: { value: new THREE.Color(LIME) }
    },
    vertexShader: `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldPosition = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 normal = normalize(vWorldNormal);
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.6);
        float limeEdge = smoothstep(0.35, 0.95, normal.y) * 0.34;
        vec3 color = mix(uColorA, uColorB, limeEdge);
        float drift = 0.92 + 0.08 * sin(uTime * 0.28 + normal.y * 4.0);
        gl_FragColor = vec4(color * drift, fresnel * uOpacity * 0.38);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));

  const setGroupOpacity = (group, factor) => {
    if (!group) return;
    const multiplier = Number.isFinite(group.userData.fadeMultiplier)
      ? group.userData.fadeMultiplier
      : 1;
    group.userData.materials.forEach((material) => {
      const value = material.userData.baseOpacity * factor * multiplier;
      material.opacity = value;
      if (material.uniforms?.uOpacity) material.uniforms.uOpacity.value = value;
    });
  };

  const sculptedGeometry = (radius, subdivisions, offset, squash) => {
    const detail = Math.max(0, Math.round(subdivisions * quality.detail));
    const geometry = keep(new THREE.IcosahedronGeometry(radius, detail));
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      const noise =
        Math.sin(x * 2.1 + offset) * Math.cos(y * 1.7 - offset) +
        Math.sin(z * 2.6 + offset * 0.5) * 0.5;
      const scale = 1 + noise * 0.12;
      position.setXYZ(i, x * scale * squash[0], y * scale * squash[1], z * scale * squash[2]);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  };

  const makeInstances = (group, geometry, material, count, place) => {
    const mesh = keep(new THREE.InstancedMesh(geometry, material, count));
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      place(dummy, i, count);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  };

  /* One unit cylinder is instanced for every straight pathway, instead of one geometry per link. */
  const tubeGeometry = keep(new THREE.CylinderGeometry(1, 1, 1, quality.detail > 0.7 ? 8 : 5, 1, true));
  const UNIT_Y = new THREE.Vector3(0, 1, 0);

  const makeTubes = (group, segments, material, radius) => {
    if (!segments.length) return null;
    const mesh = keep(new THREE.InstancedMesh(tubeGeometry, material, segments.length));
    const dummy = new THREE.Object3D();
    const start = new THREE.Vector3();
    const end = new THREE.Vector3();
    const direction = new THREE.Vector3();

    segments.forEach(([from, to], index) => {
      start.set(from[0], from[1], from[2]);
      end.set(to[0], to[1], to[2]);
      direction.subVectors(end, start);
      const length = direction.length();
      if (length < 0.001) return;
      dummy.position.copy(start).add(end).multiplyScalar(0.5);
      dummy.quaternion.setFromUnitVectors(UNIT_Y, direction.normalize());
      dummy.scale.set(radius, length, radius);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  };

  const makeParticles = (group, count, opacity, size, colorize, palette = null) => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);
    const limeColor = new THREE.Color(LIME);
    const violetColor = new THREE.Color(VIOLET);
    const whiteColor = new THREE.Color(WHITE);
    const paletteColors = palette ? palette.map((color) => new THREE.Color(color)) : null;
    const mixed = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      colorize(i, positions, seeds, count);
      const choice = seeds[i * 4 + 2];
      if (paletteColors) {
        mixed.copy(paletteColors[Math.min(paletteColors.length - 1, Math.floor(choice * paletteColors.length))]);
      } else if (choice < 0.45) mixed.copy(limeColor);
      else if (choice < 0.82) mixed.copy(violetColor);
      else mixed.copy(whiteColor);
      mixed.multiplyScalar(0.7 + 0.3 * random());
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    const geometry = keep(new THREE.BufferGeometry());
    const positionAttribute = new THREE.BufferAttribute(positions, 3);
    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", positionAttribute);
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mesh = new THREE.Points(geometry, pointMaterial(group, WHITE, opacity, size, true));
    mesh.frustumCulled = false;
    group.add(mesh);
    particleFields.push({
      geometry,
      builtCount: count,
      baseCount: Math.max(24, Math.round(count / (quality.particle || 1)))
    });
    return { mesh, positions, seeds, geometry, count };
  };

  const particleCount = (base) => Math.max(24, Math.round(base * quality.particle));

  /* Pointer influence is computed once per frame in group-local coordinates. */
  const interaction = { x: 0, y: 0, localX: 0, localY: 0 };
  const reactionAt = (x, y) => {
    const dx = x - interaction.localX;
    const dy = y - interaction.localY;
    const d2 = dx * dx + dy * dy;
    if (d2 >= 9) return 0;
    const falloff = 1 - d2 / 9;
    return falloff * falloff;
  };

  /* ------------------------------------------------------------------ *\
   * MAIN PORTFOLIO — cinematic sculptures
   * ------------------------------------------------------------------ */

  const buildHero = () => {
    const group = createGroup("hero");
    const sphere = new THREE.Group();
    const radius = 5.15;
    group.add(sphere);

    const nodeCount = quality.detail > 0.7 ? 88 : quality.detail > 0.5 ? 76 : 64;
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeColors = new Float32Array(nodeCount * 3);
    const nodes = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    const cyan = new THREE.Color(NETWORK_CYAN);
    const lime = new THREE.Color(LIME);
    const neutral = new THREE.Color(0x87979b);
    const bright = new THREE.Color(0xd8f8ff);

    for (let i = 0; i < nodeCount; i += 1) {
      const y = 1 - (i / (nodeCount - 1)) * 2;
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i + (random() - 0.5) * 0.16;
      const radial = 1 + (random() - 0.5) * 0.09;
      const point = new THREE.Vector3(
        Math.cos(theta) * ring * radial * radius,
        y * radial * radius,
        Math.sin(theta) * ring * radial * radius
      );
      nodes.push(point);
      nodePositions[i * 3] = point.x;
      nodePositions[i * 3 + 1] = point.y;
      nodePositions[i * 3 + 2] = point.z;
    }

    const addEdge = (target, a, b) => {
      if (a === b) return;
      const from = Math.min(a, b);
      const to = Math.max(a, b);
      const key = `${from}:${to}`;
      if (target.has(key)) return;
      target.add(key);
    };
    const edgeKeys = new Set();
    for (let i = 0; i < nodeCount; i += 1) {
      const nearest = [];
      for (let j = 0; j < nodeCount; j += 1) {
        if (i === j) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        nearest.push([dx * dx + dy * dy + dz * dz, j]);
      }
      nearest.sort((a, b) => a[0] - b[0]);
      for (let n = 0; n < 4; n += 1) addEdge(edgeKeys, i, nearest[n][1]);
    }
    for (let i = 0; i < Math.round(nodeCount * 0.22); i += 1) {
      const a = Math.floor(random() * nodeCount);
      const b = Math.floor(random() * nodeCount);
      if (nodes[a].dot(nodes[b]) > -radius * radius * 0.35) addEdge(edgeKeys, a, b);
    }
    const edges = Array.from(edgeKeys, (key) => key.split(":").map(Number));

    const linePositions = new Float32Array(edges.length * 6);
    const lineColors = new Float32Array(edges.length * 6);
    const edgeColor = new THREE.Color();
    edges.forEach(([a, b], index) => {
      const offset = index * 6;
      linePositions[offset] = nodePositions[a * 3];
      linePositions[offset + 1] = nodePositions[a * 3 + 1];
      linePositions[offset + 2] = nodePositions[a * 3 + 2];
      linePositions[offset + 3] = nodePositions[b * 3];
      linePositions[offset + 4] = nodePositions[b * 3 + 1];
      linePositions[offset + 5] = nodePositions[b * 3 + 2];

      if (index % 13 === 0) edgeColor.copy(bright).multiplyScalar(0.82);
      else if (index % 9 === 0) edgeColor.copy(lime).multiplyScalar(0.52);
      else if (index % 4 === 0) edgeColor.copy(neutral).multiplyScalar(0.4);
      else edgeColor.copy(cyan).multiplyScalar(0.54);

      for (let endpoint = 0; endpoint < 2; endpoint += 1) {
        const colorOffset = offset + endpoint * 3;
        lineColors[colorOffset] = edgeColor.r;
        lineColors[colorOffset + 1] = edgeColor.g;
        lineColors[colorOffset + 2] = edgeColor.b;
      }
    });

    const uniforms = {
      time: { value: 0 },
      focus: { value: new THREE.Vector3(0, 0, 0) },
      focusStrength: { value: 0 },
      pixelRatio: { value: renderer.getPixelRatio() }
    };
    const heroState = {
      uniforms,
      dragging: false,
      pointerId: -1,
      lastX: 0,
      lastY: 0,
      lastMoveTime: 0,
      velocityYaw: 0,
      velocityPitch: 0,
      focus: 0,
      focusIndex: -1,
      focusTarget: 0
    };
    group.userData.hero = heroState;

    const lineGeometry = keep(new THREE.BufferGeometry());
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute("aColor", new THREE.BufferAttribute(lineColors, 3));
    const lines = new THREE.LineSegments(lineGeometry, networkLineMaterial(group, uniforms));
    lines.frustumCulled = false;
    sphere.add(lines);

    const nodeMaterial = trackMaterial(group, new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    const nodeMesh = keep(new THREE.InstancedMesh(
      keep(new THREE.IcosahedronGeometry(1, quality.detail > 0.7 ? 1 : 0)),
      nodeMaterial,
      nodeCount
    ));
    const dummy = new THREE.Object3D();
    const nodeColor = new THREE.Color();
    for (let i = 0; i < nodeCount; i += 1) {
      const depth = nodePositions[i * 3 + 2] / radius;
      dummy.position.set(nodePositions[i * 3], nodePositions[i * 3 + 1], nodePositions[i * 3 + 2]);
      dummy.scale.setScalar(0.052 + (i % 5) * 0.007 + (depth > 0 ? 0.014 : 0));
      dummy.updateMatrix();
      nodeMesh.setMatrixAt(i, dummy.matrix);

      if (i % 13 === 0) nodeColor.copy(lime);
      else if (i % 17 === 0) nodeColor.setHex(0xf1f5f2);
      else nodeColor.copy(cyan).multiplyScalar(0.72 + (depth + 1) * 0.14);
      nodeColors[i * 3] = nodeColor.r;
      nodeColors[i * 3 + 1] = nodeColor.g;
      nodeColors[i * 3 + 2] = nodeColor.b;
      nodeMesh.setColorAt(i, nodeColor);
    }
    nodeMesh.instanceMatrix.needsUpdate = true;
    nodeMesh.instanceColor.needsUpdate = true;
    nodeMesh.frustumCulled = false;
    sphere.add(nodeMesh);

    const haloSizes = new Float32Array(nodeCount);
    const haloColors = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i += 1) {
      haloSizes[i] = 1.35 + (i % 6) * 0.14 + random() * 0.24;
      haloColors[i * 3] = nodeColors[i * 3];
      haloColors[i * 3 + 1] = nodeColors[i * 3 + 1];
      haloColors[i * 3 + 2] = nodeColors[i * 3 + 2];
    }
    const haloGeometry = keep(new THREE.BufferGeometry());
    haloGeometry.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
    haloGeometry.setAttribute("aColor", new THREE.BufferAttribute(haloColors, 3));
    haloGeometry.setAttribute("aSize", new THREE.BufferAttribute(haloSizes, 1));
    const halos = new THREE.Points(haloGeometry, networkPointMaterial(group, uniforms, 1, 0.5));
    halos.frustumCulled = false;
    sphere.add(halos);

    const pulseCount = quality.detail > 0.7 ? 14 : quality.detail > 0.5 ? 10 : 7;
    const pulsePositions = new Float32Array(pulseCount * 3);
    const pulseSizes = new Float32Array(pulseCount);
    const pulseColors = new Float32Array(pulseCount * 3);
    const pulseMeta = [];
    for (let i = 0; i < pulseCount; i += 1) {
      pulseMeta.push({
        edge: Math.min(edges.length - 1, Math.floor((i + 0.5) * edges.length / pulseCount)),
        offset: random(),
        speed: 0.055 + random() * 0.05,
        reverse: random() < 0.5 ? -1 : 1
      });
      pulseSizes[i] = 0.7 + random() * 0.32;
      const color = i % 4 === 0 ? lime : bright;
      pulseColors[i * 3] = color.r;
      pulseColors[i * 3 + 1] = color.g;
      pulseColors[i * 3 + 2] = color.b;
    }
    const pulseGeometry = keep(new THREE.BufferGeometry());
    const pulsePositionAttribute = new THREE.BufferAttribute(pulsePositions, 3);
    pulsePositionAttribute.setUsage(THREE.DynamicDrawUsage);
    pulseGeometry.setAttribute("position", pulsePositionAttribute);
    pulseGeometry.setAttribute("aColor", new THREE.BufferAttribute(pulseColors, 3));
    pulseGeometry.setAttribute("aSize", new THREE.BufferAttribute(pulseSizes, 1));
    const pulses = new THREE.Points(pulseGeometry, networkPointMaterial(group, uniforms, 0.82, 0.95));
    pulses.frustumCulled = false;
    sphere.add(pulses);

    const atmosphere = new THREE.Mesh(
      keep(new THREE.SphereGeometry(
        radius * 1.045,
        quality.detail > 0.7 ? 48 : 32,
        quality.detail > 0.7 ? 32 : 20
      )),
      networkAtmosphereMaterial(group, uniforms)
    );
    sphere.add(atmosphere);

    const dust = makeParticles(group, particleCount(76), 0.18, 0.012, (i, positions, seeds) => {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const orbit = radius * (1.12 + random() * 0.34);
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * orbit;
      positions[i * 3 + 1] = Math.cos(phi) * orbit * 0.7;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * orbit;
      seeds[i * 4] = theta;
      seeds[i * 4 + 1] = 0.04 + random() * 0.05;
      seeds[i * 4 + 2] = random();
      seeds[i * 4 + 3] = orbit;
    }, [NETWORK_CYAN, LIME, WHITE]);
    sphere.add(dust.mesh);

    const focusPoint = new THREE.Vector3();
    const focusColor = new THREE.Color(0xf4fdff);
    heroState.updateFocus = (clientX, clientY) => {
      sphere.updateWorldMatrix(true, false);
      let best = -1;
      let bestDistance = Infinity;
      for (let i = 0; i < nodeCount; i += 1) {
        focusPoint
          .set(nodePositions[i * 3], nodePositions[i * 3 + 1], nodePositions[i * 3 + 2])
          .applyMatrix4(sphere.matrixWorld)
          .project(camera);
        const screenX = (focusPoint.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-focusPoint.y * 0.5 + 0.5) * window.innerHeight;
        const dx = screenX - clientX;
        const dy = screenY - clientY;
        const distance = dx * dx + dy * dy;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      }

      if (best !== heroState.focusIndex) {
        if (heroState.focusIndex >= 0) {
          nodeColor
            .setRGB(
              nodeColors[heroState.focusIndex * 3],
              nodeColors[heroState.focusIndex * 3 + 1],
              nodeColors[heroState.focusIndex * 3 + 2]
            );
          nodeMesh.setColorAt(heroState.focusIndex, nodeColor);
        }
        if (best >= 0) {
          uniforms.focus.value.set(
            nodePositions[best * 3],
            nodePositions[best * 3 + 1],
            nodePositions[best * 3 + 2]
          );
          nodeMesh.setColorAt(best, focusColor);
        }
        nodeMesh.instanceColor.needsUpdate = true;
        heroState.focusIndex = best;
      }
      heroState.focusTarget = best >= 0 ? 1 : 0;
    };

    heroState.clearFocus = () => {
      if (heroState.focusIndex >= 0) {
        nodeColor
          .setRGB(
            nodeColors[heroState.focusIndex * 3],
            nodeColors[heroState.focusIndex * 3 + 1],
            nodeColors[heroState.focusIndex * 3 + 2]
          );
        nodeMesh.setColorAt(heroState.focusIndex, nodeColor);
        nodeMesh.instanceColor.needsUpdate = true;
        heroState.focusIndex = -1;
      }
      heroState.focusTarget = 0;
    };

    group.userData.radius = radius;
    group.userData.sphere = sphere;
    group.userData.baseX = 5.1;
    group.userData.baseY = -1.02;
    group.userData.spin = 0;
    group.userData.float = 0;
    group.userData.animate = (dt, time, pointer) => {
      uniforms.time.value = time;
      heroState.focus += (heroState.focusTarget - heroState.focus) * Math.min(1, dt * 7);
      uniforms.focusStrength.value = heroState.focus;

      const follow = Math.min(1, dt * 3.2);
      group.rotation.x += (-pointer.y * 0.045 - group.rotation.x) * follow;
      group.rotation.y += (pointer.x * 0.065 - group.rotation.y) * follow;

      if (!heroState.dragging) {
        sphere.rotation.y += (0.055 + heroState.velocityYaw) * dt;
        sphere.rotation.x = Math.max(-0.42, Math.min(0.42, sphere.rotation.x + heroState.velocityPitch * dt));
        const decay = Math.pow(0.935, dt * 60);
        heroState.velocityYaw *= decay;
        heroState.velocityPitch *= decay;
      }

      for (let i = 0; i < pulseMeta.length; i += 1) {
        const pulse = pulseMeta[i];
        const [from, to] = edges[pulse.edge];
        const progress = (pulse.offset + time * pulse.speed) % 1;
        const t = pulse.reverse < 0 ? 1 - progress : progress;
        const bulge = 1 + Math.sin(t * Math.PI) * 0.014;
        const offset = i * 3;
        pulsePositions[offset] = lerp(nodePositions[from * 3], nodePositions[to * 3], t) * bulge;
        pulsePositions[offset + 1] = lerp(nodePositions[from * 3 + 1], nodePositions[to * 3 + 1], t) * bulge;
        pulsePositions[offset + 2] = lerp(nodePositions[from * 3 + 2], nodePositions[to * 3 + 2], t) * bulge;
      }
      pulseGeometry.attributes.position.needsUpdate = true;

      const position = dust.positions;
      for (let i = 0; i < dust.count; i += 1) {
        const index = i * 3;
        const angle = dust.seeds[i * 4] + time * dust.seeds[i * 4 + 1] * 0.2;
        const orbit = dust.seeds[i * 4 + 3];
        position[index] = Math.cos(angle) * orbit;
        position[index + 1] = Math.sin(i * 1.618 + time * 0.08) * orbit * 0.12;
        position[index + 2] = Math.sin(angle) * orbit * 0.7;
      }
      dust.geometry.attributes.position.needsUpdate = true;
    };
  };

  const buildWork = () => {
    const group = createGroup("work");
    const columns = 6;
    const rows = 4;
    const towers = [];

    for (let row = 0; row < rows; row += 1) {
      const z = 4.4 - row * 3.1;
      const base = -1.5 + row * 0.14;
      for (let column = 0; column < columns; column += 1) {
        const x = (column - (columns - 1) / 2) * 1.28 + (row % 2 ? 0.16 : -0.16);
        const height = 1.05 + random() * 1.55 + (row === 0 ? 0.28 : 0);
        towers.push({ x, z, base, height, index: towers.length });
      }
    }

    const bodyGeometry = keep(new THREE.BoxGeometry(1, 1, 1));
    const bodies = makeInstances(
      group,
      bodyGeometry,
      metalMaterial(group, 0x15212b, { metalness: 0.86, roughness: 0.32 }),
      towers.length,
      (dummy, i) => {
        const tower = towers[i];
        dummy.position.set(tower.x, tower.base + tower.height * 0.5, tower.z);
        dummy.scale.set(0.36, tower.height, 0.36);
      }
    );

    const capGeometry = keep(new THREE.BoxGeometry(0.46, 0.08, 0.46));
    const caps = makeInstances(
      group,
      capGeometry,
      metalMaterial(group, 0x71879a, { metalness: 0.78, roughness: 0.28, emissive: VIOLET, emissiveIntensity: 0.08 }),
      towers.length,
      (dummy, i) => {
        const tower = towers[i];
        dummy.position.set(tower.x, tower.base + tower.height + 0.06, tower.z);
        dummy.scale.setScalar(1);
      }
    );

    const stripGeometry = keep(new THREE.BoxGeometry(0.035, 1, 0.035));
    const strips = makeInstances(
      group,
      stripGeometry,
      trackMaterial(group, new THREE.MeshBasicMaterial({
        color: LIME, transparent: true, opacity: 0.42,
        depthWrite: false, blending: THREE.AdditiveBlending
      })),
      towers.length,
      (dummy, i) => {
        const tower = towers[i];
        dummy.position.set(tower.x, tower.base + tower.height * 0.52, tower.z + 0.19);
        dummy.scale.set(1, tower.height * 0.72, 1);
      }
    );

    const beaconGeometry = keep(new THREE.OctahedronGeometry(0.085, 0));
    const beacons = makeInstances(
      group,
      beaconGeometry,
      trackMaterial(group, new THREE.MeshBasicMaterial({
        color: WHITE, transparent: true, opacity: 0.9,
        depthWrite: false, blending: THREE.AdditiveBlending
      })),
      towers.length,
      (dummy, i) => {
        const tower = towers[i];
        dummy.position.set(tower.x, tower.base + tower.height + 0.17, tower.z);
        dummy.scale.setScalar(0.8);
      }
    );
    const coolColor = new THREE.Color(0x6fa8c7);
    const hotColor = new THREE.Color(0xc7f36b);
    const beaconColor = new THREE.Color();
    for (let i = 0; i < towers.length; i += 1) beacons.setColorAt(i, coolColor);
    beacons.instanceColor.needsUpdate = true;

    const pathways = [];
    const pointsFor = (tower, lift) => [tower.x, tower.base + lift, tower.z];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const index = row * columns + column;
        if (column < columns - 1) pathways.push([index, index + 1, pointsFor(towers[index], 0.22), pointsFor(towers[index + 1], 0.22)]);
        if (row < rows - 1) pathways.push([index, index + columns, pointsFor(towers[index], 0.22), pointsFor(towers[index + columns], 0.22)]);
      }
    }

    const pathwayMaterial = trackMaterial(group, new THREE.MeshBasicMaterial({
      color: 0x63c8e8, transparent: true, opacity: 0.58,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    makeTubes(group, pathways.map((path) => [path[2], path[3]]), pathwayMaterial, 0.011);

    const pulseGeometry = keep(new THREE.OctahedronGeometry(0.062, 0));
    const pulses = makeInstances(
      group,
      pulseGeometry,
      trackMaterial(group, new THREE.MeshBasicMaterial({
        color: 0xbff6ff, transparent: true, opacity: 0.95,
        depthWrite: false, blending: THREE.AdditiveBlending
      })),
      pathways.length,
      () => {}
    );
    const pulseMeta = pathways.map((path, i) => ({
      from: path[0], to: path[1], start: path[2], end: path[3],
      offset: random(), speed: 0.08 + random() * 0.07, index: i
    }));

    const dummy = new THREE.Object3D();
    const towerDummy = new THREE.Object3D();
    group.userData.baseX = 0.24;
    group.userData.baseY = -1.55;
    group.userData.spin = 0;
    group.userData.float = 0.025;
    group.rotation.x = -0.035;
    group.userData.animate = (dt, time, pointer) => {
      const swayX = pointer.x * 0.04;
      for (let i = 0; i < towers.length; i += 1) {
        const tower = towers[i];
        const glow = Math.sin(time * 0.8 + i * 0.7) * 0.08 + 0.12;
        towerDummy.position.set(tower.x + swayX, tower.base + tower.height + 0.17, tower.z);
        towerDummy.scale.setScalar(0.8 + glow);
        towerDummy.updateMatrix();
        beacons.setMatrixAt(i, towerDummy.matrix);
        beaconColor.copy(coolColor).lerp(hotColor, Math.min(1, glow * 2.6));
        beacons.setColorAt(i, beaconColor);
      }
      beacons.instanceMatrix.needsUpdate = true;
      beacons.instanceColor.needsUpdate = true;

      pulseMeta.forEach((pulse) => {
        const t = (pulse.offset + time * pulse.speed) % 1;
        dummy.position.set(
          lerp(pulse.start[0], pulse.end[0], t) + swayX,
          lerp(pulse.start[1], pulse.end[1], t),
          lerp(pulse.start[2], pulse.end[2], t)
        );
        dummy.scale.setScalar(0.7 + Math.sin(t * Math.PI) * 0.65);
        dummy.updateMatrix();
        pulses.setMatrixAt(pulse.index, dummy.matrix);

        const atEnd = Math.min(t, 1 - t);
        for (let i = 0; i < towers.length; i += 1) {
          if (i !== pulse.from && i !== pulse.to) continue;
          const current = beacons.instanceColor.array[i * 3 + 1] || 0;
          const boost = (1 - atEnd * 5) * 0.45;
          if (boost > 0) beacons.instanceColor.setY(i, Math.min(1, current + boost));
        }
      });
      pulses.instanceMatrix.needsUpdate = true;
      beacons.instanceColor.needsUpdate = true;
    };
  };

  const buildCapabilities = () => {
    const group = createGroup("capabilities");
    const count = quality.tier === "high" ? 18 : quality.tier === "balanced" ? 14 : 9;
    const nodes = [];

    for (let i = 0; i < count; i += 1) {
      const inclination = Math.acos(1 - 2 * ((i + 0.5) / count));
      const azimuth = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 1.65 + random() * 1.15;
      nodes.push([
        Math.sin(inclination) * Math.cos(azimuth) * radius,
        Math.sin(inclination) * Math.sin(azimuth) * radius * 0.82,
        Math.cos(inclination) * radius * 0.9
      ]);
    }

    const nodeGeometry = keep(new THREE.IcosahedronGeometry(0.17, quality.detail > 0.7 ? 0 : 0));
    const nodeMaterial = metalMaterial(group, WHITE, { metalness: 0.86, roughness: 0.24 });
    const nodeMesh = makeInstances(group, nodeGeometry, nodeMaterial, count, (dummy, i) => {
      dummy.position.set(...nodes[i]);
      dummy.rotation.set(random(), random(), random());
      dummy.scale.setScalar(1);
    });
    const lime = new THREE.Color(LIME);
    const violet = new THREE.Color(VIOLET);
    const neutral = new THREE.Color(0x8899a8);
    for (let i = 0; i < count; i += 1) {
      nodeMesh.setColorAt(i, i % 4 === 0 ? lime : i % 3 === 0 ? violet : neutral);
    }
    nodeMesh.instanceColor.needsUpdate = true;

    const paths = [];
    nodes.forEach((node, i) => {
      const distances = nodes
        .map((other, j) => ({ j, d: (other[0] - node[0]) ** 2 + (other[1] - node[1]) ** 2 + (other[2] - node[2]) ** 2 }))
        .filter((entry) => entry.j !== i)
        .sort((a, b) => a.d - b.d);
      distances.slice(0, 2).forEach(({ j }) => {
        if (i < j) paths.push([i, j]);
      });
    });

    const pathMaterial = metalMaterial(group, 0x4c5d6c, {
      metalness: 0.72, roughness: 0.42, opacity: 0.6, emissive: VIOLET, emissiveIntensity: 0.08
    });
    makeTubes(group, paths.map(([from, to]) => [nodes[from], nodes[to]]), pathMaterial, 0.01);

    const hub = new THREE.Mesh(
      sculptedGeometry(0.48, 1, 2.2, [1, 1, 1]),
      metalMaterial(group, LIME, { metalness: 0.76, roughness: 0.22, emissive: LIME, emissiveIntensity: 0.18 })
    );
    group.add(hub);

    const hubGlass = new THREE.Mesh(
      keep(new THREE.IcosahedronGeometry(0.78, quality.detail > 0.7 ? 1 : 0)),
      glassMaterial(group, VIOLET, { transmission: 0.85, opacity: 0.34, thickness: 1.4 })
    );
    group.add(hubGlass);

    const pulseGeometry = keep(new THREE.OctahedronGeometry(0.065, 0));
    const pulses = makeInstances(group, pulseGeometry, accentMaterial(group, LIME, 0.95), paths.length, () => {});
    const pulseMeta = paths.map(([from, to]) => ({
      from, to, offset: random(), speed: 0.09 + random() * 0.08
    }));

    const dust = makeParticles(group, particleCount(260), 0.3, 0.026, (i, positions, seeds) => {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const radius = 2.6 + random() * 1.5;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.8;
      positions[i * 3 + 2] = radius * Math.cos(phi) * 0.8;
      seeds[i * 4] = theta;
      seeds[i * 4 + 1] = 0.08 + random() * 0.14;
      seeds[i * 4 + 2] = random();
      seeds[i * 4 + 3] = radius;
    });

    const dummy = new THREE.Object3D();
    const from = new THREE.Vector3();
    const to = new THREE.Vector3();

    group.userData.spin = 0.035;
    group.userData.float = 0.05;
    group.userData.animate = (dt, time) => {
      hub.rotation.y += dt * 0.12;
      hubGlass.rotation.x = time * 0.08;

      pulseMeta.forEach((pulse, i) => {
        const t = (pulse.offset + time * pulse.speed) % 1;
        from.set(...nodes[pulse.from]);
        to.set(...nodes[pulse.to]);
        dummy.position.lerpVectors(from, to, t);
        dummy.rotation.set(time * 0.5, time * 0.35, 0);
        dummy.scale.setScalar(0.65 + Math.sin(t * Math.PI) * 0.75);
        dummy.updateMatrix();
        pulses.setMatrixAt(i, dummy.matrix);
      });
      pulses.instanceMatrix.needsUpdate = true;

      for (let i = 0; i < dust.count; i += 1) {
        const index = i * 3;
        const theta = dust.seeds[i * 4] + time * dust.seeds[i * 4 + 1] * 0.3;
        const radius = dust.seeds[i * 4 + 3];
        const reaction = reactionAt(dust.positions[index], dust.positions[index + 1]);
        dust.positions[index] = Math.cos(theta) * radius + Math.sin(dust.seeds[i * 4 + 2] * 9 + time) * reaction * 0.16;
        dust.positions[index + 1] = Math.sin(theta) * radius * 0.8 + Math.cos(dust.seeds[i * 4 + 2] * 11 + time) * reaction * 0.14;
      }
      dust.geometry.attributes.position.needsUpdate = true;
    };
  };

  const buildProfile = () => {
    const group = createGroup("profile");

    /* Phase 17 — IDENTITY CORE / CONNECTED EXPERIENCE.
       One translucent shell, one lit core, four instanced modules, and thin
       instanced links. Every moving part updates existing buffers only. */
    const shell = new THREE.Mesh(
      keep(new THREE.IcosahedronGeometry(0.86, quality.detail > 0.7 ? 2 : 1)),
      glassMaterial(group, NETWORK_CYAN, {
        transmission: 0.84, opacity: 0.24, thickness: 1.7, roughness: 0.16
      })
    );
    group.add(shell);

    const core = new THREE.Mesh(
      keep(new THREE.OctahedronGeometry(0.44, quality.detail > 0.7 ? 1 : 0)),
      metalMaterial(group, 0x14242d, {
        metalness: 0.94, roughness: 0.18, emissive: LIME,
        emissiveIntensity: 0.22, opacity: 0.96
      })
    );
    group.add(core);

    const heart = new THREE.Mesh(
      keep(new THREE.IcosahedronGeometry(0.17, quality.detail > 0.7 ? 1 : 0)),
      accentMaterial(group, LIME, 0.94, 1.05)
    );
    group.add(heart);

    const orbit = new THREE.Mesh(
      keep(new THREE.RingGeometry(1.16, 1.18, quality.detail > 0.7 ? 56 : 32)),
      accentMaterial(group, NETWORK_CYAN, 0.38, 0.5)
    );
    group.add(orbit);

    const modulePositions = [
      [0, 1.95, -0.14],
      [0, -1.95, 0.2],
      [-2.18, 0, -0.46],
      [2.18, 0, 0.3]
    ];
    const moduleScales = [
      [0.92, 0.46, 0.5],
      [0.92, 0.46, 0.5],
      [0.5, 0.76, 0.5],
      [0.5, 0.76, 0.5]
    ];
    const moduleGeometry = keep(new THREE.BoxGeometry(1, 1, 1));
    const modules = makeInstances(
      group,
      moduleGeometry,
      metalMaterial(group, 0x1b2b36, {
        metalness: 0.92, roughness: 0.24, emissive: NETWORK_CYAN,
        emissiveIntensity: 0.08, opacity: 0.9
      }),
      modulePositions.length,
      (dummy, i) => {
        const position = modulePositions[i];
        const scale = moduleScales[i];
        dummy.position.set(position[0], position[1], position[2]);
        dummy.rotation.set(0.06, i % 2 ? -0.18 : 0.18, 0);
        dummy.scale.set(scale[0], scale[1], scale[2]);
      }
    );

    const accents = makeInstances(
      group,
      moduleGeometry,
      accentMaterial(group, NETWORK_CYAN, 0.62, 0.62),
      modulePositions.length,
      (dummy, i) => {
        const position = modulePositions[i];
        const scale = moduleScales[i];
        dummy.position.set(position[0], position[1], position[2] + scale[2] * 0.5 + 0.014);
        dummy.rotation.set(0.06, i % 2 ? -0.18 : 0.18, 0);
        dummy.scale.set(scale[0] * 0.62, scale[1] * 0.12, 0.02);
      }
    );

    const cyanLinks = [];
    const limeLinks = [];
    for (let i = 0; i < modulePositions.length; i += 1) {
      const position = modulePositions[i];
      const links = i % 2 === 0 ? limeLinks : cyanLinks;
      links.push([
        [position[0] * 0.22, position[1] * 0.22, position[2] * 0.22],
        [position[0] * 0.86, position[1] * 0.86, position[2] * 0.86]
      ]);
    }
    makeTubes(group, cyanLinks, accentMaterial(group, NETWORK_CYAN, 0.44, 0.58), 0.014);
    makeTubes(group, limeLinks, accentMaterial(group, LIME, 0.38, 0.52), 0.012);

    const beads = makeParticles(group, particleCount(40), 0.68, 0.052, (i, positions, seeds) => {
      seeds[i * 4] = i % modulePositions.length;
      seeds[i * 4 + 1] = random();
      seeds[i * 4 + 2] = random();
      seeds[i * 4 + 3] = 0.08 + random() * 0.1;
    }, [NETWORK_CYAN, NETWORK_CYAN, LIME]);

    const dummy = new THREE.Object3D();

    group.userData.spin = -0.014;
    group.userData.float = 0.028;
    group.userData.animate = (dt, time, pointer) => {
      shell.rotation.y = time * 0.055;
      shell.rotation.x = Math.sin(time * 0.18) * 0.07;
      core.rotation.y += dt * 0.16;
      core.rotation.x = Math.sin(time * 0.24) * 0.1;
      heart.scale.setScalar(0.9 + Math.sin(time * 1.25) * 0.09);
      orbit.quaternion.copy(camera.quaternion);
      orbit.rotateZ(time * 0.026);

      for (let i = 0; i < modulePositions.length; i += 1) {
        const position = modulePositions[i];
        const scale = moduleScales[i];
        const pulse = 1 + Math.sin(time * 0.7 + i * 1.6) * 0.014;
        dummy.position.set(
          position[0] + pointer.x * 0.022,
          position[1] - pointer.y * 0.016,
          position[2]
        );
        dummy.rotation.set(0.06, (i % 2 ? -0.18 : 0.18) + Math.sin(time * 0.2 + i) * 0.018, 0);
        dummy.scale.set(scale[0] * pulse, scale[1] * pulse, scale[2]);
        dummy.updateMatrix();
        modules.setMatrixAt(i, dummy.matrix);

        dummy.position.z = position[2] + scale[2] * 0.5 + 0.014;
        dummy.scale.set(scale[0] * 0.62 * pulse, scale[1] * 0.12, 0.02);
        dummy.updateMatrix();
        accents.setMatrixAt(i, dummy.matrix);
      }
      modules.instanceMatrix.needsUpdate = true;
      accents.instanceMatrix.needsUpdate = true;

      const beadPositions = beads.positions;
      for (let i = 0; i < beads.count; i += 1) {
        const index = i * 3;
        const position = modulePositions[Math.floor(beads.seeds[i * 4])];
        const t = (beads.seeds[i * 4 + 1] + time * beads.seeds[i * 4 + 3]) % 1;
        beadPositions[index] = lerp(0, position[0] * 0.86, t) + pointer.x * 0.018 * (1 - t);
        beadPositions[index + 1] = lerp(0, position[1] * 0.86, t) - pointer.y * 0.014 * (1 - t);
        beadPositions[index + 2] = lerp(0, position[2] * 0.86, t) + Math.sin(t * Math.PI) * 0.1;
      }
      beads.geometry.attributes.position.needsUpdate = true;
    };
  };

  const buildContact = () => {
    const group = createGroup("contact");

    const laneCount = quality.tier === "high" ? 14 : quality.tier === "balanced" ? 10 : 6;
    const laneMaterial = metalMaterial(group, 0x536779, {
      metalness: 0.86, roughness: 0.24, emissive: VIOLET, emissiveIntensity: 0.1, opacity: 0.82
    });
    const laneMaterialLime = metalMaterial(group, LIME, {
      metalness: 0.8, roughness: 0.24, emissive: LIME, emissiveIntensity: 0.14, opacity: 0.82
    });
    const curves = [];
    const limeSegments = [];
    const violetSegments = [];
    const divisions = quality.tier === "high" ? 18 : quality.tier === "balanced" ? 12 : 8;

    for (let i = 0; i < laneCount; i += 1) {
      const angle = (i / laneCount) * Math.PI * 2;
      const height = Math.sin(angle * 2.3) * 0.85;
      const start = new THREE.Vector3(Math.cos(angle) * 3.4, Math.sin(angle) * 2.3 + height, -3.6);
      const middle = new THREE.Vector3(Math.cos(angle + 0.5) * 2.1, Math.sin(angle + 0.5) * 1.4 - height * 0.4, -0.9);
      const end = new THREE.Vector3(Math.cos(angle + 0.9) * 0.35, Math.sin(angle + 0.9) * 0.28, 1.85);
      const curve = new THREE.CatmullRomCurve3([start, middle, end]);
      curves.push(curve);

      // One shared cylinder geometry is instanced for every lane segment.
      const points = curve.getPoints(divisions);
      const segments = i % 3 === 0 ? limeSegments : violetSegments;
      for (let j = 0; j < points.length - 1; j += 1) {
        segments.push([points[j].toArray(), points[j + 1].toArray()]);
      }
    }

    makeTubes(group, limeSegments, laneMaterialLime, 0.018);
    makeTubes(group, violetSegments, laneMaterial, 0.018);

    const core = new THREE.Mesh(
      keep(new THREE.OctahedronGeometry(0.52, quality.detail > 0.7 ? 1 : 0)),
      glassMaterial(group, LIME, { transmission: 0.88, opacity: 0.56, thickness: 1.7 })
    );
    core.position.z = 1.85;
    group.add(core);

    const heart = new THREE.Mesh(
      keep(new THREE.IcosahedronGeometry(0.2, 1)),
      accentMaterial(group, LIME, 0.95, 1.1)
    );
    heart.position.z = 1.85;
    group.add(heart);

    const stream = makeParticles(group, particleCount(520), 0.52, 0.03, (i, positions, seeds) => {
      seeds[i * 4] = (random() * laneCount) % laneCount;
      seeds[i * 4 + 1] = random();
      seeds[i * 4 + 2] = random();
      seeds[i * 4 + 3] = 0.06 + random() * 0.09;
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    });
    const point = new THREE.Vector3();

    group.userData.spin = 0.018;
    group.userData.float = 0.035;
    group.userData.animate = (dt, time, pointer) => {
      core.rotation.y += dt * 0.1;
      core.rotation.x = Math.sin(time * 0.22) * 0.12;
      heart.scale.setScalar(0.85 + Math.sin(time * 1.6) * 0.12);

      for (let i = 0; i < stream.count; i += 1) {
        const index = i * 3;
        const laneIndex = Math.min(curves.length - 1, Math.floor(stream.seeds[i * 4]));
        const t = (stream.seeds[i * 4 + 1] + time * stream.seeds[i * 4 + 3]) % 1;
        curves[laneIndex].getPoint(t, point);
        const bend = (1 - t) * 0.55;
        const reaction = reactionAt(point.x, point.y);
        stream.positions[index] = point.x + pointer.x * bend + Math.sin(stream.seeds[i * 4 + 2] * 14 + time) * reaction * 0.14;
        stream.positions[index + 1] = point.y - pointer.y * bend + Math.cos(stream.seeds[i * 4 + 2] * 12 + time) * reaction * 0.12;
        stream.positions[index + 2] = point.z;
      }
      stream.geometry.attributes.position.needsUpdate = true;
    };
  };

  /* ------------------------------------------------------------------ *\
   * BEYOND THE PORTFOLIO — generative particle fields
   * ------------------------------------------------------------------ */

  const buildLab = () => {
    const group = createGroup("lab");

    const ghost = new THREE.Mesh(
      keep(new THREE.TorusKnotGeometry(1.62, 0.028, Math.round(96 * quality.detail), quality.detail > 0.7 ? 7 : 5, 2, 3)),
      metalMaterial(group, VIOLET, { metalness: 0.7, roughness: 0.3, emissive: VIOLET, emissiveIntensity: 0.12, opacity: 0.24 })
    );
    group.add(ghost);

    const particles = makeParticles(group, particleCount(1500), 0.72, 0.034, (i, positions, seeds) => {
      const u = random() * Math.PI * 2;
      const p = 2;
      const q = 3;
      const qu = (q / p) * u;
      const radius = 1.42 + 0.52 * Math.cos(qu);
      const jitter = (random() - 0.5) * 0.22;
      positions[i * 3] = Math.cos(u) * radius + jitter;
      positions[i * 3 + 1] = Math.sin(u) * radius + jitter * 0.8;
      positions[i * 3 + 2] = 0.62 * Math.sin(qu) + jitter;

      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const scatter = 2.9 + random() * 1.5;
      seeds[i * 4] = theta * Math.sin(phi) * scatter + positions[i * 3] * 0.4;
      seeds[i * 4 + 1] = phi * scatter * 0.8 + positions[i * 3 + 1] * 0.4;
      seeds[i * 4 + 2] = Math.cos(theta) * scatter * 0.75 + positions[i * 3 + 2] * 0.5;
      seeds[i * 4 + 3] = random();
    });

    const base = new Float32Array(particles.count * 3);
    base.set(particles.positions);
    const scatter = new Float32Array(particles.count * 3);
    scatter.set(particles.seeds.subarray(0, particles.count * 3));

    group.userData.spin = 0.02;
    group.userData.float = 0.04;
    group.userData.animate = (dt, time) => {
      ghost.rotation.y += dt * 0.06;
      const globalMorph = 0.5 + 0.5 * Math.sin(time * 0.34 - Math.PI / 2);
      const position = particles.positions;

      for (let i = 0; i < particles.count; i += 1) {
        const index = i * 3;
        const local = clamp01(globalMorph + particles.seeds[i * 4 + 3] * 0.28 - 0.14);
        const blend = smooth(local);
        const swirl = Math.sin(time * 0.55 + particles.seeds[i * 4 + 3] * 12) * 0.12;
        const depth = 0.6 + (base[index + 2] + 1) * 0.18;
        const reaction = reactionAt(position[index], position[index + 1]);
        position[index] = lerp(base[index], scatter[index], blend) + swirl + Math.sin(particles.seeds[i * 4 + 3] * 20 + time) * reaction * 0.16;
        position[index + 1] = lerp(base[index + 1], scatter[index + 1], blend) + swirl * 0.6 + Math.cos(particles.seeds[i * 4 + 3] * 18 + time) * reaction * 0.14;
        position[index + 2] = lerp(base[index + 2], scatter[index + 2], blend) + Math.cos(time * 0.4 + i) * 0.08;
        position[index] += reaction * depth * 0.02;
      }
      particles.geometry.attributes.position.needsUpdate = true;
    };
  };

  const buildConcepts = () => {
    const group = createGroup("concepts");
    // Three morph targets loosely echo the documented studies: generative, interaction, local tools.
    const centres = [[-1.95, 0.7, -0.4], [1.85, 1.05, 0.35], [0.15, -1.55, 0.9]];

    centres.forEach((centre, index) => {
      const frame = new THREE.Mesh(
        keep(new THREE.TetrahedronGeometry(0.78 + index * 0.1, 0)),
        metalMaterial(group, index === 1 ? LIME : VIOLET, {
          metalness: 0.72, roughness: 0.34, opacity: 0.34,
          emissive: index === 1 ? LIME : VIOLET, emissiveIntensity: 0.12
        })
      );
      frame.position.set(...centre);
      frame.rotation.set(random() * 0.6, random() * 0.8, random() * 0.4);
      group.add(frame);

      const inner = new THREE.Mesh(
        keep(new THREE.OctahedronGeometry(0.16, 0)),
        accentMaterial(group, index === 1 ? VIOLET : LIME, 0.9, 0.9)
      );
      inner.position.set(...centre);
      group.add(inner);
    });

    const count = particleCount(1300);
    const particles = makeParticles(group, count, 0.68, 0.032, (i, positions, seeds) => {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const radius = 3.3 + random() * 1.1;
      seeds[i * 4] = Math.sin(phi) * Math.cos(theta) * radius;
      seeds[i * 4 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.8;
      seeds[i * 4 + 2] = Math.cos(phi) * radius * 0.75;
      seeds[i * 4 + 3] = random();
      positions[i * 3] = seeds[i * 4];
      positions[i * 3 + 1] = seeds[i * 4 + 1];
      positions[i * 3 + 2] = seeds[i * 4 + 2];
    });

    const homes = [];
    for (let state = 0; state < 3; state += 1) {
      const home = new Float32Array(count * 3);
      const centre = centres[state];
      for (let i = 0; i < count; i += 1) {
        const arm = i % 4;
        const t = random();
        const spread = 0.35 + random() * 0.5;
        const angle = (arm / 4) * Math.PI * 2 + t * 1.2;
        home[i * 3] = centre[0] + Math.cos(angle) * spread * (1 - t * 0.4);
        home[i * 3 + 1] = centre[1] + Math.sin(angle) * spread * 0.8 * (1 - t * 0.4);
        home[i * 3 + 2] = centre[2] + (t - 0.5) * 1.4 + (random() - 0.5) * 0.3;
      }
      homes.push(home);
    }

    group.userData.spin = -0.016;
    group.userData.float = 0.04;
    group.userData.animate = (dt, time) => {
      const stateTime = time * 0.13;
      const state = Math.floor(stateTime) % 3;
      const next = (state + 1) % 3;
      const blend = smooth(clamp01((stateTime % 1 - 0.15) / 0.7));
      const assembly = 0.72 + 0.28 * Math.sin(time * 0.24);
      const position = particles.positions;

      for (let i = 0; i < count; i += 1) {
        const index = i * 3;
        const structuredX = lerp(homes[state][index], homes[next][index], blend);
        const structuredY = lerp(homes[state][index + 1], homes[next][index + 1], blend);
        const structuredZ = lerp(homes[state][index + 2], homes[next][index + 2], blend);
        const wobble = Math.sin(time * 0.7 + particles.seeds[i * 4 + 3] * 10) * 0.08;
        const reaction = reactionAt(position[index], position[index + 1]);
        position[index] = lerp(particles.seeds[i * 4], structuredX, assembly) + wobble + Math.sin(particles.seeds[i * 4 + 3] * 16 + time) * reaction * 0.16;
        position[index + 1] = lerp(particles.seeds[i * 4 + 1], structuredY, assembly) + wobble * 0.5 + Math.cos(particles.seeds[i * 4 + 3] * 15 + time) * reaction * 0.14;
        position[index + 2] = lerp(particles.seeds[i * 4 + 2], structuredZ, assembly);
      }
      particles.geometry.attributes.position.needsUpdate = true;
    };
  };

  const networkState = {
    group: null,
    nodes: [],
    edges: [],
    segments: [],
    selected: -1,
    enter: 0,
    depart: 0,
    departing: false,
    focus: { x: 0, y: 0 }
  };

  /* The HTML buttons are the accessible source of truth. Their layout rects set
     the 3D node positions, so focus, pointer, glow, and activation stay aligned. */
  const buildNetwork = () => {
    const group = createGroup("network");
    const map = document.querySelector("[data-network-map]");
    const nodeButtons = [...document.querySelectorAll("[data-network-node]")];
    const edgePairs = (map?.dataset.edges || "")
      .split(",")
      .map((pair) => pair.split("-").map(Number))
      .filter(([a, b]) =>
        Number.isInteger(a) && Number.isInteger(b) &&
        a >= 0 && b >= 0 && a !== b && a < nodeButtons.length && b < nodeButtons.length
      );

    networkState.group = group;
    networkState.enter = 0;
    networkState.depart = 0;
    networkState.departing = false;
    group.userData.spin = 0;
    group.userData.float = 0;
    group.userData.fadeMultiplier = 1;

    const nodeMaterial = trackMaterial(group, new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    const linkMaterial = trackMaterial(group, new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.54,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    const haloMaterial = trackMaterial(group, new THREE.MeshBasicMaterial({
      color: LIME,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));

    const nodeGeometry = keep(new THREE.IcosahedronGeometry(0.15, quality.detail > 0.7 ? 1 : 0));
    const nodeMesh = keep(new THREE.InstancedMesh(nodeGeometry, nodeMaterial, Math.max(1, nodeButtons.length)));
    nodeMesh.frustumCulled = false;
    group.add(nodeMesh);

    const halo = keep(new THREE.Mesh(keep(new THREE.RingGeometry(0.19, 0.245, 28)), haloMaterial));
    halo.visible = false;
    group.add(halo);

    const divisions = 5;
    const segmentCount = edgePairs.length * divisions;
    const lineMesh = segmentCount
      ? keep(new THREE.InstancedMesh(tubeGeometry, linkMaterial, segmentCount))
      : null;
    if (lineMesh) {
      lineMesh.frustumCulled = false;
      group.add(lineMesh);
    }

    const decorations = makeParticles(group, particleCount(90), 0.34, 0.038, (i, positions, seeds) => {
      const angle = random() * Math.PI * 2;
      const radius = 2.4 + random() * 6.4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius * 0.62;
      positions[i * 3 + 2] = -2.8 + random() * 4.6;
      seeds[i * 4] = positions[i * 3];
      seeds[i * 4 + 1] = positions[i * 3 + 1];
      seeds[i * 4 + 2] = random() * 0.98;
      seeds[i * 4 + 3] = random() * Math.PI * 2;
    }, [NETWORK_CYAN, NETWORK_CYAN, NETWORK_CYAN, LIME]);

    const pulses = makeParticles(group, particleCount(18), 0.95, 0.09, (i, positions, seeds) => {
      seeds[i * 4] = random();
      seeds[i * 4 + 1] = random();
      seeds[i * 4 + 2] = i % 5 === 0 ? 0.9 : 0.1;
      seeds[i * 4 + 3] = 0.1 + random() * 0.16;
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }, [NETWORK_CYAN, LIME]);

    const worldFromButton = (button) => {
      const rect = button.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return null;
      const nx = ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1;
      const ny = 1 - ((rect.top + rect.height / 2) / window.innerHeight) * 2;
      const scale = root.scale.x || 1;
      return {
        x: (nx * view.halfWidth) / scale,
        y: (ny * view.halfHeight) / scale,
        z: Number(button.dataset.nodeDepth || 0),
        id: button.dataset.nodeId || ""
      };
    };

    const tubeDummy = new THREE.Object3D();
    const tubeStart = new THREE.Vector3();
    const tubeEnd = new THREE.Vector3();
    const tubeDirection = new THREE.Vector3();

    const placeTube = (mesh, index, from, to, radius) => {
      tubeStart.set(from[0], from[1], from[2]);
      tubeEnd.set(to[0], to[1], to[2]);
      tubeDirection.subVectors(tubeEnd, tubeStart);
      const length = tubeDirection.length();
      if (length < 0.001) return;
      tubeDummy.position.copy(tubeStart).add(tubeEnd).multiplyScalar(0.5);
      tubeDummy.quaternion.setFromUnitVectors(UNIT_Y, tubeDirection.normalize());
      tubeDummy.scale.set(radius, length, radius);
      tubeDummy.updateMatrix();
      mesh.setMatrixAt(index, tubeDummy.matrix);
    };

    const refreshPositions = () => {
      if (!nodeButtons.length) return false;
      const next = nodeButtons.map(worldFromButton);
      if (next.some((point) => !point)) return false;
      networkState.nodes = next;
      networkState.edges = edgePairs.filter(([a, b]) => next[a] && next[b]);
      networkState.segments.length = 0;

      networkState.edges.forEach(([a, b], edgeIndex) => {
        const from = next[a];
        const to = next[b];
        for (let step = 0; step < divisions; step += 1) {
          const t0 = step / divisions;
          const t1 = (step + 1) / divisions;
          const arc0 = Math.sin(t0 * Math.PI) * 0.3;
          const arc1 = Math.sin(t1 * Math.PI) * 0.3;
          const start = [
            lerp(from.x, to.x, t0),
            lerp(from.y, to.y, t0),
            lerp(from.z, to.z, t0) + arc0
          ];
          const end = [
            lerp(from.x, to.x, t1),
            lerp(from.y, to.y, t1),
            lerp(from.z, to.z, t1) + arc1
          ];
          const index = networkState.segments.length;
          networkState.segments.push({ edgeIndex, start, end });
          if (lineMesh) placeTube(lineMesh, index, start, end, 0.013);
        }
      });

      if (lineMesh) lineMesh.instanceMatrix.needsUpdate = true;
      return true;
    };

    const cyanColor = new THREE.Color(NETWORK_CYAN);
    const limeColor = new THREE.Color(LIME);
    const dimColor = new THREE.Color(0x0b2c38);
    const nodeDummy = new THREE.Object3D();

    const refreshNodeInstances = () => {
      nodeMaterial.color.setScalar(0.42 + networkState.enter * 0.68);
      for (let i = 0; i < networkState.nodes.length; i += 1) {
        const node = networkState.nodes[i];
        const selected = i === networkState.selected;
        const breath = selected ? 1 + Math.sin(performance.now() * 0.004) * 0.1 : 1;
        nodeDummy.position.set(node.x, node.y, node.z);
        nodeDummy.rotation.set(0, 0, 0);
        nodeDummy.scale.setScalar((0.72 + networkState.enter * 0.32) * (selected ? 1.72 * breath : 1));
        nodeDummy.updateMatrix();
        nodeMesh.setMatrixAt(i, nodeDummy.matrix);
        nodeMesh.setColorAt(i, selected ? limeColor : cyanColor);
      }
      nodeMesh.instanceMatrix.needsUpdate = true;
      if (nodeMesh.instanceColor) nodeMesh.instanceColor.needsUpdate = true;

      const selectedNode = networkState.nodes[networkState.selected];
      if (halo && selectedNode) {
        halo.visible = true;
        halo.position.set(selectedNode.x, selectedNode.y, selectedNode.z + 0.04);
        halo.scale.setScalar(1 + networkState.enter * 0.28 + Math.sin(performance.now() * 0.003) * 0.08);
        halo.quaternion.copy(camera.quaternion);
      } else if (halo) {
        halo.visible = false;
      }
    };

    const refreshLineColors = () => {
      if (!lineMesh) return;
      const connected = new Set();
      if (networkState.selected >= 0) {
        edgePairs.forEach(([a, b], index) => {
          if (a === networkState.selected || b === networkState.selected) connected.add(index);
        });
      }
      linkMaterial.color.setScalar(0.34 + networkState.enter * 0.66);
      networkState.segments.forEach((segment, index) => {
        const color = networkState.selected < 0
          ? cyanColor
          : connected.has(segment.edgeIndex)
            ? (index % 4 === 0 ? limeColor : cyanColor)
            : dimColor;
        lineMesh.setColorAt(index, color);
      });
      if (lineMesh.instanceColor) lineMesh.instanceColor.needsUpdate = true;
    };

    const refreshPulsePositions = (time) => {
      if (!pulses || !networkState.edges.length) return;
      const positions = pulses.positions;
      for (let i = 0; i < pulses.count; i += 1) {
        const edge = networkState.edges[i % networkState.edges.length];
        const from = networkState.nodes[edge[0]];
        const to = networkState.nodes[edge[1]];
        if (!from || !to) continue;
        const t = (pulses.seeds[i * 4] + time * pulses.seeds[i * 4 + 3]) % 1;
        const index = i * 3;
        positions[index] = lerp(from.x, to.x, t) + Math.sin(time * 1.1 + pulses.seeds[i * 4 + 1] * 9) * 0.02;
        positions[index + 1] = lerp(from.y, to.y, t) + Math.cos(time * 0.9 + pulses.seeds[i * 4 + 1] * 7) * 0.02;
        positions[index + 2] = lerp(from.z, to.z, t) + Math.sin(t * Math.PI) * 0.32 + 0.07;
      }
      pulses.geometry.attributes.position.needsUpdate = true;
    };

    group.userData.relayout = () => {
      if (!refreshPositions()) return;
      refreshNodeInstances();
      refreshLineColors();
      refreshPulsePositions(0);
    };

    group.userData.animate = (dt, time) => {
      networkState.enter = Math.min(1, networkState.enter + dt / 1.15);
      if (networkState.departing) {
        networkState.depart = Math.min(1, networkState.depart + dt / 0.62);
      }
      group.userData.fadeMultiplier = 1 - ease(networkState.depart);

      const focusNode = networkState.nodes[networkState.selected];
      const follow = Math.min(1, dt * 2.8);
      networkState.focus.x += ((focusNode?.x || 0) - networkState.focus.x) * follow;
      networkState.focus.y += ((focusNode?.y || 0) - networkState.focus.y) * follow;

      refreshNodeInstances();
      refreshLineColors();
      refreshPulsePositions(time);

      let fadeFactor = currentGroup === group ? 1 : 0;
      if (transition?.from === group) fadeFactor = transition.fromFactor * (1 - ease(transition.progress));
      else if (transition?.to === group) fadeFactor = ease(transition.progress);
      setGroupOpacity(group, fadeFactor);
    };

    group.userData.relayout();
  };

  builders.hero = buildHero;
  builders.work = buildWork;
  builders.capabilities = buildCapabilities;
  builders.profile = buildProfile;
  builders.contact = buildContact;
  builders.lab = buildLab;
  builders.concepts = buildConcepts;
  builders.network = buildNetwork;

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const view = { halfWidth: 8, halfHeight: 5 };
  const heroBounds = { x: 0, y: 0, radius: 0 };
  const heroBlockedTarget = ".hero-copy, .nav, .scene-progress, a, button, input, textarea, select, dialog";
  const finePointer = window.matchMedia
    ? window.matchMedia("(pointer: fine)").matches
    : true;

  const getGroup = (name) => {
    if (groups[name]) return groups[name];
    (builders[name] || buildHero)();
    return groups[name];
  };

  const activeVisual = document.querySelector(".scene.is-active")?.dataset.visual || "hero";
  let currentGroup = getGroup(activeVisual);
  let transition = null;
  currentGroup.visible = true;
  setGroupOpacity(currentGroup, 1);

  const updateHeroBounds = () => {
    const hero = groups.hero;
    if (!hero?.userData.radius) return;
    const scale = root.scale.x;
    heroBounds.x = (0.5 + (hero.userData.baseX * scale) / (view.halfWidth * 2)) * window.innerWidth;
    heroBounds.y = (0.5 - (hero.userData.baseY * scale) / (view.halfHeight * 2)) * window.innerHeight;
    heroBounds.radius = (hero.userData.radius * scale / (view.halfWidth * 2)) * window.innerWidth;
  };

  const heroContains = (x, y) => {
    const dx = x - heroBounds.x;
    const dy = y - heroBounds.y;
    return dx * dx + dy * dy <= heroBounds.radius * heroBounds.radius * 1.08;
  };

  const layout = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    view.halfHeight = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    view.halfWidth = view.halfHeight * camera.aspect;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.dpr));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    /* Phase 12 places the network sphere on the right while the copy keeps its
       left column. The wider desktop crop is intentional; narrower desktops pull
       the centre in slightly so the heading never sits under the mesh. */
    const wide = window.innerWidth >= 1200;
    root.position.x = 0;
    root.position.y = 0;
    root.scale.setScalar(wide ? quality.scale : quality.scale * 0.9);
    const hero = groups.hero;
    if (hero) {
      const xTarget = wide ? 0.755 : 0.735;
      const yTarget = wide ? 0.54 : 0.56;
      const scale = root.scale.x;
      hero.userData.baseX = ((xTarget * 2 - 1) * view.halfWidth) / scale;
      hero.userData.baseY = ((0.5 - yTarget) * 2 * view.halfHeight) / scale;
      if (hero.userData.hero) hero.userData.hero.uniforms.pixelRatio.value = renderer.getPixelRatio();
    }
    groups.network?.userData.relayout?.();
    updateHeroBounds();
  };

  layout();

  const update = (dt, time) => {
    if (transition) {
      transition.progress = Math.min(1, transition.progress + (dt * 1000) / FADE_MS);
      const eased = ease(transition.progress);
      setGroupOpacity(transition.from, transition.fromFactor * (1 - eased));
      setGroupOpacity(transition.to, eased);
      transition.from.scale.setScalar(1 - eased * 0.04);
      transition.to.scale.setScalar(0.96 + eased * 0.04);
      transition.from.position.z = -eased * 0.4;
      transition.to.position.z = 0.4 - eased * 0.4;

      if (transition.progress >= 1) {
        transition.from.visible = false;
        transition.from.position.z = 0;
        setGroupOpacity(transition.from, 0);
        transition.from.scale.setScalar(1);
        transition.to.position.z = 0;
        setGroupOpacity(transition.to, 1);
        transition.to.scale.setScalar(1);
        transition = null;
      }
    }

    const visibleGroups = transition ? [transition.from, transition.to] : [currentGroup];
    visibleGroups.forEach((group) => {
      if (!group) return;
      if (group.userData.spin) group.rotation.y += dt * group.userData.spin;
      group.position.x = group.userData.baseX;
      group.position.y = group.userData.baseY + Math.sin(time * 0.42) * group.userData.float;
      group.userData.animate?.(dt, time, pointer);
    });

    const follow = Math.min(1, dt * 3.2);
    pointer.x += (pointer.targetX - pointer.x) * follow;
    pointer.y += (pointer.targetY - pointer.y) * follow;

    interaction.x = (pointer.x / 0.45) * view.halfWidth;
    interaction.y = (-pointer.y / 0.35) * view.halfHeight;
    interaction.localX = interaction.x - root.position.x;
    interaction.localY = interaction.y - root.position.y;

    const networkGroup = groups.network;
    const networkActive = Boolean(networkGroup && (
      currentGroup === networkGroup ||
      transition?.from === networkGroup ||
      transition?.to === networkGroup
    ));
    const parallax = networkActive ? 0.34 : 1;
    const focusX = networkActive ? networkState.focus.x * 0.12 : 0;
    const focusY = networkActive ? networkState.focus.y * 0.1 : 0;

    root.rotation.y += (pointer.x * 0.2 * parallax - root.rotation.y) * follow;
    root.rotation.x += (-pointer.y * 0.13 * parallax - root.rotation.x) * follow;
    camera.position.x += (pointer.x * 0.32 * parallax + focusX - camera.position.x) * follow;
    camera.position.y += (-pointer.y * 0.2 * parallax + focusY - camera.position.y) * follow;
    camera.lookAt(
      networkActive ? networkState.focus.x * 0.08 : root.position.x * 0.42,
      networkActive ? networkState.focus.y * 0.08 : 0,
      0
    );
  };

  let running = false;
  let frameId = 0;
  let lastTime = 0;
  let lastRender = 0;
  let lastActivity = performance.now();
  let visible = !document.hidden;
  let overlayActive = Boolean(document.querySelector("dialog[open]"));
  let enabled = true;
  let tierActive = true;

  const stats = {
    frames: 0,
    calls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    lastFrameMs: 0,
    tier: quality.tier
  };
  if (groups.hero?.userData.hero) stats.hero = groups.hero.userData.hero;
  stats.heroBounds = heroBounds;
  window.__prototypeSceneStats = stats;

  const canRun = () => tierActive && enabled && visible && !overlayActive && !reducedMotion && !disposed;
  const markActivity = () => { lastActivity = performance.now(); };
  const pointerSettled = () =>
    Math.abs(pointer.targetX - pointer.x) < 0.002 &&
    Math.abs(pointer.targetY - pointer.y) < 0.002;

  const applyTierSettings = () => {
    violetRim.visible = quality.lights === "full" || quality.lights === "balanced";
    coolFill.visible = quality.lights === "full";
    warmFill.visible = quality.lights === "full";
    renderer.toneMapping = quality.tier === "low" ? THREE.LinearToneMapping : THREE.ACESFilmicToneMapping;

    const factor = quality.particle || 1;
    particleFields.forEach(({ geometry, builtCount, baseCount }) => {
      const target = Math.min(builtCount, Math.max(24, Math.round(baseCount * factor)));
      geometry.setDrawRange(0, target);
    });
  };

  const setQualityTier = (value) => {
    if (disposed) return false;
    const name = String(value || "").toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(QUALITY, name)) return false;

    Object.assign(quality, QUALITY[name]);
    stats.tier = quality.tier;
    applyTierSettings();

    if (name === "mobile") {
      tierActive = false;
      stop();
      canvas.style.visibility = "hidden";
      document.documentElement.classList.remove("has-webgl");
      document.documentElement.classList.add("no-webgl");
      return true;
    }

    tierActive = true;
    canvas.style.visibility = "";
    document.documentElement.classList.remove("no-webgl");
    document.documentElement.classList.add("has-webgl");
    layout();
    markActivity();
    start();
    return true;
  };

  stats.setQualityTier = setQualityTier;

  const frame = (time) => {
    if (!running) return;
    if (time - lastRender < quality.frameMs) {
      frameId = requestAnimationFrame(frame);
      return;
    }

    const elapsed = lastRender ? time - lastRender : quality.frameMs;
    const dt = Math.min(0.05, lastTime ? (time - lastTime) / 1000 : 0);
    lastTime = time;
    lastRender = time;
    update(dt, time / 1000);
    renderer.render(scene, camera);

    stats.frames += 1;
    stats.calls = renderer.info.render.calls;
    stats.triangles = renderer.info.render.triangles;
    stats.geometries = renderer.info.memory.geometries;
    stats.textures = renderer.info.memory.textures;
    stats.lastFrameMs = Math.round(elapsed * 10) / 10;

    if (transition || time < lastActivity + quality.idleMs || !pointerSettled()) {
      frameId = requestAnimationFrame(frame);
    } else {
      running = false;
    }
  };

  const start = () => {
    if (running || !canRun()) return;
    running = true;
    lastTime = 0;
    frameId = requestAnimationFrame(frame);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(frameId);
  };

  const setVisual = (name) => {
    const next = getGroup(name);
    if (next === currentGroup) return;

    if (currentGroup === groups.hero && next !== groups.hero) {
      const hero = groups.hero.userData.hero;
      if (hero) {
        hero.dragging = false;
        hero.pointerId = -1;
        hero.velocityYaw = 0;
        hero.velocityPitch = 0;
        hero.clearFocus?.();
      }
    }

    const networkGroup = groups.network;
    if (name === "network" && networkGroup) {
      networkGroup.userData.enter = 0;
      networkGroup.userData.fadeMultiplier = 1;
      networkState.depart = 0;
      networkState.departing = false;
      networkState.selected = -1;
      networkState.focus.x = 0;
      networkState.focus.y = 0;
      networkGroup.userData.relayout?.();
    } else if (networkGroup && networkGroup !== next) {
      networkState.selected = -1;
      networkState.departing = false;
      networkState.depart = 0;
      networkState.focus.x = 0;
      networkState.focus.y = 0;
      networkGroup.userData.fadeMultiplier = 1;
    }

    let outgoing;
    let outgoingFactor;

    if (transition) {
      outgoing = transition.to;
      outgoingFactor = ease(transition.progress);
      transition.from.visible = false;
      transition.from.position.z = 0;
      setGroupOpacity(transition.from, 0);
    } else {
      outgoing = currentGroup;
      outgoingFactor = 1;
    }

    transition = { from: outgoing, to: next, progress: 0, fromFactor: outgoingFactor };
    currentGroup = next;
    next.visible = true;
    next.position.z = 0.4;
    setGroupOpacity(next, 0);
    markActivity();
    start();
  };

  const onHeroPointerDown = (event) => {
    const hero = groups.hero;
    if (!hero || currentGroup !== hero || overlayActive || event.button !== 0) return;
    const target = event.target instanceof Element ? event.target.closest(heroBlockedTarget) : null;
    if (target || !heroContains(event.clientX, event.clientY)) return;

    const state = hero.userData.hero;
    if (!state) return;
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.lastMoveTime = performance.now();
    state.velocityYaw = 0;
    state.velocityPitch = 0;
    event.preventDefault();
    markActivity();
    start();
  };

  const onHeroPointerEnd = (event) => {
    const hero = groups.hero;
    const state = hero?.userData.hero;
    if (!state?.dragging || event.pointerId !== state.pointerId) return;
    state.dragging = false;
    state.pointerId = -1;
    if (performance.now() - state.lastMoveTime > 140) {
      state.velocityYaw = 0;
      state.velocityPitch = 0;
    }
    markActivity();
    start();
  };

  const onPointerMove = (event) => {
    pointer.targetX = (event.clientX / window.innerWidth - 0.5) * 0.9;
    pointer.targetY = (event.clientY / window.innerHeight - 0.5) * 0.7;

    const hero = groups.hero;
    const state = hero?.userData.hero;
    if (hero && currentGroup === hero && state && !overlayActive) {
      if (state.dragging && event.pointerId === state.pointerId) {
        const dx = event.clientX - state.lastX;
        const dy = event.clientY - state.lastY;
        const sphere = hero.userData.sphere;
        sphere.rotation.y += dx * 0.005;
        sphere.rotation.x = Math.max(-0.42, Math.min(0.42, sphere.rotation.x + dy * 0.004));
        state.velocityYaw = dx * 0.018;
        state.velocityPitch = dy * 0.012;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        state.lastMoveTime = performance.now();
        state.updateFocus?.(event.clientX, event.clientY);
      } else if (heroContains(event.clientX, event.clientY)) {
        state.updateFocus?.(event.clientX, event.clientY);
      } else if (state.focusIndex >= 0 || state.focusTarget > 0) {
        state.clearFocus?.();
      }
    }

    markActivity();
    start();
  };

  const onVisibility = () => {
    visible = !document.hidden;
    if (visible) {
      markActivity();
      start();
    } else {
      stop();
    }
  };

  const onOverlay = (event) => {
    overlayActive = Boolean(event.detail?.active);
    if (overlayActive) {
      stop();
    } else {
      markActivity();
      start();
    }
  };

  const onScene = (event) => setVisual(event.detail?.visual);

  const onNetworkSelect = (event) => {
    const group = groups.network;
    if (!group || group !== currentGroup) return;
    const index = Number(event.detail?.index);
    if (!Number.isInteger(index) || index < 0) return;
    networkState.selected = index;
    networkState.departing = true;
    networkState.depart = 0;
    group.userData.fadeMultiplier = 1;
    markActivity();
    start();
  };

  const onNetworkRestore = (event) => {
    const group = groups.network;
    if (!group || group !== currentGroup) return;
    const index = Number(event.detail?.index);
    if (!Number.isInteger(index) || index < 0 || index >= networkState.nodes.length) return;

    const node = networkState.nodes[index];
    networkState.selected = index;
    networkState.departing = false;
    networkState.depart = 0;
    networkState.focus.x = node.x;
    networkState.focus.y = node.y;
    group.userData.fadeMultiplier = 1;
    markActivity();
    start();
  };

  const onNetworkReset = () => {
    const group = groups.network;
    if (!group) return;
    networkState.selected = -1;
    networkState.departing = false;
    networkState.depart = 0;
    networkState.focus.x = 0;
    networkState.focus.y = 0;
    group.userData.fadeMultiplier = 1;
    markActivity();
    start();
  };

  const onResize = () => {
    markActivity();
    layout();
    renderer.render(scene, camera);
    start();
  };

  const onContextLost = (event) => {
    event.preventDefault();
    stop();
    if (disposed) return;
    document.documentElement.classList.add("no-webgl");
    document.documentElement.classList.remove("has-webgl");
  };

  const onContextRestored = () => {
    if (disposed) return;
    markActivity();
    document.documentElement.classList.remove("no-webgl");
    document.documentElement.classList.add("has-webgl");
    layout();
    start();
  };

  if (finePointer) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onHeroPointerDown);
    window.addEventListener("pointerup", onHeroPointerEnd);
    window.addEventListener("pointercancel", onHeroPointerEnd);
  }
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("prototype:scene", onScene);
  window.addEventListener("prototype:network-select", onNetworkSelect);
  window.addEventListener("prototype:network-restore", onNetworkRestore);
  window.addEventListener("prototype:network-reset", onNetworkReset);
  window.addEventListener("prototype:overlay", onOverlay);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

  start();

  return {
    setVisual,
    setQualityTier,
    setActive(value) {
      enabled = Boolean(value);
      if (enabled) {
        markActivity();
        start();
      } else {
        stop();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      if (finePointer) {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerdown", onHeroPointerDown);
        window.removeEventListener("pointerup", onHeroPointerEnd);
        window.removeEventListener("pointercancel", onHeroPointerEnd);
      }
      window.removeEventListener("resize", onResize);
      window.removeEventListener("prototype:scene", onScene);
      window.removeEventListener("prototype:network-select", onNetworkSelect);
      window.removeEventListener("prototype:network-restore", onNetworkRestore);
      window.removeEventListener("prototype:network-reset", onNetworkReset);
      window.removeEventListener("prototype:overlay", onOverlay);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      disposables.forEach((resource) => resource.dispose?.());
      renderer.dispose();
      renderer.forceContextLoss?.();
      delete window.__prototypeSceneStats;
    }
  };
}
