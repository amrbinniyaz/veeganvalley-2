import { onResize } from "./mq.js";

/* Cap the backing store at 2x. Above that the extra pixels are invisible but
   the per-frame drawImage cost keeps climbing, and this canvas repaints on
   every scroll tick. */
const MAX_DPR = 2;
const dpr = () => Math.min(window.devicePixelRatio || 1, MAX_DPR);

/**
 * A canvas that draws one frame of a numbered image sequence at a time.
 *
 * Two loading strategies, because the two sequences have opposite needs:
 *
 *   "eager"  — 200 plain `Image` objects, fired off at once and drawn
 *              whenever they happen to be decoded. The scroll sequence can
 *              tolerate a not-yet-loaded frame (it just holds the previous
 *              one), and waiting for all 200 before showing anything would
 *              stall the page for megabytes.
 *
 *   "decoded" — fetch → createImageBitmap, awaited as a batch. The intro
 *              can't tolerate a miss: it plays 23 frames as a timed animation
 *              in the first seconds, so a late decode would show a gap. The
 *              loader is holding the page anyway, so blocking is free.
 */
export class FrameSequence {
  constructor(canvas, {
    basePath,
    prefix,
    count,
    fit = "height",
    strategy = "eager",
    contentHeight = 1,
  }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.count = count;
    this.fit = fit;
    this.strategy = strategy;
    /* Fraction of the frame's height the subject actually occupies. The
       renders carry ~20% transparent margin top and bottom, so fitting the
       *frame* to the box leaves the product rendering 40% smaller than the
       space allows. Dividing through by this fits the subject instead; the
       empty margin simply overflows and is clipped. */
    this.contentHeight = contentHeight;
    this.frames = new Array(count);
    this.ready = false;
    this.src = (i) => `${basePath}${prefix}_${i}.webp`;

    this.resize = this.resize.bind(this);
    this.draw = this.draw.bind(this);
  }

  async load() {
    if (this.strategy === "eager") {
      for (let i = 0; i < this.count; i++) {
        const img = new Image();
        img.src = this.src(i);
        img.onerror = () => console.warn(`[frames] failed to load ${img.src}`);
        this.frames[i] = img;
      }
      // Only the first frame is awaited — enough to size and paint something.
      await decodeSafely(this.frames[0]);
    } else {
      /* One unreadable frame must not take the whole intro down with it — a
         truncated file on disk would otherwise leave the page stuck behind
         the loader. Hold the last good frame in its place instead. */
      const decoded = await Promise.all(
        Array.from({ length: this.count }, async (_, i) => {
          try {
            return await fetchBitmap(this.src(i));
          } catch (err) {
            console.warn(`[frames] ${this.src(i)} failed to decode`, err);
            return null;
          }
        })
      );

      let lastGood = decoded.find(Boolean);
      if (!lastGood) throw new Error("[frames] no frame in the sequence could be decoded");
      this.frames = decoded.map((f) => (f ? (lastGood = f) : lastGood));
    }

    this.ready = true;
    this.resize();
    return this;
  }

  /** Match the backing store to the CSS box at the current DPR. */
  resize() {
    const box = this.sizeSource || this.canvas;
    const rect = box.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (!w || !h) return;

    const ratio = dpr();
    this.canvas.width = Math.round(w * ratio);
    this.canvas.height = Math.round(h * ratio);
    this.cssWidth = w;
    this.cssHeight = h;

    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    this.draw(this.current ?? 0);
  }

  /**
   * `fit` decides how a square render sits in a non-square box:
   *   "height" — fill the height, centre horizontally. Desktop: the product
   *              is as large as the viewport allows and bleeds off the sides.
   *   "bottom" — 80% of the height, pinned to the bottom edge. Mobile: leaves
   *              headroom for the card that scrolls over it.
   *   "contain" — fit entirely inside. The hero, where the whole product
   *              silhouette has to stay visible.
   */
  draw(index) {
    if (!this.ready) return;
    this.current = index;

    const frame = this.frames[Math.round(index)];
    if (!frame || (frame.naturalWidth === 0 && !frame.width)) return;

    const { ctx, cssWidth: cw, cssHeight: ch } = this;
    if (!cw || !ch) return;
    ctx.clearRect(0, 0, cw, ch);

    const fw = frame.naturalWidth || frame.width;
    const fh = frame.naturalHeight || frame.height;
    const aspect = fw / fh;

    const boost = 1 / (this.contentHeight || 1);

    let h, w, x, y;
    if (this.fit === "contain") {
      const scale = Math.min(cw / fw, ch / fh) * boost;
      w = fw * scale;
      h = fh * scale;
      x = (cw - w) / 2;
      y = (ch - h) / 2;
    } else if (this.fit === "bottom") {
      h = ch * 0.8 * boost;
      w = aspect * h;
      x = Math.round((cw - w) / 2);
      // Anchor the subject's foot to the bottom, not the frame's.
      y = Math.round(ch - h + (h - h / boost) / 2);
    } else {
      h = ch * boost;
      w = aspect * h;
      x = Math.round((cw - w) / 2);
      y = Math.round((ch - h) / 2);
    }

    ctx.drawImage(frame, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  /**
   * Size the backing store from another element rather than the canvas itself.
   * The scroll canvas is transformed (scaled and nudged) by its own timeline,
   * so measuring it would feed those transforms back into the resolution.
   */
  setSizeSource(el) {
    this.sizeSource = el;
    return this;
  }

  observeResize() {
    onResize(this.resize);
    return this;
  }
}

async function decodeSafely(img) {
  try {
    if (img.decode) await img.decode();
  } catch {
    /* A single undecodable frame shouldn't block the page. */
  }
}

async function fetchBitmap(url) {
  const blob = await (await fetch(url)).blob();
  if (window.createImageBitmap) {
    return createImageBitmap(blob, { imageOrientation: "from-image" });
  }
  const img = new Image();
  img.src = URL.createObjectURL(blob);
  await decodeSafely(img);
  return img;
}
