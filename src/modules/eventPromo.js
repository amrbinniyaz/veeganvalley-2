// A one-time homepage card for the next event. It waits for the intro to finish,
// shows once per visitor, and switches itself off when the event is over.
const PROMO = {
  key: 'vv-promo-world-vegan-day-2026',
  ends: new Date('2026-11-01T12:00:00+05:30'),
  href: '/events/',
};

const seen = () => { try { return localStorage.getItem(PROMO.key) === '1'; } catch { return false; } };
export const markEventPromoSeen = () => { try { localStorage.setItem(PROMO.key, '1'); } catch { /* Not essential. */ } };

function whenIntroDone(callback) {
  const root = document.documentElement;
  if (!root.classList.contains('home-intro-pending')) { callback(); return; }
  const observer = new MutationObserver(() => {
    if (root.classList.contains('home-intro-pending')) return;
    observer.disconnect();
    callback();
  });
  observer.observe(root, { attributes: true, attributeFilter: ['class'] });
}

export function showEventPromo() {
  if (Date.now() > PROMO.ends.getTime() || seen()) return;
  whenIntroDone(() => setTimeout(open, 2500));
}

function open() {
  const card = document.createElement('aside');
  card.className = 'event-promo';
  card.setAttribute('aria-labelledby', 'event-promo-title');
  card.innerHTML = `
    <img class="event-promo-doodle" src="/img/events/community-doodle.webp" alt="" width="1600" height="600" />
    <button class="event-promo-close" type="button" aria-label="Close"><svg class="icon" aria-hidden="true"><use href="/icons.svg#x"/></svg></button>
    <span class="event-promo-eyebrow">World Vegan Day · Sun 1 Nov</span>
    <h2 id="event-promo-title">A vegan morning, <em>together.</em></h2>
    <p>Brunch, games and good company at The Social Cue. Only 20 seats.</p>
    <div class="event-promo-actions">
      <a class="event-promo-cta" href="${PROMO.href}" data-umami-event="Home event promo" data-umami-event-action="open">Grab a seat <svg class="icon" aria-hidden="true"><use href="/icons.svg#arrow-up-right"/></svg></a>
      <button class="event-promo-later" type="button">Maybe later</button>
    </div>`;
  document.body.append(card);
  markEventPromoSeen();
  requestAnimationFrame(() => card.classList.add('is-open'));

  const close = () => {
    window.umami?.track('Home event promo', { action: 'dismiss' });
    card.classList.remove('is-open');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => card.remove(), 400);
  };
  const onKey = event => { if (event.key === 'Escape') close(); };
  card.querySelector('.event-promo-close').addEventListener('click', close);
  card.querySelector('.event-promo-later').addEventListener('click', close);
  document.addEventListener('keydown', onKey);
}
