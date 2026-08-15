import Lenis from "lenis";
import ScrollTrigger from "gsap/ScrollTrigger";

let lenis;

/**
 * Lenis owns scroll position; ScrollTrigger must read from it rather than
 * from the native scroll event, or every scrubbed timeline lags a frame
 * behind the smoothed position and the whole page feels rubbery.
 */
export function initSmoothScroll() {
  lenis = new Lenis({ lerp: 0.18, autoRaf: true });

  lenis.on("scroll", ScrollTrigger.update);
  ScrollTrigger.defaults({ ignoreMobileResize: true });

  return lenis;
}

/** Scroll is locked for the whole intro, then handed back to the user. */
export const stopScroll = () => lenis?.stop();
export const startScroll = () => lenis?.start();
export const getLenis = () => lenis;
