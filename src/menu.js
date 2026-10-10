import { categories, items, menuCard, initOrder, CATEGORY_STYLE } from './modules/order.js';

const sectionsRoot = document.querySelector('[data-menu-sections]');
const chipsRoot = document.querySelector('[data-menu-chips]');
const searchInput = document.querySelector('#menu-search');
const emptyState = document.querySelector('[data-menu-empty]');
const status = document.querySelector('[data-menu-status]');
const filters = { protein: false, light: false };
document.querySelectorAll('[data-year]').forEach(node => { node.textContent = new Date().getFullYear(); });

// Build one section per menu category, in café menu order.
const GROUPS = { breakfast: 'Breakfast', snacks: 'Snacks', mains: 'Lunch & dinner', sweets: 'Something sweet', drinks: 'Drinks' };
// A hand-drawn arrow that curves down towards the cards below.
const ARROW = '<svg viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="M58 4C70 30 56 58 22 70M22 70l13 2M22 70l8-10" /></svg>';
const sections = categories.map((category, sectionIndex) => {
  const categoryItems = items.filter(item => item.category === category.id);
  const cards = categoryItems.map((item, i) => ({ item, node: menuCard(item, { index: i + 1 }) }));
  const words = category.title.split(' ');
  const section = document.createElement('section');
  section.className = 'menu-section';
  section.id = category.id;
  section.setAttribute('aria-labelledby', `${category.id}-title`);
  section.innerHTML = `<div class="section-topline"><span class="eyebrow"></span><span class="eyebrow menu-section-blurb"></span></div>
    <div class="menu-section-head"><h2 id="${category.id}-title"><span></span> <em></em></h2><div class="field-note menu-note" aria-hidden="true"><span></span>${ARROW}</div></div>
    <div class="menu-grid"></div>`;
  section.querySelector('.section-topline .eyebrow').textContent = `${String(sectionIndex + 1).padStart(2, '0')} / ${GROUPS[category.group]}`;
  section.querySelector('.menu-section-blurb').textContent = category.blurb;
  section.querySelector('h2 span').textContent = words.slice(0, -1).join(' ');
  section.querySelector('h2 em').textContent = `${words.at(-1).toLowerCase()}.`;
  section.querySelector('.menu-note span').textContent = CATEGORY_STYLE[category.id]?.note || '';
  section.querySelector('.menu-grid').append(...cards.map(card => card.node));
  sectionsRoot.append(section);
  const chip = document.createElement('a');
  chip.href = `#${category.id}`;
  chip.textContent = category.title;
  chipsRoot.append(chip);
  return { category, section, chip, cards };
});

// Search and filters hide non-matching cards, then any section left empty.
const normalise = text => text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
function applyFilters() {
  const query = normalise(searchInput.value.trim());
  let shown = 0;
  for (const { section, chip, cards } of sections) {
    let visible = 0;
    for (const { item, node } of cards) {
      const haystack = normalise([item.name, item.description, ...(item.ingredients || [])].join(' '));
      const n = item.nutrition;
      const ok = (!query || haystack.includes(query))
        && (!filters.protein || (n && n.protein >= 20))
        && (!filters.light || (n && n.calories < 400) || (!n && item.juiceNutrition && parseInt(item.juiceNutrition.calories, 10) < 400));
      node.hidden = !ok;
      if (ok) visible++;
    }
    section.hidden = visible === 0;
    chip.hidden = visible === 0;
    shown += visible;
  }
  emptyState.hidden = shown > 0;
  const active = query || filters.protein || filters.light;
  status.textContent = active ? `${shown} ${shown === 1 ? 'dish' : 'dishes'} found` : '';
}
searchInput.addEventListener('input', applyFilters);
document.querySelectorAll('[data-menu-filter]').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.menuFilter;
  filters[key] = !filters[key];
  button.setAttribute('aria-pressed', String(filters[key]));
  applyFilters();
}));

// Highlight the section in view and keep its chip visible in the scrolling bar.
let activeChip;
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const match = sections.find(s => s.section === entry.target);
    if (!match || match.chip === activeChip) continue;
    activeChip?.removeAttribute('aria-current');
    activeChip = match.chip;
    activeChip.setAttribute('aria-current', 'true');
    chipsRoot.scrollTo({ left: activeChip.offsetLeft - chipsRoot.clientWidth / 2 + activeChip.clientWidth / 2, behavior: 'smooth' });
  }
}, { rootMargin: '-35% 0px -60% 0px' });
sections.forEach(({ section }) => observer.observe(section));

const tools = document.querySelector('[data-menu-tools]');
new IntersectionObserver(([entry]) => tools.classList.toggle('is-stuck', entry.intersectionRatio < 1), { threshold: 1, rootMargin: '-1px 0px 0px 0px' }).observe(tools);

// Mobile navigation
const toggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
function setMenu(open) {
  mobileMenu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.querySelector('.site-header').classList.toggle('menu-open', open);
  document.body.classList.toggle('modal-open', open);
}
toggle.addEventListener('click', () => setMenu(mobileMenu.hidden));
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileMenu.hidden) { setMenu(false); toggle.focus(); } });

initOrder();
if (location.hash) requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView());
