import gsap from "gsap";
import { canHover } from "../lib/mq.js";

const CLAMP_LINEAR = gsap.utils.clamp(-1080, 1080);
const CLAMP_SPIN = gsap.utils.clamp(-60, 60);

/**
 * Elements you can swat out of the way.
 *
 * On `mouseenter` the element is thrown with the pointer's current velocity
 * and left to coast to a stop — physics, not a canned tween, so the response
 * is proportional to how hard you flicked past it.
 *
 * The spin comes from the 2D cross product of the entry offset and the
 * pointer velocity. Enter through the top edge moving right and you get one
 * sign; through the bottom edge moving right, the other. That's what makes it
 * feel struck rather than merely nudged — the rotation direction encodes
 * *where* you hit it.
 *
 * Pointer velocity is sampled once per animation frame rather than per
 * mousemove: a high-polling mouse can fire several events per frame, and
 * differencing those gives near-zero deltas and a dead-feeling throw.
 *
 * Skipped entirely without a fine pointer — on touch there is no hover to
 * enter with, and the handler would never fire.
 */
export function initInertia() {
  if (!canHover()) return;

  document.querySelectorAll("[data-inertia]").forEach((scope) => {
    let lastX = 0;
    let lastY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let frame = null;

    scope.addEventListener("mousemove", (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        velocityX = event.clientX - lastX;
        velocityY = event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;
        frame = null;
      });
    });

    scope.querySelectorAll("[data-inertia-item]").forEach((item) => {
      item.addEventListener("mouseenter", (event) => {
        const child = item.querySelector("[data-inertia-item-child]");
        if (!child) return;

        const { left, top, width, height } = child.getBoundingClientRect();
        const offsetX = event.clientX - (left + width / 2);
        const offsetY = event.clientY - (top + height / 2);

        // z-component of offset × velocity, normalised by distance from centre
        // so a glancing edge hit spins more than a hit through the middle.
        const spin =
          (offsetX * velocityY - offsetY * velocityX) / (Math.hypot(offsetX, offsetY) || 1);

        gsap.to(child, {
          inertia: {
            x: { velocity: CLAMP_LINEAR(velocityX * 30), end: 0 },
            y: { velocity: CLAMP_LINEAR(velocityY * 30), end: 0 },
            rotation: { velocity: CLAMP_SPIN(spin * 15), end: 0 },
            resistance: 180,
          },
        });
      });
    });
  });
}
