export const routineOptions = [
  {id:'desk', title:'Full calendar, full plate.', detail:'Workdays that could use one less decision.'},
  {id:'active', title:'Always in motion.', detail:'An active routine, with an eye on plant protein.'},
  {id:'on-the-go', title:'Here, there, everywhere.', detail:'Busy days and a love of easy-to-enjoy meals.'},
  {id:'unhurried', title:'A little more unhurried.', detail:'Comforting food worth making time for.'},
];
export const tasteOptions = [
  {id:'bowls', title:'Big, colourful bowls.', detail:'Grains, greens and plenty of good things.'},
  {id:'comfort', title:'A little comfort.', detail:'Curries, stews, pasta and familiar favourites.'},
  {id:'explore', title:'Take my taste buds travelling.', detail:'New flavours from across the four-week menu.'},
];
export const timingOptions = [
  {id:'both', title:'Lunch & dinner.', detail:'The complete plan: 48 meals across four weeks.'},
  {id:'lunch', title:'Just my lunches.', detail:'Ask our team about a lunch-only arrangement.'},
  {id:'dinner', title:'Dinner, sorted.', detail:'Ask our team about a dinner-only arrangement.'},
];
export function recommendMeals(weeks, preferences) {
  const meals=weeks.flatMap(week=>week.days.flatMap(day=>['lunch','dinner'].filter(time=>preferences.timing==='both'||time===preferences.timing).map(time=>({...day[time],week:week.number,day:day.name,time}))));
  const score=meal=>{
    let value=0;const name=meal.name.toLowerCase();
    if(preferences.routine==='active')value+=(meal.protein-30)*2;
    if(preferences.routine==='on-the-go'&&/wrap|ciabatta|shawarma|rolls/.test(name))value+=12;
    if(preferences.routine==='desk'&&/bowl|salad/.test(name))value+=4;
    if(preferences.routine==='unhurried'&&/curry|stew|tagine|pasta|bolognese/.test(name))value+=7;
    if(preferences.taste==='bowls'&&/bowl|salad/.test(name))value+=10;
    if(preferences.taste==='comfort'&&/curry|stew|tagine|pasta|bolognese|mash|dal|butter/.test(name))value+=10;
    if(preferences.taste==='explore')value+=meal.week===3?12:0;
    return value;
  };
  return meals.map((meal,index)=>({meal,index,score:score(meal)})).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,3).map(item=>item.meal);
}
export function planEnquiry(preferences, note='') {
  const find=(options,id)=>options.find(option=>option.id===id)?.title||'';
  return `Hi Vegan Valley! I'd like to enquire about a personalised meal plan.\n\nMy routine: ${find(routineOptions,preferences.routine)}\nMy taste: ${find(tasteOptions,preferences.taste)}\nMeals: ${find(timingOptions,preferences.timing)}\nDuration: 4 weeks, 6 days a week.\n${note.trim()?`\nMy notes: ${note.trim()}\n`:''}\nPlease confirm availability, delivery, pricing and any possible menu adjustments.`;
}
