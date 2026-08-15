import gsap from "gsap";
import SplitText from "gsap/SplitText";
import { desktop, mobile } from "../lib/mq.js";

/**
 * Text riding a curved path.
 *
 * Animating `startOffset` moves the glyphs *along* the curve, so they rotate
 * and re-space as they travel — something a translated block of text can't
 * do. Scrubbed, so the arc reacts to scroll direction.
 */
export function initMarquee() {
  document.querySelectorAll("[data-marquee]").forEach((el) => {
    const textPath = el.querySelector("[data-marquee-svg] textPath");
    if (!textPath) return;

    gsap
      .timeline({ scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } })
      .fromTo(
        textPath,
        { attr: { startOffset: "-30%" } },
        { attr: { startOffset: "-60%" }, ease: "none", duration: 1 }
      );
  });
}

/** Squiggles that draw themselves once, on the way in. */
export function initFillLines() {
  document.querySelectorAll("[data-fill-line]").forEach((el) => {
    const path = el.querySelector("path");
    if (!path) return;

    desktop(() => {
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: "top 70%", once: true } })
        .fromTo(path, { drawSVG: "0% 0%" }, { drawSVG: "100% 0%", ease: "none", duration: 0.75 });
    });
  });
}

/** Smileys spring in from a tucked, rotated corner. */
export function initSmileys() {
  document.querySelectorAll("[data-smiley]").forEach((el) => {
    desktop(() => {
      gsap.timeline({ scrollTrigger: { trigger: el, start: "top 95%" } }).fromTo(
        el,
        { opacity: 0, scale: 0.5, rotate: 80, transformOrigin: "left bottom" },
        { opacity: 1, scale: 1, rotate: 0, ease: "elastic-ease-out", duration: 0.95 }
      );
    });
  });
}

/**
 * Words pop in, and *then* take on the accent colour.
 *
 * Deliberately two passes: the tint trails the motion by 0.1s on the same
 * per-word stagger, so the colour appears to catch up with each word after it
 * lands. Colouring during the move would just look like a gradient wipe.
 * On mobile the motion is dropped and only the tint runs.
 */
export function initHighlightText() {
  document.querySelectorAll("[data-highlight-text]").forEach((el) => {
    const split = SplitText.create(el, { type: "words", wordsClass: "split-word" });

    desktop(() => {
      gsap.set(split.words, { transformOrigin: "bottom right" });
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: "top 96%", once: true } })
        .fromTo(
          split.words,
          { yPercent: 25, xPercent: 75, opacity: 0, scale: 0.6 },
          {
            yPercent: 0,
            xPercent: 0,
            opacity: 1,
            scale: 1,
            ease: "elastic-ease-out-soft",
            duration: 1,
            stagger: 0.039,
          }
        )
        .to(
          split.words,
          { color: "var(--light-green)", ease: "none", duration: 0.15, stagger: 0.039 },
          "<+.1"
        );
    });

    mobile(() => {
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: "top 90%", once: true } })
        .to(split.words, { color: "var(--light-green)", ease: "none", duration: 0.15, stagger: 0.039 });
    });
  });
}

/** Table rules wipe out from the left as the table arrives. */
export function initBenefitTable() {
  document.querySelectorAll("[data-benefit-table]").forEach((table) => {
    const lines = table.querySelectorAll("[data-benefit-table-line]");

    desktop(() => {
      gsap.set(lines, { transformOrigin: "left center" });
      gsap
        .timeline({ scrollTrigger: { trigger: table, start: "top 90%", once: true } })
        .fromTo(lines, { scaleX: 0 }, { scaleX: 1, stagger: 0.076, duration: 0.85 });
    });
  });
}

/**
 * Each check squashes and springs as it crosses the middle of the screen.
 *
 * The trigger window is a 2% band around centre, and it re-runs each time you
 * pass it in either direction — so scrubbing the table up and down keeps
 * ticking the marks off. The squash (scaleX 0.65, dropping and rotating) reads
 * as weight before the elastic recovery.
 */
export function initBenefitChecks() {
  document.querySelectorAll("[data-benefit-table-check]").forEach((check) => {
    gsap
      .timeline({
        scrollTrigger: {
          trigger: check,
          start: "top 49%",
          end: "bottom 51%",
          toggleActions: "restart none restart none",
        },
      })
      .to(check, {
        keyframes: {
          "0%": { scaleX: 1, yPercent: 0, rotate: 0 },
          "20%": { scaleX: 0.65, yPercent: 25, rotate: 25, ease: "power2.in" },
          "100%": { scaleX: 1, yPercent: 0, rotate: 0, ease: "elastic.out(1,0.4)" },
        },
        duration: 0.85,
      });
  });
}

/** Reassurance row: same last-first elastic entrance as the hero facts. */
export function initPayment() {
  document.querySelectorAll("[data-payment]").forEach((row) => {
    const items = row.querySelectorAll("[data-payment-item]");

    desktop(() => {
      gsap.timeline({ scrollTrigger: { trigger: row, start: "top 96%", once: true } }).fromTo(
        items,
        { opacity: 0, y: 100, x: -40, rotate: -35, scale: 0.6 },
        {
          opacity: 1,
          y: 0,
          x: 0,
          rotate: 0,
          scale: 1,
          ease: "elastic-ease-out",
          duration: 0.8,
          stagger: -0.048,
        }
      );
    });
  });
}

/** Background drifts slower than the section it sits behind. */
export function initParallax() {
  document.querySelectorAll("[data-testimonial-parallax]").forEach((el) => {
    const items = el.querySelectorAll("[data-testimonial-parallax-item]");

    desktop(() => {
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } })
        .to(items, { yPercent: 5, ease: "none", duration: 1 });
    });
  });
}
