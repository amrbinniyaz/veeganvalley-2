import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import SplitText from "gsap/SplitText";
import { FrameSequence } from "../lib/frameSequence.js";
import { desktop, mobile, isDesktop } from "../lib/mq.js";
import { stopScroll, startScroll } from "../lib/smoothScroll.js";

const FRAME_COUNT = 23;
const IDLE_DURATION = 1.38;

/**
 * The page intro.
 *
 * Scroll is locked for the whole thing and released one second before the
 * end — long enough that the user never feels held, short enough that they
 * can't scroll past the reveal while it's still assembling.
 */
export async function initLoadStage() {
  const nav = document.querySelector("[data-load-nav]");
  const stage = document.querySelector("[data-load-stage]");
  if (!stage) return;

  const logo = stage.querySelector("[data-load-stage-logo]");
  const cta = stage.querySelector("[data-load-stage-cta]");
  const title = stage.querySelector("[data-load-stage-title]");
  const text = stage.querySelector("[data-load-stage-text]");
  const underline = stage.querySelector("[data-load-stage-underline]");
  const facts = stage.querySelectorAll("[data-load-stage-fact]");
  const visual = stage.querySelector("[data-load-stage-visual]");
  const canvas = stage.querySelector("[data-load-stage-canvas]");
  const decoText = stage.querySelector("[data-load-stage-deco-text]");
  const decoArrow = stage.querySelector("[data-load-stage-deco-arrow]");
  const ring = stage.querySelector("[data-load-stage-svg] path");

  /* The logo starts at the vertical centre of the viewport and rises into
     place, so measure the offset before anything else moves. */
  const logoBox = logo.getBoundingClientRect();
  const logoTravel = window.innerHeight / 2 - (logoBox.top + logoBox.height / 2);

  const titleLines = SplitText.create(title, { type: "lines", linesClass: "split-line" });
  const textLines = SplitText.create(text, { type: "lines", linesClass: "split-line" });

  stopScroll();

  const sequence = new FrameSequence(canvas, {
    basePath: canvas.dataset.loadStageCanvasImgPath,
    prefix: "seq_1",
    count: FRAME_COUNT,
    fit: "contain",
    strategy: "decoded",
  }).observeResize();

  await sequence.load();

  // Frames are in memory — the loader can drop its spinner.
  document.documentElement.classList.add("has-seq-ready");
  requestAnimationFrame(() => {
    setTimeout(() => document.documentElement.classList.add("is-ready"), 50);
  });

  const frame = { value: 0 };
  sequence.draw(0);

  /* Two idle loops, held paused until the intro finishes and killed whenever
     the hero leaves the viewport — there's no reason to burn frames redrawing
     a canvas nobody can see. */
  const idleFrames = gsap.fromTo(
    frame,
    { value: FRAME_COUNT - 1 },
    {
      value: 0,
      snap: "value",
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      duration: IDLE_DURATION,
      paused: true,
      immediateRender: false,
      onUpdate: () => sequence.draw(frame.value),
    }
  );

  const idleTilt = gsap.fromTo(
    canvas,
    { yPercent: -1, rotate: -11, rotateX: 0, rotateY: 0 },
    {
      yPercent: isDesktop() ? 2 : 1,
      rotate: -13,
      rotateX: isDesktop() ? -4 : 0,
      rotateY: isDesktop() ? -5 : 0,
      duration: IDLE_DURATION,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      paused: true,
    }
  );

  const startIdle = () => {
    idleTilt.play();
    idleFrames.play();
  };
  const stopIdle = () => {
    idleTilt.pause();
    idleFrames.pause();
  };

  /* --- Shared start state ------------------------------------------- */
  gsap.set(nav, { opacity: 0 });
  gsap.set(logo, { y: logoTravel });
  gsap.set(cta, { opacity: 0, y: 60 });
  // A zero-length segment at the ring's midpoint — it grows both ways at once.
  gsap.set(ring, { drawSVG: "50% 50%" });
  gsap.set(facts, { opacity: 0, y: 100, x: -40, rotate: -35, scale: 0.6 });

  desktop(() => {
    gsap.set(canvas, {
      yPercent: 100,
      xPercent: -50,
      rotate: -35,
      scale: 0.9,
      opacity: 0,
      transformPerspective: 1000,
      transformOrigin: "60% 50%",
    });
    gsap.set(decoText, { opacity: 0, rotate: -18, scale: 1.25, yPercent: -65, xPercent: -25 });
    gsap.set(decoArrow, { opacity: 0, rotate: -6, scale: 1.25, yPercent: 0, xPercent: -125 });
    gsap.set(titleLines.lines, {
      transformOrigin: "100% 100%",
      yPercent: 60,
      xPercent: 25,
      opacity: 0,
      scale: 0.6,
    });
    gsap.set(textLines.lines, { yPercent: 125, opacity: 0 });
    gsap.set(underline, { opacity: 0, yPercent: 45 });

    build({ full: true });
  });

  mobile(() => {
    gsap.set(canvas, { yPercent: 150, xPercent: -50, rotate: -35, scale: 1.1, opacity: 0 });
    gsap.set(decoText, { rotate: -7 });
    gsap.set(decoArrow, { rotate: -105, yPercent: -40 });
    gsap.set(titleLines.lines, { yPercent: 60, opacity: 0 });
    gsap.set(textLines.lines, { yPercent: 125, opacity: 0 });
    gsap.set(underline, { opacity: 0, yPercent: 45 });

    build({ full: false });
  });

  function build({ full }) {
    const tl = gsap.timeline();

    tl.to(logo, { y: 0, duration: 0.6, delay: 1 })
      .to(nav, { opacity: 1, duration: 0.25 }, "<+=.125")
      .to(cta, { y: 0, opacity: 1, duration: 0.5 }, "<+=.05")
      // Ring sweeps past a full turn (150%) so the join lands off-axis and
      // the stroke reads as drawn by hand rather than snapped shut.
      .to(ring, { drawSVG: "150% 50%", ease: "power2.out", duration: 1.4 }, "<+=.005")
      // Negative stagger: the last chip leads. The eye is already at the
      // bottom of the stack when the product arrives beneath it.
      .to(
        facts,
        {
          opacity: 1,
          y: 0,
          x: 0,
          rotate: 0,
          scale: 1,
          ease: "elastic-ease-out",
          duration: 0.8,
          stagger: -0.048,
        },
        "<-=.015"
      );

    if (full) {
      tl.to(decoText, { yPercent: 0, xPercent: 0, opacity: 1, scale: 1, rotate: -7, duration: 0.45 }, "<-=.015")
        .to(decoArrow, { yPercent: 10, opacity: 1, rotate: 9, scale: 1, xPercent: 0, duration: 0.45 }, "<+=.005");
    }

    tl.to(
      canvas,
      {
        yPercent: -1,
        xPercent: 0,
        rotate: -11,
        scale: 1,
        opacity: 1,
        duration: 0.85,
        onComplete: () => {
          ScrollTrigger.create({
            trigger: visual,
            start: "top bottom",
            end: "bottom top",
            onEnter: startIdle,
            onEnterBack: startIdle,
            onLeave: stopIdle,
            onLeaveBack: stopIdle,
          });
        },
      },
      "<-=.005"
    )
      // The product "settles" by running its own frames forward as it lands.
      .to(
        frame,
        {
          value: FRAME_COUNT - 1,
          duration: 0.85,
          ease: "sine.out",
          snap: "value",
          onUpdate: () => sequence.draw(frame.value),
        },
        "<-=.005"
      )
      .to(
        titleLines.lines,
        {
          yPercent: 0,
          xPercent: 0,
          opacity: 1,
          scale: 1,
          ease: "elastic-ease-out-soft",
          duration: 0.95,
          stagger: 0.039,
        },
        "<-=.005"
      )
      .to(textLines.lines, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.039 }, "<+=.01")
      .to(underline, { yPercent: 0, opacity: 1, duration: 0.45 }, "<+=.15");

    tl.call(startScroll, null, full ? "-=1" : "-=1.25");
  }
}
