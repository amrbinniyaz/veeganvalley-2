// Café opening hours (Asia/Kolkata), as listed on Google. Days run Sunday = 0.
const HOURS = {
  0: [['10:30', '22:30']],
  1: [],
  2: [['10:30', '21:30']],
  3: [['10:30', '21:30']],
  4: [['10:30', '21:30']],
  5: [['10:30', '12:30'], ['13:30', '22:30']],
  6: [['10:30', '22:30']],
};
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const minutes = time => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
function clock(time) {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
}

// Day and minute of the day in Kozhikode, whatever the visitor's own time zone.
function nowInKozhikode(date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(part => [part.type, part.value]));
  return { day: WEEKDAY[parts.weekday], minute: Number(parts.hour) * 60 + Number(parts.minute) };
}

// { open, text }: "Open now · until 9:30 pm", "Back at 1:30 pm",
// "Closed · opens tomorrow at 10:30 am", "Closed · opens Tuesday at 10:30 am".
export function cafeStatus(date = new Date()) {
  const { day, minute } = nowInKozhikode(date);
  const today = HOURS[day];
  const current = today.find(([open, close]) => minute >= minutes(open) && minute < minutes(close));
  if (current) return { open: true, text: `Open now · until ${clock(current[1])}` };
  const later = today.find(([open]) => minute < minutes(open));
  if (later) return { open: false, text: today.some(([, close]) => minute >= minutes(close)) ? `Back at ${clock(later[0])}` : `Closed · opens at ${clock(later[0])}` };
  for (let offset = 1; offset <= 7; offset++) {
    const next = (day + offset) % 7;
    if (HOURS[next].length) {
      return { open: false, text: `Closed · opens ${offset === 1 ? 'tomorrow' : DAYS[next]} at ${clock(HOURS[next][0][0])}` };
    }
  }
  return { open: false, text: 'Closed' };
}
