import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { lowPowerDevice, sceneMinWidth } from './scene-support.js';

gsap.registerPlugin(ScrollTrigger);

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let preferenceListenerAttached = false;
let cleanupHandle;
let spaceLoadToken = 0;
let spaceLoading = false;

function handlePreferenceChange() {
  cleanupHandle?.();
  if (!motionPreference.matches) initializeMotion();
}

function attachPreferenceListener() {
  if (preferenceListenerAttached) return;
  motionPreference.addEventListener('change', handlePreferenceChange);
  preferenceListenerAttached = true;
}

/**
 * Single owner of hero and scroll-linked motion. The existing Web Animations
 * reveal system keeps ownership of [data-reveal]; component animations keep
 * ownership of their own controls. Nothing here transforms main.shell because
 * the Browser Tracker modal is position:fixed inside it.
 */
export function initializeMotion() {
  if (cleanupHandle) return cleanupHandle;
  const mainHero = document.querySelector('.hero');
  const beyondHero = document.querySelector('.beyond-hero');
  if (!mainHero && !beyondHero) return () => {};

  attachPreferenceListener();

  const page = beyondHero ? 'beyond' : 'main';
  const minWidth = sceneMinWidth(page);
  let space = null;
  const tweens = [];
  const sceneTweens = [];
  const listeners = [];
  const introElements = [];
  let disposed = false;
  let resizeTimer = 0;
  let pendingConceptIndex = null;

  const track = tween => {
    tweens.push(tween);
    return tween;
  };
  const trackScene = tween => {
    sceneTweens.push(tween);
    return tween;
  };
  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push([target, type, handler, options]);
  };

  if (!motionPreference.matches) {
    const selectors = page === 'main'
      ? ['.hero .eyebrow', '.hero h1', '.hero-intro', '.hero-actions', '.profile-panel-stage']
      : ['[data-hero-motion]'];
    selectors.forEach(selector => document.querySelectorAll(selector).forEach(element => introElements.push(element)));
    if (introElements.length) {
      // Start near the final state rather than hidden: if rAF is throttled before
      // the first tick, the content is still readable and interactive.
      track(gsap.fromTo(
        introElements,
        { opacity: .82, y: 12 },
        { opacity: 1, y: 0, duration: .9, stagger: .09, ease: 'power3.out', clearProps: 'all' }
      ));
    }
  }

  const clearSceneDomTransforms = () => {
    ['.hero-copy', '.capability-list', '.beyond-hero-main'].forEach(selector => {
      const element = document.querySelector(selector);
      if (element) gsap.set(element, { clearProps: 'transform' });
    });
  };
  const killSceneTweens = () => {
    sceneTweens.forEach(tween => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
    sceneTweens.length = 0;
  };
  const disposeScene = () => {
    killSceneTweens();
    clearSceneDomTransforms();
    const host = document.querySelector('.space-stage');
    if (host) host.style.opacity = '';
    space?.dispose();
    space = null;
  };

  const buildSceneMotion = () => {
    const s = space.state;

    if (page === 'main') {
      trackScene(gsap.to(s.hero, {
        z: -2.4, rot: .12, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
      }));
      trackScene(gsap.to(s.tracker, {
        x: -1.8, tilt: .045, ease: 'none',
        scrollTrigger: { trigger: '.project-tracker', start: 'top bottom', end: 'bottom top', scrub: 1.1 },
      }));
      trackScene(gsap.fromTo(s.voice, { wave: 0 }, {
        wave: 1, ease: 'none',
        scrollTrigger: { trigger: '.project-voice', start: 'top 85%', end: 'center 45%', scrub: 1 },
      }));
      trackScene(gsap.to(s.depth, {
        z: 1.2, rot: -.1, ease: 'none',
        scrollTrigger: { trigger: '.about-section', start: 'top bottom', end: 'bottom top', scrub: 1.2 },
      }));
      trackScene(gsap.to(s.close, {
        opacity: .16, ease: 'none',
        scrollTrigger: { trigger: '.contact-section', start: 'top 85%', end: 'top 30%', scrub: true },
      }));
      trackScene(gsap.to('.hero-copy', {
        y: -26, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
      }));
      trackScene(gsap.to('.capability-list', {
        y: -12, ease: 'none',
        scrollTrigger: { trigger: '.capabilities-section', start: 'top bottom', end: 'bottom top', scrub: 1 },
      }));
    } else {
      trackScene(gsap.to(s.hero, {
        z: -2.8, rot: .1, ease: 'none',
        scrollTrigger: { trigger: '.beyond-hero', start: 'top top', end: 'bottom top', scrub: 1 },
      }));
      trackScene(gsap.to(s, {
        gateway: .05, ease: 'none',
        scrollTrigger: { trigger: '.beyond-hero', start: 'top top', end: 'bottom top', scrub: 1 },
      }));
      trackScene(gsap.to(s.depth, {
        z: 1.4, rot: -.08, ease: 'none',
        scrollTrigger: { trigger: '.concept-stage', start: 'top bottom', end: 'center center', scrub: 1 },
      }));
      trackScene(gsap.to(s, {
        planeOpacity: 1, ease: 'none',
        scrollTrigger: { trigger: '.concept-stage', start: 'top bottom', end: 'center center', scrub: 1 },
      }));
      trackScene(gsap.to(s.tracker, {
        x: 1.2, tilt: -.04, ease: 'none',
        scrollTrigger: { trigger: '.finance-detail', start: 'top bottom', end: 'bottom top', scrub: 1.1 },
      }));
      trackScene(gsap.to(s.close, {
        opacity: .18, ease: 'none',
        scrollTrigger: { trigger: '.beyond-contact', start: 'top 85%', end: 'top 30%', scrub: true },
      }));
      trackScene(gsap.to('.beyond-hero-main', {
        y: -24, ease: 'none',
        scrollTrigger: { trigger: '.beyond-hero', start: 'top top', end: 'bottom top', scrub: 1 },
      }));
    }
  };

  const sceneAllowed = () =>
    !motionPreference.matches && window.innerWidth >= minWidth && !lowPowerDevice();

  const syncScene = () => {
    if (!sceneAllowed()) {
      spaceLoadToken += 1;
      if (space) disposeScene();
      return;
    }
    if (space || spaceLoading) return;

    const token = ++spaceLoadToken;
    spaceLoading = true;
    // Three.js is only needed when the optional scene actually runs. Keeping it
    // behind a dynamic import prevents mobile, low-power, and reduced-motion
    // visitors from downloading and parsing it.
    import('./space.js')
      .then(({ createSpace }) => {
        if (disposed || token !== spaceLoadToken || !sceneAllowed()) return;
        try {
          space = createSpace(page);
        } catch {
          space = null;
        }
        if (!space) return;
        buildSceneMotion();
        ScrollTrigger.refresh();
        if (pendingConceptIndex !== null) applyConcept(pendingConceptIndex);
      })
      .catch(() => {})
      .finally(() => {
        spaceLoading = false;
        if (!disposed && !space && sceneAllowed()) syncScene();
      });
  };

  const applyConcept = index => {
    if (!space || motionPreference.matches || !Number.isFinite(index)) return;
    const tween = gsap.to(space.state, {
      focusX: (index - 1) * 4.3,
      duration: .75,
      ease: 'power3.inOut',
      overwrite: 'auto',
      onComplete: () => {
        const position = sceneTweens.indexOf(tween);
        if (position > -1) sceneTweens.splice(position, 1);
      },
    });
    trackScene(tween);
  };

  const onConcept = event => {
    if (motionPreference.matches || !event.detail) return;
    const index = Number(event.detail.index);
    if (!Number.isFinite(index)) return;
    pendingConceptIndex = index;
    applyConcept(index);
  };
  listen(window, 'conceptchange', onConcept);

  const onViewportResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeTimer = 0;
      if (!disposed) syncScene();
    }, 120);
  };
  listen(window, 'resize', onViewportResize, { passive: true });

  const refresh = () => {
    if (!disposed) ScrollTrigger.refresh();
  };
  listen(window, 'load', refresh);
  document.fonts?.ready.then(refresh);

  syncScene();

  function teardown() {
    if (disposed) return;
    disposed = true;
    window.clearTimeout(resizeTimer);
    tweens.forEach(tween => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
    tweens.length = 0;
    listeners.forEach(([target, type, handler, options]) => target.removeEventListener(type, handler, options));
    listeners.length = 0;
    if (introElements.length) gsap.set(introElements, { clearProps: 'all' });
    disposeScene();
    cleanupHandle = undefined;
  }

  cleanupHandle = teardown;
  return teardown;
}
