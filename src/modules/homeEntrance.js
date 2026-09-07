// Entrance transforms use the individual CSS properties, leaving the scroll
// timeline's transform matrices untouched. Cancelling restores normal scrolling.
export function createHomeEntrance({ onBottleProgress } = {}) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = [];
  let frame = 0, started = false, finished = false, disposed = false, startedAt = 0;
  const initialScroll = window.scrollY;
  const eligible = document.documentElement.classList.contains('home-intro-pending') && !motion.matches && initialScroll < 32 && (!location.hash || location.hash === '#home');
  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  };
  const cleanups = [];
  function animate(selector, from, delay, duration, stagger = 0) {
    document.querySelectorAll(selector).forEach((element, index) => {
      // Preserve each layer's designed opacity, including the softer mobile art.
      // Ending at 1 would flash it opaque before cancellation restores the CSS.
      const finalOpacity = getComputedStyle(element).opacity;
      const animation = element.animate([
        { opacity: 0, ...from },
        { opacity: finalOpacity, translate: '0px 0px', rotate: '0deg', scale: '1' },
      ], { duration, delay: delay + index * stagger, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
      animation.pause(); animations.push(animation);
    });
  }
  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame);
    animations.forEach(animation => animation.cancel());
    cleanups.forEach(cleanup => cleanup());
    onBottleProgress?.(1);
  }
  listen(window, 'vegan-home-intro-timeout', finish);
  if (eligible) {
    animate('.journey-stage > .bottle-view', { translate: '65px 65px', rotate: '-13deg', scale: '.83' }, 120, 1550);
    animate('.hero-botanical', { translate: '30px 16px', scale: '.95' }, 200, 1400);
    animate('.hero-message .title-line', { translate: '0px 48px' }, 380, 1100, 130);
    animate('.hero-eyebrow', { translate: '0px 12px' }, 600, 700);
    animate('.hero-copy > *', { translate: '0px 22px' }, 760, 800, 130);
    animate('.hero-product, .hero-stamp, .hero-side-note', { translate: '0px 16px' }, 900, 750, 80);
    animate('.hero-field-note', { translate: '0px 10px' }, 850, 650);
    animate('.journey-footer', { translate: '0px 15px' }, 1160, 650);
    animate('.site-header', { translate: '0px -10px' }, 950, 600);
    animate('.site-header .brand, .desktop-nav a, .header-cta, .menu-toggle', { translate: '0px -12px' }, 1030, 650, 65);
    const arrow = document.querySelector('.hero-field-note path');
    if (arrow) {
      const length = arrow.getTotalLength();
      const drawing = arrow.animate([
        { strokeDasharray: `${length}`, strokeDashoffset: `${length}` },
        { strokeDasharray: `${length}`, strokeDashoffset: '0' },
      ], { delay: 1100, duration: 900, easing: 'ease-in-out', fill: 'both' });
      drawing.pause(); animations.push(drawing);
    }
    onBottleProgress?.(0);
  }
  function turn(time) {
    frame = 0;
    if (finished || disposed) return;
    const fraction = Math.min(1, Math.max(0, (time - startedAt - 120) / 1550));
    onBottleProgress?.(1 - (1 - fraction) ** 3);
    if (fraction < 1) frame = requestAnimationFrame(turn);
  }
  return {
    reveal({ immediate = false } = {}) {
      if (started || finished || disposed) return;
      started = true;
      if (!eligible || immediate || motion.matches || window.scrollY > 32) { finish(); return; }
      startedAt = performance.now();
      animations.forEach(animation => { animation.currentTime = 0; animation.play(); });
      frame = requestAnimationFrame(turn);
      Promise.allSettled(animations.map(animation => animation.finished)).then(finish);
      // Immediately hand control back if the visitor starts exploring.
      listen(window, 'wheel', finish, { passive: true });
      listen(window, 'touchstart', finish, { passive: true });
      listen(window, 'scroll', () => { if (Math.abs(window.scrollY - initialScroll) > 10) finish(); }, { passive: true });
      listen(document, 'keydown', event => { if (['Tab', 'ArrowDown', 'PageDown', 'End', ' '].includes(event.key)) finish(); });
      listen(motion, 'change', () => { if (motion.matches) finish(); });
    },
    destroy() { disposed = true; finish(); },
  };
}
