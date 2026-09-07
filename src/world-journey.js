import Lenis from 'lenis';
import { CHAPTERS, clamp, activeChapterAt, chapterScrollPosition, layerOffset } from './lib/journeyTiming.js';

const viewport = document.querySelector('.story-viewport');
const track = document.querySelector('.story-track');
const scenes = [...document.querySelectorAll('.story-scene')];
const links = [...document.querySelectorAll('[data-chapter-link]')];
const arrows = [...document.querySelectorAll('[data-direction]')];
const progress = document.querySelector('.chapter-line span');
const pageNumber = document.querySelector('[data-page-number]');
const status = document.querySelector('[data-chapter-status]');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const layers = scenes.flatMap((scene, index) => [...scene.querySelectorAll('[data-depth]')].map(element => ({ element, index, depth: Number(element.dataset.depth) })));
const cleanups = [];
let lenis, world, frame = 0, disposed = false;
let activeChapter = -1, width = viewport.clientWidth;
let destination = null;
const listen = (target, event, handler, options) => {
  target.addEventListener(event, handler, options);
  cleanups.push(() => target.removeEventListener(event, handler, options));
};


function render() {
  frame = 0;
  const left = viewport.scrollLeft;
  const index = activeChapterAt(left, width);
  if (index !== activeChapter) {
    activeChapter = index;
    // Move focus out before hiding an outgoing scene from assistive technology.
    if (scenes.some((scene, i) => i !== index && scene.contains(document.activeElement))) viewport.focus({ preventScroll: true });
    scenes.forEach((scene, i) => {
      scene.inert = i !== index;
      scene.setAttribute('aria-hidden', String(i !== index));
    });
    links.forEach(link => {
      if (Number(link.dataset.chapterLink) === index) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    pageNumber.textContent = String(index + 1).padStart(2, '0');
    status.textContent = `${index + 1} of ${CHAPTERS.length}: ${CHAPTERS[index].label}`;
  }
  arrows[0].disabled = left < 2;
  arrows[1].disabled = left >= (CHAPTERS.length - 1) * width - 2;
  progress.style.transform = `scaleX(${(clamp(left / Math.max(1, width), 0, 3) + 1) / 4})`;
  const motionScale = width < 768 ? .5 : 1;
  for (const { element, index: layerIndex, depth } of layers) {
    element.style.setProperty('--parallax-x', `${motion.matches ? 0 : layerOffset(left, width, layerIndex, depth * motionScale)}px`);
  }
  world?.setProgress(clamp(left / Math.max(1, width), 0, 3));
}
function queueRender() {
  if (!frame && !disposed) frame = requestAnimationFrame(render);
}
function goToChapter(index, immediate = false) {
  if (!CHAPTERS[index]) return;
  destination = index;
  const target = chapterScrollPosition(index, width);
  history.replaceState(null, '', `#${CHAPTERS[index].id}`);
  lenis.scrollTo(target, {
    immediate: immediate || motion.matches,
    duration: 1.25,
    force: true,
    onComplete: () => { destination = null; queueRender(); },
  });
  queueRender();
}

// Both wheel axes advance the same horizontal surface. Touch remains native.
lenis = new Lenis({
  wrapper: viewport, content: track, orientation: 'horizontal', gestureOrientation: 'both',
  smoothWheel: true, syncTouch: false, autoRaf: true, lerp: .075,
  anchors: false, overscroll: false,
  prevent: node => (node.classList?.contains('story-scene') || node.classList?.contains('copy-sheet')) && node.scrollHeight > node.clientHeight + 2,
});
listen(viewport, 'scroll', queueRender, { passive: true });
listen(viewport, 'wheel', () => { destination = null; }, { passive: true });
listen(viewport, 'touchstart', () => { destination = null; }, { passive: true });
links.forEach(link => {
  link.setAttribute('aria-controls', CHAPTERS[Number(link.dataset.chapterLink)].id);
  listen(link, 'click', event => {
    event.preventDefault();
    goToChapter(Number(link.dataset.chapterLink));
  });
});
arrows.forEach(arrow => listen(arrow, 'click', () => {
  goToChapter(clamp((destination ?? activeChapter) + Number(arrow.dataset.direction), 0, 3));
}));
listen(document, 'keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  const index = destination ?? activeChapter;
  const targets = { ArrowRight: Math.min(3, index + 1), ArrowLeft: Math.max(0, index - 1), Home: 0, End: 3 };
  if (!(event.key in targets)) return;
  event.preventDefault();
  goToChapter(targets[event.key]);
});
listen(window, 'hashchange', () => {
  const index = CHAPTERS.findIndex(chapter => chapter.id === location.hash.slice(1));
  if (index >= 0) goToChapter(index);
});
listen(motion, 'change', () => {
  if (motion.matches) lenis.scrollTo(viewport.scrollLeft, { immediate: true });
  queueRender();
});
const observer = new ResizeObserver(() => {
  const nextWidth = viewport.clientWidth;
  if (nextWidth !== width) {
    const index = destination ?? Math.max(0, activeChapter);
    width = nextWidth;
    lenis.resize();
    goToChapter(index, true);
  }
  queueRender();
});
observer.observe(viewport);
const initialIndex = CHAPTERS.findIndex(chapter => chapter.id === location.hash.slice(1));
if (initialIndex >= 0) goToChapter(initialIndex, true);
render();

if (import.meta.hot) import.meta.hot.dispose(() => {
  disposed = true;
  cancelAnimationFrame(frame);
  cleanups.forEach(cleanup => cleanup());
  observer.disconnect();
  lenis.destroy();
  world?.destroy();
  document.body.classList.remove("world-is-ready");
  scenes.forEach(scene => { scene.inert = false; scene.removeAttribute('aria-hidden'); });
});

// The illustrated fallback remains readable until the first real 3D frame paints.
import('./modules/farmWorld.js').then(async ({ initFarmWorld }) => {
  if (disposed) return;
  const instance = await initFarmWorld(document.querySelector('.world-stage'), {
    onReady() { if (!disposed) { document.body.classList.add('world-is-ready'); } },
    onUnavailable() { document.body.classList.remove('world-is-ready'); },
  });
  if (disposed) instance.destroy();
  else { world = instance; queueRender(); }
}).catch(error => {
  document.body.classList.remove('world-is-ready');
  console.warn('[Vegan Valley] Using the illustrated journey:', error.message);
});
