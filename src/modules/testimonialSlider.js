import gsap from "gsap";

const lerp = (a, b, t) => a + (b - a) * t;

/** Frame-rate-independent lerp: `factor` is the rate, `dt` the frame time. */
const damp = (a, b, factor, dt) => lerp(a, b, 1 - Math.exp(-factor * dt));

/** Signed wrap into [-range/2, range/2) — the shortest way round a ring. */
function wrapSigned(value, range) {
  const half = range / 2;
  return ((((value + half) % range) + range) % range) - half;
}

/**
 * Wrap into [-1, count-1) for placement.
 *
 * A symmetric wrap would spread the deck evenly either side of index 0,
 * which parks half the cards off-screen to the left and leaves the right
 * half of the track empty. Biasing the window one slot left instead means
 * exactly one card is queued off the left edge and the rest fill forward
 * across the viewport.
 */
function wrapForward(value, range) {
  return ((((value + 1) % range) + range) % range) - 1;
}

/**
 * An infinite, momentum-driven carousel.
 *
 * Position is a float in *index units*, not pixels, so wrapping is a modulo
 * over the item count and every item's placement falls out of one signed
 * distance. No cloned DOM nodes, no jump-to-start seam.
 *
 * Two things give it its character:
 *
 * 1. Momentum with decay, rather than tweening between slides. A flick keeps
 *    travelling and settles where it runs out, so the slider has weight.
 *    Snapping only engages once the throw has nearly died, which stops it
 *    fighting the user mid-gesture.
 *
 * 2. Speed-reactive parallax. The inner card is offset by its distance from
 *    centre *scaled by current speed*, so the deck fans out while moving and
 *    closes up when it settles. That's why it reads as a stack of cards being
 *    riffled rather than a strip sliding past.
 */
export class InfiniteSlider {
  constructor(root, options = {}) {
    this.root = root;
    this.config = {
      scrollSensitivity: 1.5,
      speedDecay: 0.9,
      snap: true,
      snapStrength: 0.12,
      touchMultiplier: 8.5,
      ...options,
    };

    this.items = [...root.children];
    this.inners = [...root.querySelectorAll("[data-slider-item-inner]")];
    this.count = this.items.length;

    this.position = 0;
    this.velocity = 0;
    this.smoothedSpeed = 0;
    this.activeIndex = 0;
    this.isVisible = true;
    this.step = 0;

    if (this.count < 2) return;

    this.update = this.update.bind(this);
    this.measure = this.measure.bind(this);

    this.measure();
    this.bindInput();
    this.setActive(0);

    window.addEventListener("resize", this.measure);
    new IntersectionObserver(([entry]) => (this.isVisible = entry.isIntersecting)).observe(root);

    gsap.ticker.add(this.update);
  }

  measure() {
    const first = this.items[0];
    if (!first) return;
    const style = getComputedStyle(this.root);
    const gap = parseFloat(style.columnGap || style.gap || "0") || 0;
    this.step = first.getBoundingClientRect().width + gap;
    this.trackLeft = this.root.getBoundingClientRect().left;
  }

  bindInput() {
    /* Horizontal intent wins; a mostly-vertical wheel is left to the page so
       the slider never hijacks scroll. */
    this.root.addEventListener(
      "wheel",
      (event) => {
        const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
        if (!horizontal) return;
        event.preventDefault();
        this.velocity += (event.deltaX / this.step) * this.config.scrollSensitivity;
      },
      { passive: false }
    );

    let dragging = false;
    let lastX = 0;

    const down = (x) => {
      dragging = true;
      lastX = x;
      this.velocity = 0;
      this.root.classList.add("is-dragging");
    };
    const move = (x) => {
      if (!dragging) return;
      const delta = (lastX - x) / this.step;
      lastX = x;
      this.position += delta;
      this.velocity = delta;
    };
    const up = () => {
      dragging = false;
      this.root.classList.remove("is-dragging");
    };

    this.root.addEventListener("pointerdown", (e) => down(e.clientX));
    window.addEventListener("pointermove", (e) => move(e.clientX));
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    window.addEventListener("keydown", (event) => {
      if (!this.isVisible) return;

      if (/^[0-9]$/.test(event.key)) {
        this.goToIndex(parseInt(event.key, 10));
        return;
      }
      if (event.key === "ArrowLeft") this.goToPrev();
      if (event.key === "ArrowRight") this.goToNext();
    });
  }

  update() {
    if (!this.step) return;

    const dt = Math.min(gsap.ticker.deltaRatio() / 60, 0.05) || 1 / 60;

    this.position += this.velocity;
    this.velocity *= this.config.speedDecay;

    // Snap only once the throw is nearly spent, so it never fights a gesture.
    if (this.config.snap && Math.abs(this.velocity) < 0.02) {
      const target = Math.round(this.position);
      this.position = lerp(this.position, target, this.config.snapStrength);
      if (Math.abs(target - this.position) < 0.001) this.position = target;
    }

    // Smoothed speed drives the fan-out; raw velocity would make it jitter.
    this.smoothedSpeed = damp(this.smoothedSpeed, this.velocity, 5, dt * 60);

    const spread = Math.abs(this.smoothedSpeed) * 20;

    /* Parallax is measured from the centre of the viewport, not from index 0,
       so the deck fans symmetrically around what the user is looking at. */
    const centre = (window.innerWidth / 2 - this.trackLeft) / this.step - 0.5;

    this.items.forEach((item, i) => {
      const offset = wrapForward(i - this.position, this.count);
      item.style.transform = `translateX(${offset * this.step}px)`;

      const inner = this.inners[i];
      if (inner) inner.style.transform = `translateX(${(offset - centre) * spread}%)`;
    });

    const index = ((Math.round(this.position) % this.count) + this.count) % this.count;
    if (index !== this.activeIndex) this.setActive(index);
  }

  setActive(index) {
    this.items[this.activeIndex]?.classList.remove("is-active");
    this.items[index]?.classList.add("is-active");
    this.activeIndex = index;
  }

  goToIndex(index) {
    // Travel the short way round rather than unwinding through the middle.
    this.position += wrapSigned(index - this.position, this.count);
  }

  goToNext() {
    this.position = Math.round(this.position) + 1;
  }

  goToPrev() {
    this.position = Math.round(this.position) - 1;
  }

  /** Wire the external arrow buttons, which live outside the track. */
  attachInterface(root) {
    const arrows = root?.querySelector("[data-slider-arrows]");
    if (!arrows) return;
    [...arrows.children].forEach((button, i) => {
      button.onclick = () => (i === 0 ? this.goToPrev() : this.goToNext());
    });
  }
}

export function initTestimonialSlider() {
  const track = document.querySelector("[data-slider]");
  if (!track) return null;

  const slider = new InfiniteSlider(track, { snap: true, scrollSensitivity: 1.5, speedDecay: 0.9 });
  slider.attachInterface(document.querySelector("[data-slider-interface]"));

  /* Nudge it one slide as it scrolls into view — a still carousel reads as a
     static list, and one unprompted move tells you it's interactive. */
  document.querySelectorAll("[data-testimonial-inview]").forEach((el) => {
    gsap.timeline({
      scrollTrigger: { trigger: el, start: "top 75%", once: true, onEnter: () => slider.goToNext() },
    });
  });

  return slider;
}
