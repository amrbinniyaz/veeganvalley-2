import weeks from './data/meal-plans.json';
import {routineOptions,tasteOptions,timingOptions,recommendMeals,planEnquiry} from './lib/mealPlanner.js';

const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const animateIn=element=>{if(!reduced.matches)element.animate([{opacity:0,transform:'translateY(15px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});};
document.querySelector('[data-year]').textContent=new Date().getFullYear();
const header=document.querySelector('.site-header'), menuToggle=document.querySelector('.menu-toggle'), mobileMenu=document.querySelector('.mobile-menu');
function closeMenu(){menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Open menu');mobileMenu.hidden=true;header.classList.remove('menu-open');document.body.classList.remove('modal-open');}
menuToggle.addEventListener('click',()=>{if(menuToggle.getAttribute('aria-expanded')==='true'){closeMenu();return;}menuToggle.setAttribute('aria-expanded','true');menuToggle.setAttribute('aria-label','Close menu');mobileMenu.hidden=false;header.classList.add('menu-open');document.body.classList.add('modal-open');});
mobileMenu.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuToggle.getAttribute('aria-expanded')==='true'){closeMenu();menuToggle.focus();}});
window.matchMedia('(min-width:768px)').addEventListener('change',event=>{if(event.matches)closeMenu();});

// Browse the four-week rotation without implying calendar dates or a start date.
const menu=document.querySelector('#menu-browser');
let weekIndex=0,dayIndex=0,menuView='day';
const weekDescriptions=[
  'Colourful grains, fresh greens and the comfort of a well-made bowl.',
  'From Mediterranean lunches to slow, spice-filled suppers.',
  'A little culinary wander, from Japanese teriyaki to a Turkish feast.',
  'Familiar favourites, reimagined with a whole lot of plants.',
];
const sunIcon='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>';
const moonIcon='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 14.1A8.6 8.6 0 0 1 9.9 4a8.6 8.6 0 1 0 10.1 10.1Z"/></svg>';
const mealNoteArrow='<svg class="meal-note-arrow" viewBox="0 0 90 60" fill="none" aria-hidden="true"><path d="M76 3C81 27 50 49 12 45m0 0 14-11M12 45l14 8" /></svg>';
const nutritionHTML=meal=>`<div class="meal-nutrition-block"><span class="nutrition-caption">PER MEAL</span><dl class="meal-nutrition">${[['calories','Energy','kcal'],['protein','Protein','g'],['carbs','Carbs','g'],['fibre','Fibre','g'],['fat','Fat','g']].map(([key,label,unit])=>`<div><dt>${label}</dt><dd>${meal[key]}<small>${unit}</small></dd></div>`).join('')}</dl></div>`;
function mealCard(meal,time){return `<article class="menu-meal"><div class="meal-visual"><div class="menu-meal-top"><span class="meal-time">${time==='lunch'?sunIcon:moonIcon}${time==='lunch'?'Lunch':'Dinner'}</span><span class="meal-card-note">${time==='lunch'?'A moment for midday.':'Ease into the evening.'}${mealNoteArrow}</span></div><div class="meal-photo-stage"><img class="menu-meal-image" src="${meal.image}" alt="${escapeHtml(meal.name)}" width="423" height="231" /></div></div><div class="meal-card-copy"><h4>${escapeHtml(meal.name)}</h4>${nutritionHTML(meal)}</div></article>`;}

menu.innerHTML=`<div class="menu-toolbar"><span class="eyebrow">YOUR FOUR-WEEK ROTATION</span><div class="menu-view-switch" role="group" aria-label="Menu view"><button data-view="day" aria-pressed="true" aria-controls="selected-day">Day by day</button><button data-view="week" aria-pressed="false" aria-controls="selected-day">Whole week</button></div></div><div class="week-picker" role="tablist" aria-label="Choose a menu week">${weeks.map((week,index)=>`<button class="week-button" id="menu-week-${index}" role="tab" data-week="${index}" aria-selected="${index===0}" tabindex="${index===0?0:-1}" aria-controls="menu-week-panel"><span>Week</span><strong>${index+1}</strong><span class="week-selected-mark" aria-hidden="true">↗</span></button>`).join('')}</div><div id="menu-week-panel" role="tabpanel" aria-labelledby="menu-week-0"><div class="week-introduction"><div><span class="week-position">WEEK <span data-week-number>1</span> OF 4 · 12 MEALS</span><h3 id="week-title"></h3><p id="week-description"></p></div><div class="week-arrows"><button data-week-shift="-1" aria-label="Previous week">←</button><button data-week-shift="1" aria-label="Next week">→</button></div></div><div class="day-picker" role="group" aria-label="Choose a menu day">${weeks[0].days.map((day,index)=>`<button class="day-button" data-day="${index}" aria-label="${day.name}" aria-pressed="${index===0}" aria-controls="selected-day"><span class="day-name-full">${day.name}</span><span class="day-name-short" aria-hidden="true">${day.name.slice(0,3)}</span><i aria-hidden="true"></i></button>`).join('')}</div><div id="selected-day"></div></div><p class="sr-only" id="menu-status" role="status"></p>`;
const prefetchedWeeks=new Set();
function warmWeek(index){if(prefetchedWeeks.has(index))return;prefetchedWeeks.add(index);weeks[index].days.forEach(day=>['lunch','dinner'].forEach(time=>{const img=new Image();img.src=day[time].image;}));}
function overviewHTML(week){return `<div class="week-overview"><div class="week-overview-labels" aria-hidden="true"><span>Your week</span><span>Lunch</span><span>Dinner</span><span></span></div>${week.days.map((day,index)=>`<button class="week-overview-day" data-open-day="${index}" aria-label="View ${day.name}: ${escapeHtml(day.lunch.name)} for lunch and ${escapeHtml(day.dinner.name)} for dinner"><span class="overview-day-name">${day.name}<small>View the day</small></span>${['lunch','dinner'].map(time=>`<span class="overview-meal"><img src="${day[time].image}" alt="" width="58" height="58" /><span><small>${time==='lunch'?'Lunch':'Dinner'}</small><strong>${escapeHtml(day[time].name)}</strong><span class="overview-nutrition"><span>${day[time].calories} kcal</span><span>${day[time].protein}g protein</span><span>${day[time].carbs}g carbs</span><span>${day[time].fibre}g fibre</span><span>${day[time].fat}g fat</span></span></span></span>`).join('')}<span class="overview-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>`;}
let menuAnimations=[];
function renderDay(announce=false,direction=1){
  const week=weeks[weekIndex],day=week.days[dayIndex],target=document.querySelector('#selected-day');
  menuAnimations.forEach(animation=>animation.cancel());menuAnimations=[];
  document.querySelector('#week-title').textContent=week.title;
  document.querySelector('#week-description').textContent=weekDescriptions[weekIndex];
  menu.querySelector('[data-week-number]').textContent=week.number;
  menu.querySelector('#menu-week-panel').setAttribute('aria-labelledby',`menu-week-${weekIndex}`);
  menu.querySelector('[data-week-shift="-1"]').disabled=weekIndex===0;
  menu.querySelector('[data-week-shift="1"]').disabled=weekIndex===weeks.length-1;
  menu.querySelector('.day-picker').hidden=menuView==='week';
  target.innerHTML=menuView==='day'?`<div class="menu-day-heading"><h3>${day.name}</h3><span>Two fresh meals. One less thing to plan.</span></div><div class="meal-cards">${mealCard(day.lunch,'lunch')}${mealCard(day.dinner,'dinner')}</div><div class="menu-day-footer"><span>DAY ${dayIndex+1} OF 6</span><button data-next-day ${dayIndex===5?'disabled':''}>Next day <span aria-hidden="true">→</span></button></div>`:overviewHTML(week);
  menu.querySelectorAll('[data-week]').forEach(button=>{const selected=Number(button.dataset.week)===weekIndex;button.setAttribute('aria-selected',selected);button.tabIndex=selected?0:-1;});
  menu.querySelectorAll('[data-day]').forEach(button=>button.setAttribute('aria-pressed',Number(button.dataset.day)===dayIndex));
  menu.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.view===menuView));
  if(announce){document.querySelector('#menu-status').textContent=menuView==='week'?`Week ${week.number}, ${week.title}. All six days shown.`:`Week ${week.number}, ${day.name}. Lunch: ${day.lunch.name}. Dinner: ${day.dinner.name}.`;if(!reduced.matches){menuAnimations.push(target.animate([{opacity:0,transform:`translateX(${direction*12}px)`},{opacity:1,transform:'translateX(0)'}],{duration:360,easing:'cubic-bezier(.22,1,.36,1)'}));target.querySelectorAll('.menu-meal-image').forEach((image,index)=>menuAnimations.push(image.animate([{transform:`rotate(${direction*-5}deg) scale(.97)`},{transform:'rotate(0) scale(1)'}],{duration:650,delay:index*60,easing:'cubic-bezier(.22,1,.36,1)'})));}}
  warmWeek(weekIndex);
}
function selectWeek(index){const next=Math.max(0,Math.min(weeks.length-1,index));if(next===weekIndex)return;const direction=Math.sign(next-weekIndex);weekIndex=next;renderDay(true,direction);}
menu.addEventListener('click',event=>{
  const week=event.target.closest('[data-week]'),day=event.target.closest('[data-day]'),view=event.target.closest('[data-view]'),shift=event.target.closest('[data-week-shift]'),openDay=event.target.closest('[data-open-day]');
  if(week)selectWeek(Number(week.dataset.week));
  if(shift)selectWeek(weekIndex+Number(shift.dataset.weekShift));
  if(day){const next=Number(day.dataset.day);if(next!==dayIndex){const direction=Math.sign(next-dayIndex);dayIndex=next;renderDay(true,direction);}}
  if(view&&view.dataset.view!==menuView){menuView=view.dataset.view;renderDay(true);}
  if(openDay){dayIndex=Number(openDay.dataset.openDay);menuView='day';renderDay(true);menu.querySelector(`[data-day="${dayIndex}"]`).focus({preventScroll:true});menu.querySelector('.day-picker').scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});}
  if(event.target.closest('[data-next-day]')&&dayIndex<5){dayIndex++;renderDay(true);menu.querySelector(`[data-day="${dayIndex}"]`).focus({preventScroll:true});menu.querySelector('.day-picker').scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});}
});
menu.querySelector('.week-picker').addEventListener('keydown',event=>{let next=weekIndex;if(event.key==='ArrowRight')next=(weekIndex+1)%weeks.length;else if(event.key==='ArrowLeft')next=(weekIndex+weeks.length-1)%weeks.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=weeks.length-1;else return;event.preventDefault();selectWeek(next);menu.querySelector(`[data-week="${next}"]`).focus({preventScroll:true});});
menu.querySelectorAll('[data-week]').forEach(button=>{const warm=()=>warmWeek(Number(button.dataset.week));button.addEventListener('pointerenter',warm,{once:true});button.addEventListener('focus',warm,{once:true});});
renderDay();

// Preferences suggest meals from the real menu; the team confirms each enquiry.
const planner=document.querySelector('#planner');
const steps=[{key:'routine',eyebrow:'YOUR RHYTHM',title:'What does your day look like?',description:'Start with the pace of your everyday.',options:routineOptions},{key:'taste',eyebrow:'YOUR TASTE',title:'What sounds like your kind of food?',description:'Go with whatever makes you look forward to lunch.',options:tasteOptions},{key:'timing',eyebrow:'YOUR TABLE',title:'When can we take cooking off your plate?',description:'Choose the meal arrangement you’d like to discuss.',options:timingOptions}];
let step=0;const preferences={routine:null,taste:null,timing:null};let note='';
function focusPlanner(){const heading=planner.querySelector('h3');heading.focus({preventScroll:true});const rect=heading.getBoundingClientRect();if(rect.top<24||rect.bottom>innerHeight*.7)heading.scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});}
const choiceDrawings={
  desk:'M14 18h36v34H14z M14 28h36 M23 12v12 M41 12v12 M22 36h6 M36 36h6 M22 44h6 M36 44h6',
  active:'M12 24v16 M18 19v26 M18 32h28 M46 19v26 M52 24v16 M27 16l5-6 5 6',
  'on-the-go':'M15 23h34l4 30H11z M24 25v-8q8-12 16 0v8 M25 37q8-8 14 0-2 11-14 8z',
  unhurried:'M14 24h31v17q-1 12-15 12T14 41z M45 28q17-2 11 11-4 5-11 3 M10 57h41 M24 17q-6-5 0-11 M36 17q-6-5 0-11',
  bowls:'M8 32q24-10 48 0-5 24-24 24T8 32z M8 32q24 9 48 0 M22 28q-15-18-2-19 11 3 9 19 M32 27q-4-20 12-21 8 17-12 21 M25 56h15',
  comfort:'M14 27h36v19q-2 10-18 10T14 46z M9 27h47 M9 36H5 M54 36h5 M18 21q13-14 28 0 M32 14v-4 M24 6v-3 M43 12V6',
  explore:'M32 7a25 25 0 1 0 0 50 25 25 0 1 0 0-50 M7 32h50 M32 7q-22 25 0 50 22-25 0-50 M13 18q19 11 38 0 M13 46q19-11 38 0',
  both:'M9 35a12 12 0 1 1 24 0 M5 39h31 M20 16v-5 M8 22l-4-4 M34 22l4-4 M44 13q-9 26 14 27-9 15-22 3 M18 49h22 M24 56h10',
  lunch:'M32 18a14 14 0 1 0 0 28 14 14 0 1 0 0-28 M32 6v6 M32 52v6 M6 32h6 M52 32h6 M13 13l5 5 M46 46l5 5 M13 51l5-5 M46 18l5-5',
  dinner:'M39 8q-11 30 18 32A25 25 0 1 1 39 8z M48 12v8 M44 16h8 M56 25v5 M53 28h6'
};
const choiceArt=id=>`<svg class="plan-choice-art" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="${choiceDrawings[id]}"/></svg>`;
function renderStep(focus=false){const current=steps[step];planner.innerHTML=`<div class="plan-progress" aria-label="Step ${step+1} of 3">${steps.map((item,i)=>`<span class="${i<=step?'is-complete':''}"><b>${i<step?'✓':i+1}</b>${['Your rhythm','Your taste','Your table'][i]}</span>`).join('')}</div><div class="plan-question"><span class="eyebrow">0${step+1} / ${current.eyebrow}</span><h3 tabindex="-1">${current.title}</h3><p>${current.description}</p><div class="plan-options" data-choice-count="${current.options.length}" role="group" aria-label="${current.title}">${current.options.map(option=>`<button class="plan-option" data-option="${option.id}" aria-pressed="${preferences[current.key]===option.id}">${choiceArt(option.id)}<span class="plan-choice-copy"><strong>${option.title}</strong><small>${option.detail}</small></span><i aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"><path d="m3 8 3 3 7-7"/></svg></i></button>`).join('')}</div><div class="plan-controls">${step?'<button class="plan-back" data-back>← Go back</button>':'<span class="plan-selection-hint">Choose what feels like you.</span>'}<button class="pill-button" data-next ${preferences[current.key]?'':'disabled'}>${step===2?'See my starting point':'Continue'} <span aria-hidden="true">↗</span></button></div><p class="plan-footnote">A starting point based on your preferences. Our team will help with the final details.</p></div>`;if(focus){focusPlanner();animateIn(planner);}}
function renderResult(){const matches=recommendMeals(weeks,preferences),routine=routineOptions.find(o=>o.id===preferences.routine),taste=tasteOptions.find(o=>o.id===preferences.taste),timing=timingOptions.find(o=>o.id===preferences.timing);planner.innerHTML=`<div class="plan-result"><span class="eyebrow">YOUR LITTLE PLAN FOR GOOD</span><h3 tabindex="-1">A full plate.<br /><em>A little more you.</em></h3><p>A few ideas for your ${preferences.routine==='active'?'active':preferences.routine==='unhurried'?'unhurried':'busy'} days.</p><div class="plan-tags"><span>${routine.title}</span><span>${taste.title}</span><span>${timing.title}</span></div><div class="plan-total"><strong>${preferences.timing==='both'?48:24}</strong><span>${preferences.timing==='both'?'meals in the complete plan':'meals requested'}<br />4 weeks · Monday–Saturday</span></div><span class="eyebrow">A FEW FLAVOURS YOU MIGHT LOVE</span><div class="plan-matches">${matches.map(meal=>`<article class="plan-match"><img src="${meal.image}" alt="" width="72" height="72" /><div><h4>${escapeHtml(meal.name)}</h4><p>Week ${meal.week} · ${meal.day} ${meal.time} · ${meal.protein}g protein</p></div></article>`).join('')}</div><label for="plan-notes">Anything to add? <span>(optional)</span></label><textarea id="plan-notes" maxlength="1000" placeholder="Your delivery area or preferences you’d like to discuss…">${escapeHtml(note)}</textarea><a class="pill-button plan-whatsapp" id="plan-enquiry" target="_blank" rel="noopener noreferrer">Discuss my plan on WhatsApp <span aria-hidden="true">↗</span></a><p class="plan-footnote">These are sample menu matches. Our team will confirm meal availability, any adjustments, delivery and pricing. Your choices will be included in the WhatsApp message for you to review.</p><button class="plan-restart" data-edit>Edit my choices</button></div>`;updateEnquiry();focusPlanner();animateIn(planner);}
function updateEnquiry(){document.querySelector('#plan-enquiry').href=`https://wa.me/917736005800?text=${encodeURIComponent(planEnquiry(preferences,note))}`;}
planner.addEventListener('input',event=>{if(event.target.id==='plan-notes'){note=event.target.value;updateEnquiry();}});
planner.addEventListener('click',event=>{const option=event.target.closest('[data-option]');if(option){preferences[steps[step].key]=option.dataset.option;planner.querySelectorAll('[data-option]').forEach(button=>button.setAttribute('aria-pressed',button===option));planner.querySelector('[data-next]').disabled=false;}if(event.target.closest('[data-next]')&&preferences[steps[step].key]){if(step===2)renderResult();else{step++;renderStep(true);}}if(event.target.closest('[data-back]')){step--;renderStep(true);}if(event.target.closest('[data-edit]')){step=0;renderStep(true);}});
renderStep();

const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){animateIn(entry.target);revealObserver.unobserve(entry.target);}}),{threshold:.15});
document.querySelectorAll('[data-meal-reveal]').forEach(el=>revealObserver.observe(el));
const hero=document.querySelector('.meal-hero'),bowl=document.querySelector('.meal-bowl-wrap');let frame=0;
function moveBowl(){frame=0;if(reduced.matches){bowl.style.transform='';return;}const progress=Math.max(0,Math.min(1,-hero.getBoundingClientRect().top/hero.offsetHeight));bowl.style.transform=`translateY(${progress*38}px) rotate(${progress*13}deg)`;}
function onScroll(){if(!frame)frame=requestAnimationFrame(moveBowl);}
window.addEventListener('scroll',onScroll,{passive:true});reduced.addEventListener('change',moveBowl);
if(import.meta.hot)import.meta.hot.dispose(()=>{revealObserver.disconnect();window.removeEventListener('scroll',onScroll);cancelAnimationFrame(frame);});
