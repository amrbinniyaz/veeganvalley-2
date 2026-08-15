import gsap from "gsap";
import Swiper from "swiper";
import { Navigation, EffectCreative, Controller } from "swiper/modules";
import { isDesktop } from "../lib/mq.js";

/**
 * Two carousels moving as one.
 *
 * The packs and their copy are separate sliders, cross-linked via Swiper's
 * controller so either can drive the other. They deliberately use *different*
 * creative transforms — the packs swing wider and rotate, the copy just slides
 * — which gives the pack a sense of being physically swapped while the text
 * stays readable throughout.
 *
 * Touch dragging is enabled only below 992px. On desktop the arrows are the
 * affordance; letting a trackpad drag the packs there fights page scroll.
 */
export function initFlavour() {
  const section = document.querySelector("[data-flavour-content]");
  if (!section) return;

  const touch = !isDesktop();
  const ring = section.querySelector("[data-flavour-content-svg] path");

  const packs = new Swiper("[data-flavour-slider]", {
    modules: [Navigation, EffectCreative, Controller],
    effect: "creative",
    loop: true,
    grabCursor: touch,
    allowTouchMove: touch,
    initialSlide: 2,
    creativeEffect: {
      prev: { translate: touch ? ["-80%", "15%", 0] : ["-60%", "15%", 0], opacity: 0, scale: 0.35, rotate: [0, 0, -15] },
      next: { translate: touch ? ["80%", "15%", 0] : ["50%", "15%", 0], opacity: 0, scale: 0.6, rotate: [0, 0, 35] },
    },
    navigation: {
      nextEl: "[data-flavour-slider-right-button]",
      prevEl: "[data-flavour-slider-left-button]",
    },
  });

  const copy = new Swiper("[data-flavour-content-slider]", {
    modules: [Navigation, EffectCreative, Controller],
    effect: "creative",
    loop: true,
    allowTouchMove: touch,
    initialSlide: 2,
    creativeEffect: {
      prev: { translate: touch ? ["-75%", "15%", 0] : ["-40%", "15%", 0], opacity: 0, scale: 0.5 },
      next: { translate: touch ? ["75%", "15%", 0] : ["40%", "15%", 0], opacity: 0, scale: 0.5 },
    },
  });

  packs.controller.control = copy;
  copy.controller.control = packs;

  /* The ring starts as a zero-length segment two-thirds of the way round, so
     it opens from a point that isn't the path's own start — the seam lands
     somewhere unremarkable instead of announcing itself. */
  if (ring) {
    gsap.set(ring, { drawSVG: "65% 65%" });
    gsap
      .timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 65%",
          once: true,
          // One automatic advance, delayed a beat so it reads as a reaction
          // to arriving rather than part of the page load.
          onEnter: () => gsap.delayedCall(0.1, () => packs.slideNext()),
        },
      })
      .to(ring, { drawSVG: "165% 65%", ease: "power2.out", duration: 1.4 });
  }
}
