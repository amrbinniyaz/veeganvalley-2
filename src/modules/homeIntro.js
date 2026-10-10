// Logo-only homepage opening. It adds no 3D engine or product asset of its own.
export function startHomeIntro({ onReveal, onUnlock, ready = Promise.resolve() } = {}) {
  const root = document.documentElement;
  const overlay = document.querySelector('.home-intro');
  const skip = overlay.querySelector('.home-intro-skip');
  const main = document.querySelector('#main');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const background = [...document.body.children].filter(element => element !== overlay && element.tagName !== 'SCRIPT');
  const previous = background.map(element => element.inert);
  const started = performance.now();
  let finished = false, leaving = false, revealed = false, holdTimer = 0, exitTimer = 0;
  const cleanups = [];
  const listen = (target, event, handler) => {
    target.addEventListener(event, handler);
    cleanups.push(() => target.removeEventListener(event, handler));
  };
  function release() {
    if (finished) return;
    finished = true;
    if (!revealed) { revealed = true; onReveal?.({ immediate: true }); }
    clearTimeout(holdTimer); clearTimeout(exitTimer); clearTimeout(window.veganHomeIntroWatchdog);
    root.classList.remove('home-intro-pending');
    overlay.classList.remove('home-intro-leaving');
    background.forEach((element, index) => { element.inert = previous[index]; });
    main.removeAttribute('aria-busy');
    cleanups.forEach(cleanup => cleanup());
    if (overlay.contains(document.activeElement)) main.focus({ preventScroll: true });
    onUnlock?.();
  }
  function finish(immediate = false) {
    if (finished || leaving) { if (immediate) release(); return; }
    leaving = true;
    clearTimeout(holdTimer);
    if (!revealed) { revealed = true; onReveal?.({ immediate: immediate || motion.matches }); }
    if (immediate || motion.matches) { release(); return; }
    overlay.classList.add('home-intro-leaving');
    exitTimer = setTimeout(release, 850);
  }
  if (root.classList.contains('home-intro-pending')) {
    background.forEach(element => { element.inert = true; });
    main.setAttribute('aria-busy', 'true');
    skip.focus({ preventScroll: true });
    listen(skip, 'click', () => finish(true));
    listen(window, 'vegan-home-intro-timeout', () => finish(true));
    listen(motion, 'change', () => { if (motion.matches) finish(true); });
    listen(overlay, 'keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); finish(true); }
      if (event.key === 'Tab') { event.preventDefault(); skip.focus(); }
    });
    const logo = new Image();
    logo.src = '/img/logo/vegan-valley.png';
    // Wait for the bottle only; the faint botanical art can arrive after the intro.
    const heroImages = [...document.querySelectorAll('.journey-stage > .bottle-view .bottle-fallback')];
    Promise.allSettled([ready, document.fonts.ready, logo.decode(), ...heroImages.map(image => image.decode())]).then(() => {
      if (finished || leaving) return;
      holdTimer = setTimeout(() => finish(), motion.matches ? 0 : Math.max(0, 1350 - (performance.now() - started)));
    });
  } else release();
  return { get active() { return !finished; }, destroy: release };
}
