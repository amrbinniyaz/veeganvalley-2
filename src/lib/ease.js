import gsap from "gsap";
import CustomEase from "gsap/CustomEase";

/**
 * Two hand-authored elastic curves, plus the house ease.
 *
 * These are polylines rather than GSAP's parametric `elastic.out`, and the
 * difference matters: a parametric elastic keeps ringing symmetrically, while
 * these overshoot once, settle fast, and then drift almost imperceptibly back
 * to 1. That single confident bounce is what makes the fact chips and split
 * words read as "placed" rather than "wobbled".
 *
 * ELASTIC peaks at ~1.142 around t=0.245 — a pronounced pop.
 * ELASTIC_SOFT peaks at ~1.049 around t=0.293 — the same shape, a quarter the
 * amplitude, for text where a big overshoot would hurt legibility.
 */
const ELASTIC =
  "M0,0 L0.076,0.5737 L0.1187,0.8382 L0.1419,0.9463 L0.1654,1.0292 L0.1897,1.0886 " +
  "L0.2153,1.1258 L0.2297,1.137 L0.2448,1.1424 L0.261,1.1423 L0.2786,1.1366 " +
  "L0.3101,1.1165 L0.3862,1.0507 L0.4257,1.0219 L0.4699,0.9995 L0.5163,0.9872 " +
  "L0.5877,0.9842 L0.8126,1.0011 L1,1";

const ELASTIC_SOFT =
  "M0,0 L0.017,0.029 L0.036,0.113 L0.111,0.604 L0.15,0.809 L0.191,0.949 " +
  "L0.213,0.995 L0.236,1.026 L0.262,1.044 L0.293,1.049 L0.435,1.01 L0.512,1 L1,1";

/**
 * The statement cards' travel curve. An S that flattens hard through the
 * middle (slope ~0.1 at t=0.5) so a card entering from below decelerates,
 * *hangs* at reading position for most of its scroll budget, then leaves.
 * Without this the cards would sail past at constant speed.
 */
const CARD_TRAVEL = "M0,0 C0,0.201 0.098,0.459 0.5,0.5 0.904,0.541 1,0.805 1,1";

let registered = false;

export function registerEases() {
  if (registered) return;
  registered = true;

  CustomEase.create("smooth-ease", "0.32, 0.72, 0, 1");
  CustomEase.create("elastic-ease-out", ELASTIC);
  CustomEase.create("elastic-ease-out-soft", ELASTIC_SOFT);
  CustomEase.create("card-travel", CARD_TRAVEL);

  gsap.defaults({ ease: "smooth-ease" });
}
