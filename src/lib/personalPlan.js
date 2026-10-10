// Personal meal plans: an estimated daily target from body stats, activity and goal,
// then a week built from real dishes whose nutrition is printed on our menus.
// Estimates are a guide only; portions are fixed, so targets are met by choosing
// which dishes and extras to add, and the team confirms everything on WhatsApp.

export const ACTIVITY = [
  { id: 'sitting', title: 'Mostly sitting.', detail: 'Desk days, little exercise.', factor: 1.2 },
  { id: 'light', title: 'Lightly active.', detail: 'Walks, or exercise 1–3 days a week.', factor: 1.375 },
  { id: 'active', title: 'Active.', detail: 'Exercise 3–5 days a week.', factor: 1.55 },
  { id: 'very', title: 'Very active.', detail: 'Hard training 6–7 days, or a physical job.', factor: 1.725 },
];
export const GOALS = [
  { id: 'lose', title: 'Lose weight.', detail: 'A gentle calorie deficit, with plenty of protein.', calories: 0.85, proteinPerKg: 1.4 },
  { id: 'muscle', title: 'Build muscle.', detail: 'A small surplus and more protein.', calories: 1.1, proteinPerKg: 1.8 },
  { id: 'balance', title: 'Stay balanced.', detail: 'Maintain your weight, eat well.', calories: 1, proteinPerKg: 1.2 },
  { id: 'energy', title: 'More energy.', detail: 'Steady fuel through busy days.', calories: 1, proteinPerKg: 1.3 },
];
export const SEXES = [
  { id: 'female', title: 'Female', offset: -161 },
  { id: 'male', title: 'Male', offset: 5 },
  { id: 'unspecified', title: 'Prefer not to say', offset: -78 },
];

// Commonly used lower limits for unsupervised calorie targets.
const FLOOR = { female: 1200, male: 1500, unspecified: 1200 };

export function validStats({ sex, age, height, weight }) {
  return Boolean(sex) && age >= 16 && age <= 90 && height >= 120 && height <= 220 && weight >= 35 && weight <= 250;
}

// Mifflin-St Jeor resting energy x activity, adjusted for the goal.
export function dailyTargets({ sex, age, height, weight, activity, goal }) {
  const s = SEXES.find(o => o.id === sex), a = ACTIVITY.find(o => o.id === activity), g = GOALS.find(o => o.id === goal);
  const resting = 10 * weight + 6.25 * height - 5 * age + s.offset;
  const raw = resting * a.factor * g.calories;
  const calories = Math.round(Math.max(raw, FLOOR[sex]) / 10) * 10;
  return { calories, protein: Math.round(weight * g.proteinPerKg), floored: raw < FLOOR[sex] };
}

const num = value => (typeof value === 'number' ? value : parseFloat(value) || 0);

// Extras that can top up a day: breakfasts, a cold-pressed juice and café snacks.
export function extrasFrom(menuItems, juices) {
  const withNutrition = menuItems.filter(item => item.nutrition);
  const pick = cats => withNutrition.filter(item => cats.includes(item.category)).map(item => ({
    id: item.id, name: item.name, image: item.image, price: item.price, calories: item.nutrition.calories, protein: item.nutrition.protein,
    label: item.category === 'appetisers' ? 'Snack' : item.category.startsWith('wraps') || item.category.startsWith('ciabattas') ? 'Extra meal' : undefined,
  }));
  return {
    breakfast: pick(['oat-meals', 'speciality-bowls', 'toasted-delights']),
    juice: juices.filter(j => j.nutrition).map(j => ({
      id: j.id, name: j.name, image: `/img/bottle-photos/${j.image}.webp`, price: j.price, calories: num(j.nutrition.calories), protein: num(j.nutrition.protein), isJuice: true,
    })),
    snack: pick(['appetisers', 'wraps-quesadillas', 'ciabattas-sandwiches']),
  };
}

// Fill each day towards the calorie target, one slot at a time, varying the choices.
export function buildWeek(week, targets, goal, extras) {
  const used = { breakfast: new Map(), juice: new Map(), snack: new Map() };
  const days = week.days.map(day => {
    const meals = [
      { slot: 'Lunch', ...day.lunch },
      { slot: 'Dinner', ...day.dinner },
    ];
    let calories = day.lunch.calories + day.dinner.calories, protein = day.lunch.protein + day.dinner.protein;
    for (const [slot, label, minGap] of [['breakfast', 'Breakfast', 220], ['juice', 'Cold-pressed juice', 90], ['snack', 'Snack', 170], ['snack', 'Snack', 400]]) {
      const gap = targets.calories - calories;
      if (gap < minGap) continue;
      const options = extras[slot].filter(item => item.calories <= gap + 60);
      if (!options.length) continue;
      const score = item => Math.abs(gap - item.calories) * (goal === 'lose' ? 1.2 : 1)
        - (goal === 'muscle' ? item.protein * 12 : 0)
        + (used[slot].get(item.id) || 0) * 450;
      const choice = options.reduce((best, item) => (score(item) < score(best) ? item : best));
      used[slot].set(choice.id, (used[slot].get(choice.id) || 0) + 1);
      meals.push({ ...choice, slot: choice.label || label });
      calories += choice.calories; protein += choice.protein;
    }
    const order = ['Breakfast', 'Lunch', 'Snack', 'Extra meal', 'Cold-pressed juice', 'Dinner'];
    meals.sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot));
    return { name: day.name, meals, calories: Math.round(calories), protein: Math.round(protein) };
  });
  const avg = key => Math.round(days.reduce((sum, d) => sum + d[key], 0) / days.length);
  return { days, calories: avg('calories'), protein: avg('protein') };
}

export function personalEnquiry({ stats, activity, goal, targets, plan, weekNumber, note }) {
  const title = (list, id) => list.find(o => o.id === id)?.title.replace(/\.$/, '') || '';
  const lines = plan.days.map(d => `${d.name}: ${d.meals.map(m => `${m.slot} – ${m.name}`).join('; ')} (~${d.calories} kcal, ${d.protein} g protein)`);
  return [
    "Hi Vegan Valley! I'd like a personalised meal plan for pickup.", '',
    `Goal: ${title(GOALS, goal)}`,
    `About me: ${title(SEXES, stats.sex)}, ${stats.age} yrs, ${stats.height} cm, ${stats.weight} kg · ${title(ACTIVITY, activity)}`,
    `Estimated target: ~${targets.calories} kcal and ~${targets.protein} g protein a day`, '',
    `Suggested week ${weekNumber}:`, ...lines,
    ...(note ? ['', `Notes: ${note}`] : []), '',
    'Please confirm availability, pickup, pricing and any adjustments to portions.',
  ].join('\n');
}

// A playful nudge for impossible numbers, a kind one for unusual but real ones,
// and a hint when someone has used the wrong unit. Returns null when the value is fine.
export function checkStat(field, value) {
  if (value === null || Number.isNaN(value)) return null;
  const fun = (emoji, title, text) => ({ tone: 'fun', emoji, title, text });
  const kind = text => ({ tone: 'kind', emoji: '💚', title: "Let's plan this together", text });
  if (field === 'age') {
    if (value <= 0) return fun('🐣', 'Not born yet?', "We'll keep a bowl warm for you. Try your real age.");
    if (value < 6) return fun('👶', 'Nice try, little one!', 'Impressive typing for a toddler. Try your real age.');
    if (value < 16) return kind('This planner is for ages 16 and up. Ask a grown-up to chat with us on WhatsApp.');
    if (value > 122) return fun('🧙', 'Wait, how old?', 'Older than the oldest person ever? Teach us your secret. (Try your real age!)');
    if (value > 90) return kind('For ages over 90, our team would love to plan with you personally on WhatsApp.');
  }
  if (field === 'height') {
    if (value > 0 && value < 2.6) return fun('📏', 'Metres, maybe?', `We need centimetres: ${value} m is about ${Math.round(value * 100)} cm.`);
    if (value >= 3 && value < 8.5) return fun('📏', 'Feet, maybe?', 'We need centimetres: 5 ft 6 in is about 168 cm.');
    if (value <= 50) return fun('🌱', "That's a seedling!", 'Not quite a person yet. Try your height in centimetres.');
    if (value > 272) return fun('🦒', 'Hello up there!', "Taller than the tallest human ever recorded? We'd need a bigger bowl. Try centimetres.");
    if (value < 120 || value > 220) return kind('Our planner works for 120–220 cm. If that is you, our team will plan with you personally on WhatsApp.');
  }
  if (field === 'weight') {
    if (value <= 5) return fun('🍉', 'Lighter than a watermelon?', 'Try your weight in kilograms.');
    if (value > 635) return fun('🚗', 'Heavier than a small car?', 'Our scales say no. Try kilograms.');
    if (value < 35 || value > 250) return kind('For this weight, our team will build your plan with you personally on WhatsApp.');
  }
  return null;
}
