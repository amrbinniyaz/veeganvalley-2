import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import SplitText from "gsap/SplitText";
import CustomEase from "gsap/CustomEase";
import DrawSVGPlugin from "gsap/DrawSVGPlugin";
import InertiaPlugin from "gsap/InertiaPlugin";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/layout.css";
import "swiper/css";

import { registerEases } from "./lib/ease.js";
import { reloadOnLayoutShift } from "./lib/mq.js";
import { initSmoothScroll, stopScroll, startScroll } from "./lib/smoothScroll.js";

import { initLoadStage } from "./modules/loadStage.js";
import { initSequence } from "./modules/sequence.js";
import { initInertia } from "./modules/inertia.js";
import { initTestimonialSlider } from "./modules/testimonialSlider.js";
import { initBowls } from "./modules/bowls.js";
import { initVideo } from "./modules/video.js";
import {
  initMarquee,
  initFillLines,
  initSmileys,
  initHighlightText,
  initBenefitTable,
  initBenefitChecks,
  initPayment,
  initParallax,
} from "./modules/scrollEffects.js";

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin, InertiaPlugin);
registerEases();

/* SplitText measures line boxes. Splitting before the webfont swaps in gives
   line breaks computed against the fallback metrics, which then don't match
   what the user sees. Everything that splits text waits on this. */
async function waitForFonts() {
  try {
    await document.fonts.ready;
  } catch {
    /* Non-blocking: worst case we split against fallback metrics. */
  }
  document.documentElement.classList.add("fonts-loaded");
}

async function boot() {
  initSmoothScroll();

  /* Lock immediately, not when the intro timeline is built. Fonts and the
     frame decode both await, and without the lock the user can scroll past
     the hero while it is still assembling behind the loader. */
  stopScroll();

  await waitForFonts();

  // Scroll-driven work first, so ScrollTrigger has the full page measured
  // before the intro starts moving things around.
  initSequence();
  initInertia();
  initMarquee();
  initSmileys();
  initFillLines();
  initHighlightText();
  initBenefitTable();
  initBenefitChecks();
  initPayment();
  initParallax();
  initTestimonialSlider();
  initBowls();
  initVideo();

  try {
    await initLoadStage();
  } catch (err) {
    // A failed intro must not leave the page permanently unscrollable.
    console.error("[veegan] intro failed", err);
    document.documentElement.classList.add("has-seq-ready", "is-ready");
    startScroll();
  }

  ScrollTrigger.refresh();
  reloadOnLayoutShift();
}

boot();
