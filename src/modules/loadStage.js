import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import SplitText from "gsap/SplitText";
import { FrameSequence } from "../lib/frameSequence.js";
import { desktop, mobile, isDesktop } from "../lib/mq.js";
import { stopScroll, startScroll } from "../lib/smoothScroll.js";

const FRAME_COUNT = 23;
const IDLE_DURATION = 1.38;

/**
 * Pick which bottle greets this visit.
 *
 * The renderer produces one idle sequence per flavour and lists them in
 * hero.json, so the page chooses from what actually exists on disk rather
 * than carrying a duplicate of the flavour list that can drift out of step
 * with the render script. Only the chosen set is ever fetched, so six
 * flavours cost disk but not bandwidth or memory.
 *
 * Falls back to the unsuffixed sequence, which is what older renders emit.
 */
async function pickHeroFlavour() {
  try {
    const res = await fetch("/img/seq/hero.json");
    if (!res.ok) return "seq_1";
    const { flavours } = await res.json();
    if (!flavours?.length) return "seq_1";
    return `seq_1_${flavours[Math.floor(Math.random() * flavours.length)]}`;
  } catch {
    return "seq_1";
  }
}

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
  const rays = stage.querySelectorAll("[data-load-stage-rays] path");

  /* The hero mark is optional — the layout can run without one. When it is
     present it starts at the vertical centre of the viewport and rises into
     place, so measure the offset before anything else moves. */
  const logoTravel = logo
    ? window.innerHeight / 2 -
      (logo.getBoundingClientRect().top + logo.getBoundingClientRect().height / 2)
    : 0;

  const titleLines = SplitText.create(title, { type: "lines", linesClass: "split-line" });
  const textLines = SplitText.create(text, { type: "lines", linesClass: "split-line" });

  stopScroll();

  const sequence = new FrameSequence(canvas, {
    basePath: canvas.dataset.loadStageCanvasImgPath,
    prefix: await pickHeroFlavour(),
    count: FRAME_COUNT,
    // Measured off the alpha channel: the bottle spans ~60.5% of the frame
    // height, the rest is transparent margin.
    contentHeight: 0.605,
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
  if (logo) gsap.set(logo, { y: logoTravel });
  gsap.set(cta, { opacity: 0, y: 60 });
  // A zero-length segment at the ring's midpoint — it grows both ways at once.
  gsap.set(ring, { drawSVG: "50% 50%" });
  /* Rays grow outward from the sun's centre. transformOrigin is the middle of
     the viewBox, which is where every wedge's inner edge meets. */
  gsap.set(rays, { scale: 0, opacity: 0, transformOrigin: "500px 500px" });
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

    // Without a mark to raise, the timeline still needs its opening beat so
    // everything downstream keeps its relative timing.
    tl.to(logo ?? {}, { y: 0, duration: 0.6, delay: 1 })
      .to(nav, { opacity: 1, duration: 0.25 }, "<+=.125")
      .to(cta, { y: 0, opacity: 1, duration: 0.5 }, "<+=.05")
      // Ring sweeps past a full turn (150%) so the join lands off-axis and
      // the stroke reads as drawn by hand rather than snapped shut.
      .to(ring, { drawSVG: "150% 50%", ease: "power2.out", duration: 1.4 }, "<+=.005")
      // Fanning out from the centre rather than left-to-right, so the sun
      // opens the way the ring does.
      .to(
        rays,
        {
          scale: 1,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger: { each: 0.035, from: "center" },
        },
        "<+=.1"
      )
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
