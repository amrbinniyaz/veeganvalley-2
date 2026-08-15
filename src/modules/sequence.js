import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import SplitText from "gsap/SplitText";
import { FrameSequence } from "../lib/frameSequence.js";
import { desktop, mobile } from "../lib/mq.js";

const FRAME_COUNT = 200;

/* The finale plays as a real timeline, not a scrubbed one — it has elastic
   overshoot, which scrubbing would destroy. So it's gated on scroll progress
   with a deadband: it fires past 0.85 going down, and only resets once you're
   back below 0.675. Without that gap, a scroll that idles near the threshold
   would retrigger the whole thing every few pixels. */
const FIRE_AT = 0.85;
const RESET_AT = 0.675;

export function initSequence() {
  const section = document.querySelector("[data-sequence]");
  if (!section) return;

  const trigger = section.querySelector("[data-sequence-trigger]");
  const stage = section.querySelector("[data-sequence-stage]");
  const canvas = section.querySelector("[data-sequence-canvas]");

  const cards = section.querySelectorAll("[data-sequence-card]");
  const smileys = section.querySelectorAll("[data-sequence-smiley]");
  const linePaths = section.querySelectorAll("[data-sequence-svg] path");
  const innerSignature = section.querySelector("[data-sequence-signature]");
  const title = section.querySelector("[data-sequence-title]");
  const titleSplitTarget = section.querySelector("[data-sequence-title-split]");
  const finalSignatures = section.querySelectorAll("[data-sequence-final-signature]");

  const bottles = section.querySelectorAll("[data-sequence-bottle]");

  // Each bottle's landing angle and depth-of-field live on the element, next to
  // the custom properties that place it on the arc.
  const tiltOf = (el) => Number(el.dataset.tilt || 0);
  const blurOf = (el) => Number(el.dataset.blur || 0);

  const sequence = new FrameSequence(canvas, {
    basePath: canvas.dataset.sequenceCanvasImgPath,
    prefix: "seq_0",
    count: FRAME_COUNT,
    fit: window.matchMedia("(min-width: 992px)").matches ? "height" : "bottom",
  })
    .setSizeSource(stage)
    .observeResize();

  sequence.load();

  const state = { frame: 0 };
  const isLeft = (el) => el.hasAttribute("data-sequence-card-left");

  /* ---------------------------------------------------------------------
     Desktop: the full sticky scrub.
     --------------------------------------------------------------------- */
  desktop(() => {
    let finaleOpen = false;

    const words = SplitText.create(titleSplitTarget, {
      type: "words",
      wordsClass: "split-word",
    });

    /* Finale timelines are paused and played by the gate below rather than
       being part of the scrubbed timeline. */
    const titleIn = gsap
      .timeline({ paused: true })
      .from(words.words, {
        // Words start pushed away from the centre of the line and converge.
        xPercent: (i, _t, targets) => 60 * (Math.floor(targets.length / 2) - i),
        opacity: 0,
        scale: 0,
        duration: 1,
        ease: "expo.out",
        stagger: 0.039,
      })
      .from(
        words.words,
        { yPercent: 150, duration: 1, stagger: 0.039, ease: "elastic-ease-out-soft" },
        0.05
      );

    /* The line-up lands from the middle outwards, so the two centre bottles
       arrive first and the arc unfurls to the edges. Each overshoots past its
       resting angle and settles — the elastic ease is what makes six bottles
       arriving read as a flourish rather than a grid assembling. */
    const garnishIn = gsap
      .timeline({ paused: true })
      .from(finalSignatures, { opacity: 0, duration: 0.2, ease: "none" }, 0)
      .fromTo(
        bottles,
        {
          opacity: 0,
          yPercent: 70,
          scale: 0.55,
          // Start swung well past the landing tilt, in the same direction, so
          // each bottle rotates *into* place instead of counter-rotating.
          rotate: (_i, el) => tiltOf(el) * 2.75,
        },
        {
          opacity: 1,
          yPercent: 0,
          scale: 1,
          rotate: (_i, el) => tiltOf(el),
          duration: 0.9,
          ease: "elastic-ease-out-soft",
          stagger: { each: 0.07, from: "center" },
        },
        0.08
      );

    /* --- Frame scrub -------------------------------------------------
       scrub: 0.7 rather than `true`. A hard scrub makes the product jump
       frames on a fast flick; the lag smooths the frame index into
       something that reads as motion instead of a strobe. */
    gsap.to(state, {
      frame: FRAME_COUNT - 1,
      snap: "frame",
      ease: "none",
      onUpdate: () => sequence.draw(state.frame),
      scrollTrigger: {
        trigger,
        start: "top 20%",
        end: "bottom bottom",
        scrub: 0.7,
        onUpdate: (self) => {
          if (self.direction === 1 && !finaleOpen && self.progress >= FIRE_AT) {
            finaleOpen = true;
            titleIn.play(0);
            garnishIn.play(0);
          } else if (self.direction === -1 && finaleOpen && self.progress <= RESET_AT) {
            finaleOpen = false;
            titleIn.pause(0);
            garnishIn.pause(0);
          }
        },
      },
    });

    /* Product pulls back and settles as the finale arrives, so the title
       has room. Held at scale 1 until 75% — it only recedes at the end. */
    gsap.set(canvas, { transformOrigin: "center bottom" });
    gsap.to(canvas, {
      keyframes: { "75%": { scale: 1 }, "100%": { scale: 0.85, yPercent: 3.5 } },
      duration: 1,
      ease: "none",
      scrollTrigger: { trigger, start: "top top", end: "bottom bottom", scrub: true },
    });

    /* --- The scrubbed master timeline -------------------------------- */
    const vh = window.innerHeight;

    gsap.set(cards, {
      yPercent: 50,
      y: 0.6 * vh,
      xPercent: (_i, el) => (isLeft(el) ? 4 : -4),
    });
    gsap.set(innerSignature, { opacity: 0 });
    gsap.set(title, { y: vh, scale: 0.7 });
    gsap.set(finalSignatures, { y: vh });
    /* Blur is a fixed depth cue, not something that animates — the outer
       bottles sit behind the centre pair and stay soft the whole time. */
    gsap.set(bottles, { y: vh, filter: (_i, el) => `blur(${blurOf(el)}px)` });

    const master = gsap.timeline({
      scrollTrigger: { trigger, start: "top 60%", end: "bottom bottom+=25%", scrub: true },
    });

    master
      .to(
        cards,
        {
          yPercent: -50,
          y: -0.6 * vh,
          xPercent: 0,
          duration: 1,
          // A small random tilt per card, leaning away from its own side.
          rotate: (_i, el) =>
            isLeft(el) ? gsap.utils.random(-5, -2) : gsap.utils.random(2, 5),
          stagger: 0.85,
          ease: "card-travel",
        },
        "step"
      )
      .to(title, { y: 0, scale: 0.9, duration: 1.5, ease: "expoScale(0.5,7,power2.out)" }, ">+=.2")
      .to(finalSignatures, { y: 0, duration: 1, ease: "power1.inOut" }, "<")
      .to(
        bottles,
        {
          y: 0,
          duration: 1.35,
          ease: "power1.inOut",
          stagger: { each: 0.05, from: "center" },
        },
        "<"
      );

    // Smileys cock their heads as their card passes, on the same beat.
    master.to(
      smileys,
      {
        rotate: (_i, el) =>
          el.hasAttribute("data-sequence-smiley-left")
            ? gsap.utils.random(8, 13)
            : gsap.utils.random(-13, -8),
        stagger: 0.85,
        duration: 1,
      },
      "step"
    );

    // Flickers on mid-scroll, then fades before the finale.
    master.to(
      innerSignature,
      {
        keyframes: { "10%": { opacity: 1 }, "70%": { opacity: 1 }, "90%": { opacity: 0 } },
        duration: 1.5,
        ease: "none",
      },
      "step+=.75"
    );

    /* --- The strokes -------------------------------------------------
       Two chained keyframes on one tween. Starting at "100% 100%" the path
       is a zero-length segment parked at its end; moving the start back to
       0% draws it in head-first, then moving the end to 0% erases it
       tail-first. The result is a stroke that snakes across the screen and
       swallows its own tail rather than blinking out.

       stagger 1.35 against a 1.0-duration tween means each stroke has fully
       cleared before the next begins — they read as one continuous gesture
       travelling through the section, not three overlapping ones. */
    master.fromTo(
      linePaths,
      { drawSVG: "100% 100%" },
      {
        keyframes: [
          { drawSVG: "0% 100%", duration: 0.5 },
          { drawSVG: "0% 0%", duration: 0.5 },
        ],
        ease: "none",
        stagger: 1.35,
      },
      "step+=.3"
    );
  });

  /* ---------------------------------------------------------------------
     Mobile: no pinning, no cards in motion. The canvas still scrubs — it's
     the product shot — but the copy is a plain stack below it.
     --------------------------------------------------------------------- */
  mobile(() => {
    sequence.fit = "bottom";

    gsap.to(state, {
      frame: FRAME_COUNT - 1,
      snap: "frame",
      ease: "none",
      onUpdate: () => sequence.draw(state.frame),
      scrollTrigger: { trigger, start: "top 20%", end: "bottom bottom", scrub: 0.7 },
    });

    gsap.set(canvas, { transformOrigin: "center bottom" });
    gsap.to(canvas, {
      keyframes: {
        "10%": { yPercent: 0, scale: 1 },
        "15%": { yPercent: -10, scale: 0.95 },
        "70%": { scale: 0.95 },
        "75%": { scale: 1 },
        "100%": { yPercent: 5, scale: 1 },
      },
      duration: 1,
      ease: "none",
      scrollTrigger: { trigger, start: "top top", end: "bottom bottom", scrub: true },
    });
  });

  ScrollTrigger.refresh();
}
