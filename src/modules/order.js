import menu from '../data/menu.json';
import juices from '../data/juices.json';
import { icon } from '../lib/icon.js';

// One basket shared by every page. Orders are sent as an editable WhatsApp
// message for pickup or delivery; nothing is placed until the customer presses send.
export const WHATSAPP_NUMBER = '917736005800';
const INSTAGRAM_URL = 'https://www.instagram.com/veganvalley_official/';
const STORAGE_KEY = 'vv-order-v1';
const MAX_QTY = 20;
// Delivery: free within FREE_KM of the store, a flat fee up to MAX_KM, none beyond.
// Distances are straight-line from the store, so road distance is a little longer.
const STORE = { lat: 11.2448934, lng: 75.7738241 };
const FREE_KM = 5, MAX_KM = 10, DELIVERY_FEE = 50;
const rupees = value => `₹${value.toLocaleString('en-IN')}`;

const juiceItems = juices.map(juice => ({
  id: juice.id, category: 'juices', name: juice.name, price: juice.price, description: juice.description,
  image: `/img/bottle-photos/${juice.image}.webp`, volume: juice.volume, badge: juice.badge, ingredients: juice.ingredients,
  benefits: juice.benefits, juiceNutrition: juice.nutrition, isJuice: true,
  style: { bg: juice.cardBg, ink: juice.cardInk, word: juice.word, label: juice.label },
}));
export const categories = menu.categories;
// Card colour, faded background word and handwritten note for each menu section.
export const CATEGORY_STYLE = {
  'oat-meals': { bg: '#ecdcc4', ink: '#6b4a26', word: 'OATS', label: 'THE COSY ONE', note: 'slow mornings, sorted.' },
  'speciality-bowls': { bg: '#e8d2e2', ink: '#6a2f5c', word: 'BOWL', label: 'THE BRIGHT ONE', note: 'a whole bowl of happy.' },
  'toasted-delights': { bg: '#efd9b0', ink: '#7a5020', word: 'TOAST', label: 'THE CRUNCHY ONE', note: 'crunch first, then bliss.' },
  appetisers: { bg: '#f0d5a5', ink: '#7b4e1e', word: 'BITES', label: 'THE SHARING ONE', note: 'made for sharing (or not).' },
  'wraps-quesadillas': { bg: '#dfe5c4', ink: '#4b5d26', word: 'WRAP', label: 'THE ROLLED ONE', note: 'rolled with love.' },
  'ciabattas-sandwiches': { bg: '#e8d6c0', ink: '#6a4a2c', word: 'STACK', label: 'THE TOASTY ONE', note: 'warm and toasty.' },
  burgers: { bg: '#f1c9a5', ink: '#84431c', word: 'BURGER', label: 'THE BIG ONE', note: 'wedges on the side!' },
  pastas: { bg: '#f0cbbf', ink: '#8a3b2c', word: 'PASTA', label: 'THE COMFORT ONE', note: 'creamy, minus the dairy.' },
  'superfood-bowls': { bg: '#d8e2bd', ink: '#37562a', word: 'BOWL', label: 'THE HEARTY ONE', note: 'a full meal, promise.' },
  sushi: { bg: '#cfdcd8', ink: '#2f4f48', word: 'ROLL', label: 'THE CLEAN ONE', note: 'no fish, all flavour.' },
  treats: { bg: '#e6cfc4', ink: '#5e3424', word: 'SWEET', label: 'THE SWEET ONE', note: 'go on, treat yourself.' },
  juices: { bg: '#d8e2bd', ink: '#37562a', word: 'JUICE', label: 'COLD-PRESSED', note: 'shake well, sip happy.' },
  elixirs: { bg: '#f1c6c2', ink: '#952f3a', word: 'CHILL', label: 'THE ICED ONE', note: 'ice, ice, lovely.' },
  teas: { bg: '#dce6cd', ink: '#476445', word: 'TEA', label: 'THE WARM ONE', note: 'a warm little pause.' },
};
// Each dish's own faded word, like the juices' GREEN, GOLDEN and BEET.
const DISH_WORDS = {
  'coconut-date-cloud': 'CLOUD',
  'mocha-overnight-oats': 'MOCHA',
  'apple-cinnamon': 'APPLE',
  'choco-mond-oatmeal': 'CHOCO',
  'super-blue-chia-pudding': 'CHIA',
  'strawberry-overnight-oats': 'BERRY',
  'acai-bowl': 'AÇAÍ',
  'pitaya-bowl': 'PITAYA',
  'cosmic-blue-bowl': 'COSMIC',
  'pb-cloud': 'PB',
  'creamy-dreamy-avo-toast': 'AVO',
  'chocolate-peanut-butter-toast': 'NUTTY',
  'apple-broccoli-toast': 'CRISP',
  'wild-mushroom-toast': 'WILD',
  'golden-shroom-strips': 'SHROOM',
  'vegan-cheese-balls': 'CHEESY',
  'verde-sunset-tacos': 'TACO',
  'smash-pops': 'SMASH',
  'crunchy-saigon': 'SAIGON',
  'no-yolker-wrap': 'BHURJI',
  'maple-tofu-quesadilla': 'MAPLE',
  'fungi-and-fire-wrap': 'FIRE',
  'all-plant-falafel-roll': 'FALAFEL',
  'rainbow-rice-wraps': 'RAINBOW',
  'bbq-tofu': 'SMOKY',
  'tofu-delight-sandwich': 'SUNNY',
  'pesto-tempeh': 'PESTO',
  'forest-gold-burger': 'FOREST',
  'no-bull-burger': 'NO BULL',
  'the-golden-stack': 'STACK',
  'arrabbiata-classica': 'FIERY',
  'garden-pesto-pasta': 'GARDEN',
  'foothill-farfalle-pasta': 'CREAMY',
  'mushroom-bolognese': 'RAGÙ',
  'buddha-bowl': 'BUDDHA',
  'earth-and-grain-bowl': 'EARTH',
  'the-coastal-bowl': 'COAST',
  'mexican-midnight-bowl': 'MIDNIGHT',
  'harissa-tofu-bowl': 'HARISSA',
  'red-rice-and-miso-glazed-bowl': 'MISO',
  'butter-tofu-and-coconut-rice-bowl': 'BUTTER',
  'thai-red-coconut-curry-bowl-with-brown-rice': 'THAI',
  'golden-tide-roll': 'TIDE',
  'ocean-free-horizon': 'OCEAN',
  'root-and-reef-roll': 'REEF',
  'granola-bites': 'BITES',
  'midnight-brownie': 'FUDGE',
  'caramel-eclipse-cake': 'CARAMEL',
  'chocolate-bliss-cookie': 'COOKIE',
  'fruit-tart': 'TART',
  'walnut-pie': 'WALNUT',
  'ruby-hibiscus-chill': 'RUBY',
  'crisp-lemon-chill': 'LEMON',
  'peach-nectar-chill': 'PEACH',
  'mint': 'MINT',
  'rose': 'ROSE',
  'jasmine': 'JASMINE',
  'ginger-and-tulsi': 'TULSI',
  'hibiscus-ritual': 'RITUAL',
};
export const wordFor = item => item.style?.word || DISH_WORDS[item.id] || CATEGORY_STYLE[item.category]?.word || '';
export const styleFor = item => item.style || CATEGORY_STYLE[item.category] || CATEGORY_STYLE['superfood-bowls'];
export const items = [...menu.items.filter(item => item.category !== 'juices'), ...juiceItems]
  .sort((a, b) => categories.findIndex(c => c.id === a.category) - categories.findIndex(c => c.id === b.category));
const itemById = new Map(items.map(item => [item.id, item]));
const categoryById = new Map(categories.map(category => [category.id, category]));
export const getItem = id => itemById.get(id);
export const getCategory = id => categoryById.get(id);
export { rupees };

let lines = load();
const listeners = new Set();
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(line => itemById.has(line.id) && line.qty > 0) : [];
  } catch { return []; }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); } catch { /* The basket still works for this visit. */ }
  listeners.forEach(listener => listener(lines));
}
export const subscribe = listener => { listeners.add(listener); listener(lines); return () => listeners.delete(listener); };
const lineUnitPrice = line => getItem(line.id).price + line.extras.reduce((sum, extra) => sum + extra.price, 0);
export const totals = () => lines.reduce((acc, line) => ({ count: acc.count + line.qty, amount: acc.amount + lineUnitPrice(line) * line.qty }), { count: 0, amount: 0 });

export function addToOrder(id, { qty = 1, extras = [], options = [], action } = {}) {
  const item = getItem(id); if (!item) return;
  const key = [id, ...extras.map(e => e.name).sort(), ...[...options].sort()].join('|');
  const existing = lines.find(line => line.key === key);
  if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty);
  else lines.push({ key, id, qty, extras, options });
  save();
  announce(`Added ${qty > 1 ? `${qty} × ` : ''}${item.name}`, action);
  return key;
}
function setLineQty(key, qty) {
  const line = lines.find(l => l.key === key); if (!line) return;
  if (qty <= 0) lines = lines.filter(l => l !== line); else line.qty = Math.min(MAX_QTY, qty);
  save();
}
const quantityInOrder = id => lines.filter(line => line.id === id).reduce((sum, line) => sum + line.qty, 0);

function distanceKm(a, b) {
  const rad = d => d * Math.PI / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
// Fee for a known distance: 0, DELIVERY_FEE, or null when out of range.
export const deliveryFee = km => km <= FREE_KM ? 0 : km <= MAX_KM ? DELIVERY_FEE : null;

export function whatsappMessage({ name, pickup, note, mode = 'pickup', address = '', landmark = '' }, place = null) {
  const delivery = mode === 'delivery';
  const fee = delivery && place ? deliveryFee(place.km) : 0;
  const rows = lines.map(line => {
    const item = getItem(line.id);
    const details = [...line.extras.map(e => `+ ${e.name}`), ...line.options].join(', ');
    return `${line.qty} × ${item.name}${item.volume ? ` (${item.volume})` : ''}${details ? ` [${details}]` : ''} — ${rupees(lineUnitPrice(line) * line.qty)}`;
  });
  const amount = totals().amount;
  if (!delivery) return [
    "Hi Vegan Valley! I'd like to place a pickup order:", '', ...rows, '',
    `Total: ${rupees(amount)}`, `Name: ${name}`, `Pickup: ${pickup}`, ...(note ? [`Note: ${note}`] : []),
  ].join('\n');
  const km = place ? `${place.km.toFixed(1)} km` : '';
  return [
    "Hi Vegan Valley! I'd like to place a delivery order:", '', ...rows, '',
    `Items: ${rupees(amount)}`,
    place ? `Delivery: ${fee ? rupees(fee) : 'Free'} (${km})` : `Delivery: to be confirmed (free within ${FREE_KM} km, ${rupees(DELIVERY_FEE)} up to ${MAX_KM} km)`,
    `Total: ${rupees(amount + fee)}${place ? '' : ' + delivery'}`, '',
    `Name: ${name}`, `Delivery: ${pickup}`, `Address: ${address}`, ...(landmark ? [`Landmark: ${landmark}`] : []),
    ...(place ? [`Location: https://maps.google.com/?q=${place.lat.toFixed(6)},${place.lng.toFixed(6)}`] : []),
    ...(note ? [`Note: ${note}`] : []),
  ].join('\n');
}

// ---------- Interface ----------
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  node.append(...children.flat().filter(child => child != null && child !== false));
  return node;
};
function nutritionLine(item) {
  const n = item.nutrition;
  if (n) return `${n.calories} kcal · ${n.protein} g protein`;
  if (item.juiceNutrition) return `${item.juiceNutrition.calories} · ${item.volume}`;
  // Dishes without nutrition on the menu show their section instead.
  return item.volume || item.serving || getCategory(item.category)?.title || '';
}
const modalEvent = open => window.dispatchEvent(new CustomEvent('vv-modal', { detail: { open } }));

// Menu cards reuse the homepage product-card design: coloured card, faded word,
// big tilted photo and a Discover arrow, with price and Add underneath.
export function menuCard(item, { index } = {}) {
  const style = styleFor(item);
  const count = el('span', { class: 'menu-card-count', 'aria-hidden': 'true' });
  const meta = nutritionLine(item);
  const card = el('article', { class: `product-card menu-product${item.isJuice ? ' is-bottle' : ' is-dish'}`, 'data-item': item.id, style: `--card-bg:${style.bg};--card-ink:${style.ink}` },
    el('button', { class: 'product-image-button', type: 'button', 'aria-label': `Discover ${item.name}, ${rupees(item.price)}`, onclick: () => openItem(item.id) },
      el('span', { class: 'card-category eyebrow', text: (item.badge || style.label).toUpperCase() }),
      index && el('span', { class: 'card-index', text: String(index).padStart(2, '0') }),
      el('span', { class: 'product-word', 'aria-hidden': 'true', text: wordFor(item), style: `--len:${Math.max(4, wordFor(item).length)}` }),
      el('img', { src: item.image, alt: '', loading: 'lazy', width: item.width || 180, height: item.height || 520 }),
      el('span', { class: 'product-discover' }, 'Discover ', el('span', {}, icon('arrow-up-right')))),
    el('div', { class: 'product-caption' },
      el('div', {}, el('h3', { text: item.name }), meta && el('p', { class: 'menu-product-meta', text: meta })),
      el('div', { class: 'product-buy' },
        el('span', { class: 'product-price', text: rupees(item.price) }),
        el('button', { class: 'product-add', type: 'button', 'aria-label': `Add ${item.name} to order`, onclick: () => quickAdd(item.id) },
          el('span', { 'aria-hidden': 'true', text: '+' }), ' Add', count))));
  const update = () => { const n = quantityInOrder(item.id); count.textContent = n || ''; card.classList.toggle('is-in-order', n > 0); };
  subscribe(update);
  return card;
}
// "+ Add" always adds straight away. Dishes with optional extras get a
// "Customise" button on the confirmation, which swaps the plain dish for the
// customised one, so nothing is counted twice.
function quickAdd(id) {
  const category = getCategory(getItem(id).category);
  const customisable = category?.addOns?.length || category?.options?.length;
  let key;
  key = addToOrder(id, customisable ? { action: { label: 'Customise', run: () => openItem(id, { replaceKey: key }) } } : {});
}

let ui;
function buildUI() {
  if (ui) return ui;
  const live = el('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
  const toast = el('div', { class: 'order-toast', 'aria-hidden': 'true' });
  const barCount = el('span', { class: 'order-bar-count' });
  const barTotal = el('span', { class: 'order-bar-total' });
  const bar = el('button', { class: 'order-bar', type: 'button', hidden: true, onclick: () => openOrder() },
    el('span', { class: 'order-bar-summary' }, barCount, barTotal), el('span', { class: 'order-bar-cta' }, 'Review order ', icon('arrow-right')));

  // Item sheet
  const sheet = el('dialog', { class: 'vv-sheet item-sheet', 'aria-labelledby': 'item-sheet-title', 'data-lenis-prevent': true });
  // Order review sheet
  const orderSheet = el('dialog', { class: 'vv-sheet order-sheet', 'aria-labelledby': 'order-sheet-title', 'data-lenis-prevent': true });
  for (const dialog of [sheet, orderSheet]) {
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); modalEvent(false); if (dialog === orderSheet) sent = null; });
  }
  document.body.append(bar, toast, live, sheet, orderSheet);
  ui = { bar, barCount, barTotal, sheet, orderSheet, live, toast };
  subscribe(() => {
    const { count, amount } = totals();
    bar.hidden = count === 0;
    barCount.textContent = `${count} item${count === 1 ? '' : 's'}`;
    barTotal.textContent = rupees(amount);
    document.body.classList.toggle('has-order', count > 0);
    document.querySelectorAll('[data-order-count]').forEach(node => { node.textContent = count; node.hidden = count === 0; });
    if (orderSheet.open) renderOrder();
  });
  return ui;
}
let toastTimer;
function announce(message, action) {
  const { live, toast } = buildUI();
  live.textContent = action ? `${message}. ${action.label} is available.` : message;
  const hide = () => toast.classList.remove('is-visible');
  toast.replaceChildren(icon('check'), ` ${message}`);
  if (action) toast.append(el('button', { class: 'order-toast-action', type: 'button', onclick: () => { hide(); action.run(); } }, action.label));
  toast.classList.toggle('has-action', Boolean(action));
  if (action) toast.removeAttribute('aria-hidden'); else toast.setAttribute('aria-hidden', 'true');
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hide, action ? 5000 : 2200);
}
function showModal(dialog) {
  if (!dialog.open) { dialog.showModal(); document.body.classList.add('modal-open'); modalEvent(true); }
  dialog.scrollTop = 0;
}
const closeButton = dialog => el('button', { class: 'vv-sheet-close', type: 'button', 'aria-label': 'Close', onclick: () => dialog.close() }, icon('x'));
function stepper(value, onChange, label) {
  const output = el('output', { 'aria-live': 'polite', text: value });
  const minus = el('button', { type: 'button', 'aria-label': `One fewer ${label}`, onclick: () => onChange(-1) }, '−');
  const plus = el('button', { type: 'button', 'aria-label': `One more ${label}`, onclick: () => onChange(1) }, '+');
  return { node: el('div', { class: 'vv-stepper', role: 'group', 'aria-label': `Quantity of ${label}` }, minus, output, plus), output, minus, plus };
}

export function openItem(id, { replaceKey } = {}) {
  const item = getItem(id); if (!item) return;
  const { sheet } = buildUI();
  const category = getCategory(item.category);
  const chosen = new Set(); const chosenOptions = new Set();
  // Opened on a dish already in the basket, the sheet edits that plain line's
  // quantity (down to 0 to remove it). Choosing extras starts a new line.
  const plainLine = () => !replaceKey && lines.find(l => l.key === id);
  const editing = () => Boolean(plainLine()) && chosen.size === 0 && chosenOptions.size === 0;
  let qty = plainLine()?.qty || 1, wasEditing = editing();
  const addButton = el('button', { class: 'pill-button item-sheet-add', type: 'button' });
  const inOrderNote = el('p', { class: 'item-sheet-in-order' });
  const qtyControl = stepper(qty, delta => { qty = Math.max(editing() ? 0 : 1, Math.min(MAX_QTY, qty + delta)); refresh(); }, item.name);
  function refresh() {
    const isEditing = editing();
    if (isEditing !== wasEditing) { qty = isEditing ? plainLine().qty : 1; wasEditing = isEditing; }
    const extras = category?.addOns?.filter(a => chosen.has(a.name)) || [];
    const unit = item.price + extras.reduce((s, e) => s + e.price, 0);
    const inOrder = quantityInOrder(id);
    inOrderNote.hidden = inOrder === 0;
    inOrderNote.textContent = `${inOrder} already in your order`;
    qtyControl.output.textContent = qty; qtyControl.minus.disabled = qty === (isEditing ? 0 : 1);
    const label = !isEditing ? `Add to order · ${rupees(unit * qty)}` : qty === 0 ? 'Remove from order' : `Update order · ${rupees(unit * qty)}`;
    addButton.replaceChildren(el('span', { text: label }), isEditing ? icon('check') : el('span', { 'aria-hidden': 'true', text: '+' }));
  }
  addButton.addEventListener('click', () => {
    if (editing()) {
      setLineQty(id, qty);
      announce(qty === 0 ? `Removed ${item.name}` : `${qty} × ${item.name} in your order`);
      sheet.close();
      return;
    }
    const replaced = replaceKey && lines.find(l => l.key === replaceKey);
    if (replaced) setLineQty(replaceKey, replaced.qty - 1);
    addToOrder(id, { qty, extras: category?.addOns?.filter(a => chosen.has(a.name)) || [], options: [...chosenOptions] });
    sheet.close();
  });
  const n = item.nutrition, jn = item.juiceNutrition;
  const facts = n ? [['Calories', `${n.calories} kcal`], ['Protein', `${n.protein} g`], ['Carbs', `${n.carbs} g`], ['Fibre', `${n.fibre} g`], ['Fat', `${n.fat} g`]]
    : jn ? [['Calories', jn.calories], ['Protein', jn.protein], ['Carbs', jn.carbs], ['Vitamin C', jn.vitaminC], ['Calcium', jn.calcium]] : [];
  const checkbox = (name, label, set) => el('label', { class: 'item-choice' },
    el('input', { type: 'checkbox', onchange: event => { event.target.checked ? set.add(name) : set.delete(name); refresh(); } }), el('span', { text: label }));
  sheet.replaceChildren(closeButton(sheet),
    el('div', { class: `item-sheet-media${item.isJuice ? ' is-bottle' : ''}`, style: `--card-bg:${styleFor(item).bg};--card-ink:${styleFor(item).ink}` },
      el('span', { class: 'product-word', 'aria-hidden': 'true', text: wordFor(item), style: `--len:${Math.max(4, wordFor(item).length)}` }),
      el('img', { src: item.image, alt: item.name, width: item.width || 200, height: item.height || 400 })),
    el('div', { class: 'item-sheet-body' },
      el('span', { class: 'eyebrow', text: category?.title }),
      el('h2', { id: 'item-sheet-title', text: item.name }),
      el('p', { class: 'item-sheet-price', text: rupees(item.price) + (item.volume ? ` · ${item.volume}` : '') + (item.serving ? ` · ${item.serving}` : '') }),
      el('p', { class: 'item-sheet-desc', text: item.description }),
      item.ingredients && el('div', { class: 'item-sheet-block' }, el('h3', { text: "What's inside" }), el('ul', { class: 'item-tags' }, item.ingredients.map(t => el('li', { text: t })))),
      item.benefits && el('div', { class: 'item-sheet-block' }, el('h3', { text: 'Health benefits' }), el('ul', { class: 'item-tags item-tags--soft' }, item.benefits.map(t => el('li', { text: t })))),
      facts.length > 0 && el('div', { class: 'item-sheet-block' }, el('h3', { text: 'Nutrition' }), el('dl', { class: 'item-facts' }, facts.map(([k, v]) => el('div', {}, el('dt', { text: k }), el('dd', { text: v }))))),
      category?.addOns?.length > 0 && el('fieldset', { class: 'item-sheet-block item-choices' }, el('legend', { text: 'Add extras' }), category.addOns.map(a => checkbox(a.name, `${a.name} +${rupees(a.price)}`, chosen))),
      category?.options?.length > 0 && el('fieldset', { class: 'item-sheet-block item-choices' }, el('legend', { text: 'Options' }), category.options.map(o => checkbox(o, o, chosenOptions))),
      el('div', { class: 'item-sheet-actions' }, inOrderNote, qtyControl.node, addButton)));
  refresh();
  showModal(sheet);
}

const PICKUP_TIMES = ['As soon as possible', 'In about 30 minutes', 'In about 1 hour', "Later today (I'll say when)"];
let form = { name: '', pickup: PICKUP_TIMES[0], note: '', mode: 'pickup', address: '', landmark: '' };
// The customer's shared location for this visit only: { lat, lng, km }.
let place = null, locating = false, locateError = '';
function useMyLocation() {
  if (!navigator.geolocation) { locateError = 'Location is not available on this device. Please type your address.'; renderOrder(); return; }
  locating = true; locateError = ''; renderOrder();
  navigator.geolocation.getCurrentPosition(position => {
    const point = { lat: position.coords.latitude, lng: position.coords.longitude };
    place = { ...point, km: distanceKm(STORE, point) };
    locating = false; renderOrder();
  }, () => {
    locating = false; locateError = "We couldn't get your location. Please type your address and we'll confirm the distance on WhatsApp."; renderOrder();
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
}
// The last order sent, shown as a thank-you until the sheet is closed.
let sent = null;
try { form = { ...form, ...JSON.parse(localStorage.getItem(`${STORAGE_KEY}-details`) || '{}') }; } catch { /* Defaults are fine. */ }
function renderOrder() {
  const { orderSheet } = buildUI();
  const { count, amount } = totals();
  const list = lines.map(line => {
    const item = getItem(line.id);
    const control = stepper(line.qty, delta => setLineQty(line.key, line.qty + delta), item.name);
    const details = [...line.extras.map(e => `+ ${e.name}`), ...line.options].join(' · ');
    return el('li', { class: 'order-line' },
      el('img', { src: item.image, alt: '', width: 56, height: 56, class: item.isJuice ? 'is-bottle' : '' }),
      el('div', { class: 'order-line-info' }, el('strong', { text: item.name }), details && el('small', { text: details }), el('span', { text: rupees(lineUnitPrice(line) * line.qty) })),
      control.node);
  });
  const field = (label, input, hint) => el('label', { class: 'order-field' }, el('span', { text: label }), input, hint && el('small', { text: hint }));
  const delivery = form.mode === 'delivery';
  // Keep typed details in `form` so re-rendering (quantity, location) never loses them.
  const synced = (input, key) => { input.addEventListener('input', () => { form[key] = input.value; input.removeAttribute('aria-invalid'); }); return input; };
  const nameInput = synced(el('input', { type: 'text', name: 'name', autocomplete: 'name', required: true, value: form.name, placeholder: 'So we know whose order it is' }), 'name');
  const pickupSelect = el('select', { name: 'pickup', onchange: event => { form.pickup = event.target.value; } }, PICKUP_TIMES.map(t => el('option', { value: t, selected: t === form.pickup, text: t })));
  const noteInput = synced(el('textarea', { name: 'note', rows: 2, placeholder: 'Allergies, less spicy, cutlery…' }), 'note'); noteInput.value = form.note;
  const addressInput = synced(el('textarea', { name: 'address', rows: 2, autocomplete: 'street-address', placeholder: 'House / flat, street, area' }), 'address'); addressInput.value = form.address;
  const landmarkInput = synced(el('input', { type: 'text', name: 'landmark', value: form.landmark, placeholder: 'Near…' }), 'landmark');
  const modeOption = (value, label, hint) => el('label', { class: `order-mode-option${form.mode === value ? ' is-active' : ''}` },
    el('input', { type: 'radio', name: 'mode', value, checked: form.mode === value, onchange: () => { form.mode = value; renderOrder(); } }),
    el('strong', { text: label }), el('small', { text: hint }));
  const fee = delivery && place ? deliveryFee(place.km) : 0;
  const outOfRange = delivery && place && fee === null;
  const placeStatus = !place ? null
    : outOfRange ? el('p', { class: 'order-place is-out', role: 'status', text: `You're about ${place.km.toFixed(1)} km away. Sorry, we only deliver within ${MAX_KM} km. You can still choose pickup.` })
    : el('p', { class: 'order-place', role: 'status', text: `About ${place.km.toFixed(1)} km away · ${fee ? `Delivery ${rupees(fee)}` : 'Free delivery'}` });
  const deliveryBlock = delivery && el('div', { class: 'order-delivery' },
    el('button', { class: 'order-locate', type: 'button', disabled: locating, onclick: useMyLocation }, icon('map-pin'), locating ? ' Finding you…' : place ? ' Update my location' : ' Use my location'),
    placeStatus, locateError && el('p', { class: 'order-place is-out', role: 'status', text: locateError }),
    field('Delivery address', addressInput), field('Landmark (optional)', landmarkInput),
    el('p', { class: 'order-small', text: `Free delivery within ${FREE_KM} km, ${rupees(DELIVERY_FEE)} up to ${MAX_KM} km. Sharing your location lets us check the distance and pin your door.` }));
  const totalRow = delivery
    ? el('div', { class: 'order-total' }, el('span', { text: place ? `Total incl. delivery · ${count} item${count === 1 ? '' : 's'}` : 'Total · delivery added once we know the distance' }), el('strong', { text: rupees(amount + (fee || 0)) }))
    : el('div', { class: 'order-total' }, el('span', { text: `Total · ${count} item${count === 1 ? '' : 's'}` }), el('strong', { text: rupees(amount) }));
  const sendButton = el('button', { class: 'pill-button order-send', type: 'submit', disabled: outOfRange }, el('span', { text: 'Send order on WhatsApp' }), el('span', {}, icon('arrow-up-right')));
  const formNode = el('form', { class: 'order-form', novalidate: true, onsubmit: event => {
    event.preventDefault();
    form = { ...form, name: nameInput.value.trim(), pickup: pickupSelect.value, note: noteInput.value.trim(), address: addressInput.value.trim(), landmark: landmarkInput.value.trim() };
    try { localStorage.setItem(`${STORAGE_KEY}-details`, JSON.stringify(form)); } catch { /* Not essential. */ }
    if (!form.name) { nameInput.setAttribute('aria-invalid', 'true'); nameInput.focus(); return; }
    if (delivery && !form.address) { addressInput.setAttribute('aria-invalid', 'true'); addressInput.focus(); return; }
    if (outOfRange) return;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage(form, delivery ? place : null))}`;
    window.open(url, '_blank', 'noopener');
    sent = { name: form.name, url, mode: form.mode };
    lines = [];
    save();
  } },
    el('fieldset', { class: 'order-mode' }, el('legend', { class: 'sr-only', text: 'Pickup or delivery' }),
      modeOption('pickup', 'Pickup', 'Collect from the café'), modeOption('delivery', 'Delivery', `Free within ${FREE_KM} km`)),
    deliveryBlock, totalRow,
    field('Your name', nameInput), field(delivery ? 'Delivery time' : 'Pickup time', pickupSelect), field('Anything we should know? (optional)', noteInput),
    sendButton, el('p', { class: 'order-small', text: `This opens WhatsApp with your order written out. Nothing is placed until you press send there, and we will confirm your ${delivery ? 'delivery' : 'pickup'} time.` }));
  if (sent && count === 0) {
    orderSheet.replaceChildren(closeButton(orderSheet),
      el('div', { class: 'order-sheet-body order-thanks' },
        el('span', { class: 'eyebrow', text: sent.mode === 'delivery' ? 'DELIVERY ORDER' : 'PICKUP ORDER' }),
        el('h2', { id: 'order-sheet-title', text: `Thank you${sent.name ? `, ${sent.name.split(' ')[0]}` : ''}!` }),
        el('p', { text: `Your order has been placed on WhatsApp. We will confirm your ${sent.mode === 'delivery' ? 'delivery' : 'pickup'} time there.` }),
        el('a', { class: 'order-insta', href: INSTAGRAM_URL, target: '_blank', rel: 'noopener noreferrer' }, icon('instagram'), el('span', {}, 'Enjoying it? Tag us ', el('b', { text: '@veganvalley_official' }))),
        el('a', { class: 'pill-button', href: '/menu/' }, 'Order something else ', el('span', {}, icon('arrow-up-right'))),
        el('p', { class: 'order-small' }, "WhatsApp didn't open? ", el('a', { href: sent.url, target: '_blank', rel: 'noopener', text: 'Send the order again' }))));
    return;
  }
  orderSheet.replaceChildren(closeButton(orderSheet),
    el('div', { class: 'order-sheet-body' },
      el('span', { class: 'eyebrow', text: 'PICKUP OR DELIVERY' }),
      el('h2', { id: 'order-sheet-title', text: 'Your order' }),
      count === 0
        ? el('div', { class: 'order-empty' }, el('p', { text: 'Nothing here yet.' }), el('a', { class: 'pill-button', href: '/menu/' }, 'Browse the menu ', el('span', {}, icon('arrow-up-right'))))
        : [el('ul', { class: 'order-lines' }, list),
          formNode,
          el('button', { class: 'order-clear', type: 'button', onclick: () => { lines = []; save(); } }, 'Clear order')]));
}
export function openOrder() {
  const { orderSheet } = buildUI();
  renderOrder();
  showModal(orderSheet);
}

export function initOrder() {
  buildUI();
  document.querySelectorAll('[data-order-open]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); openOrder(); }));
  window.addEventListener('storage', event => { if (event.key === STORAGE_KEY) { lines = load(); save(); } });
}
