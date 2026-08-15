import gsap from "gsap";

export const DESKTOP = "(min-width: 992px)";
export const MOBILE = "(max-width: 991px)";

/**
 * Register a desktop-only / mobile-only animation scope.
 *
 * Sections here don't scale one timeline across breakpoints — they run
 * genuinely different choreography (the sticky 720lvh scrub simply has no
 * mobile equivalent), so each module declares both scopes explicitly.
 * gsap.matchMedia handles reverting everything created inside the callback
 * when the query stops matching.
 */
export const desktop = (fn) => gsap.matchMedia().add(DESKTOP, fn);
export const mobile = (fn) => gsap.matchMedia().add(MOBILE, fn);

export const isDesktop = () => window.matchMedia(DESKTOP).matches;
export const canHover = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* --- Debounced resize bus ------------------------------------------------
   Canvas modules must re-measure and repaint on resize, but doing that on
   every resize event thrashes: each one reallocates a DPR-scaled backing
   store. One shared debounced bus keeps it to a single pass per gesture.
   ------------------------------------------------------------------------ */

const subscribers = new Set();
let timer;

window.addEventListener("resize", () => {
  clearTimeout(timer);
  timer = setTimeout(() => subscribers.forEach((fn) => fn()), 60);
});

/** Returns an unsubscribe function. */
export function onResize(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/**
 * Reload on changes that invalidate the whole animation graph.
 *
 * Crossing the desktop/mobile boundary, rotating the device, or toggling
 * reduced-motion each mean a different set of timelines should have been
 * built. Rebuilding them live means unwinding ScrollTrigger pins, canvas
 * sizes and Lenis state mid-flight; a reload is both more honest and more
 * reliable. These are deliberate, rare, user-initiated events.
 */
export function reloadOnLayoutShift() {
  ["(prefers-reduced-motion: reduce)", DESKTOP, "(orientation: portrait)"].forEach((q) => {
    window.matchMedia(q).addEventListener("change", () => window.location.reload());
  });
}
