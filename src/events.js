// World Vegan Day booking: pick seats per menu choice, then send the booking on WhatsApp.
const WHATSAPP_NUMBER = '917736005800';
const EVENT = { name: 'World Vegan Day Community Gathering 2.0', when: 'Sunday 1 Nov 2026, 9:00 am to 12:00 pm', where: 'The Social Cue, opp. Vegan Valley, South Beach', price: 1499, seats: 20, ends: new Date('2026-11-01T12:00:00+05:30') };
const rupees = value => `₹${value.toLocaleString('en-IN')}`;
document.querySelectorAll('[data-year]').forEach(node => { node.textContent = new Date().getFullYear(); });

// Mobile navigation
const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
function setMenu(open) {
  mobileMenu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  header.classList.toggle('menu-open', open);
  document.body.classList.toggle('modal-open', open);
}
toggle.addEventListener('click', () => setMenu(mobileMenu.hidden));
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileMenu.hidden) { setMenu(false); toggle.focus(); } });

// Hero extras: add-to-calendar links (Apple uses the .ics file) and a little countdown note.
const details = 'Brunch, games and great company with Vegan Valley. https://veganvalley.in/events/';
const calendar = new URLSearchParams({ action: 'TEMPLATE', text: EVENT.name, dates: '20261101T033000Z/20261101T063000Z', location: EVENT.where + ', Kozhikode', details });
const outlook = new URLSearchParams({ subject: EVENT.name, startdt: '2026-11-01T09:00:00+05:30', enddt: '2026-11-01T12:00:00+05:30', location: EVENT.where + ', Kozhikode', body: details });
document.querySelector('[data-calendar="google"]').href = `https://calendar.google.com/calendar/render?${calendar}`;
document.querySelector('[data-calendar="outlook"]').href = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&${outlook}`;
const calMenu = document.querySelector('.event-cal');
document.addEventListener('click', event => { if (calMenu.open && !calMenu.contains(event.target)) calMenu.open = false; });
calMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { calMenu.open = false; }));
const daysToGo = Math.ceil((new Date('2026-11-01T00:00:00+05:30') - Date.now()) / 86400000);
const countdown = document.querySelector('[data-countdown]');
if (daysToGo > 1) countdown.innerHTML = `only ${daysToGo} days<br />to go!`;
else if (daysToGo === 1) countdown.innerHTML = 'see you<br />tomorrow!';

// Once the event is over, swap the booking form for a thank-you note.
const form = document.querySelector('[data-event-form]');
if (Date.now() > EVENT.ends.getTime()) {
  form.hidden = true;
  document.querySelector('[data-event-over]').hidden = false;
  document.querySelectorAll('a[href="#book"]').forEach(link => { link.hidden = true; });
}

const counts = { A: 1, B: 0 };
function render() {
  const total = counts.A + counts.B;
  for (const choice of ['A', 'B']) {
    form.querySelector(`[data-count="${choice}"]`).textContent = counts[choice];
    form.querySelector(`[data-step="${choice}"][data-delta="-1"]`).disabled = counts[choice] === 0;
    form.querySelector(`[data-step="${choice}"][data-delta="1"]`).disabled = total >= EVENT.seats;
    document.querySelector(`.event-choice[data-choice="${choice}"]`).classList.toggle('is-picked', counts[choice] > 0);
  }
  form.querySelector('[data-seat-summary]').textContent = `${total} seat${total === 1 ? '' : 's'} × ${rupees(EVENT.price)}`;
  form.querySelector('[data-total]').textContent = rupees(total * EVENT.price);
  form.querySelector('.event-send').disabled = total === 0;
}
form.addEventListener('click', event => {
  const step = event.target.closest('[data-step]'); if (!step) return;
  const choice = step.dataset.step;
  counts[choice] = Math.max(0, counts[choice] + Number(step.dataset.delta));
  if (counts.A + counts.B > EVENT.seats) counts[choice] -= 1;
  render();
});
// "Choose A/B": a single seat switches to that menu, a group gets one more of it.
function choose(choice) {
  const other = choice === 'A' ? 'B' : 'A';
  if (counts.A + counts.B <= 1) { counts[choice] = 1; counts[other] = 0; }
  else if (counts.A + counts.B < EVENT.seats) counts[choice] += 1;
  render();
  document.querySelector('#book').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
document.querySelectorAll('[data-choose]').forEach(button => button.addEventListener('click', () => choose(button.dataset.choose)));

// Phones get a booking bar once the hero is out of view, hidden again at the form.
const sticky = document.querySelector('[data-event-sticky]');
const inView = new Map();
const stickyObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => inView.set(entry.target, entry.isIntersecting));
  sticky.hidden = form.hidden || [...inView.values()].some(Boolean);
});
stickyObserver.observe(document.querySelector('.event-hero'));
stickyObserver.observe(document.querySelector('#book'));

// A ready-made invite for friends.
const invite = `Come to World Vegan Day with me! Brunch, games and good company at The Social Cue, South Beach, Sunday 1 Nov, 9 am to 12 pm. Only 20 seats: https://veganvalley.in/events/`;
document.querySelector('[data-share]').href = `https://wa.me/?text=${encodeURIComponent(invite)}`;

form.addEventListener('submit', event => {
  event.preventDefault();
  const name = form.elements.name.value.trim(), note = form.elements.note.value.trim();
  if (!name) { form.elements.name.setAttribute('aria-invalid', 'true'); form.elements.name.focus(); return; }
  const total = counts.A + counts.B; if (!total) return;
  const message = [
    `Hi Vegan Valley! I'd like to book seats for ${EVENT.name}.`, '',
    `When: ${EVENT.when}`, `Where: ${EVENT.where}`, '',
    ...(counts.A ? [`Choice A × ${counts.A}`] : []), ...(counts.B ? [`Choice B × ${counts.B}`] : []),
    `Seats: ${total} × ${rupees(EVENT.price)} = ${rupees(total * EVENT.price)}`, '',
    `Name: ${name}`, ...(note ? [`Note: ${note}`] : []),
  ].join('\n');
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
  window.umami?.track('Event booking sent', { seats: total, choiceA: counts.A, choiceB: counts.B, value: total * EVENT.price });
  const thanks = form.querySelector('[data-event-thanks]');
  thanks.hidden = false;
  thanks.innerHTML = `Thank you, ${name.split(' ')[0].replace(/[&<>"']/g, '')}! Send the message in WhatsApp and we'll confirm your seats there. Didn't open? <a href="${url}" target="_blank" rel="noopener">Try again</a>.`;
});
form.elements.name.addEventListener('input', () => form.elements.name.removeAttribute('aria-invalid'));
render();
