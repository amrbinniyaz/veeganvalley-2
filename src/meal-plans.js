import weeks from './data/meal-plans.json';
import menuData from './data/menu.json';
import juiceData from './data/juices.json';
import {ACTIVITY,GOALS,SEXES,validStats,checkStat,dailyTargets,extrasFrom,buildWeek,personalEnquiry} from './lib/personalPlan.js';

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

// Personal plan: body stats, activity and goal give an estimated daily target,
// then a week is built from real dishes. Nothing is stored or sent until the
// visitor chooses to send their plan on WhatsApp.
const planner=document.querySelector('#planner');
const extras=extrasFrom(menuData.items,juiceData);
const state={stats:{sex:null,age:null,height:null,weight:null},activity:null,goal:null,week:0,day:0};let note='';
const option=(name,o)=>`<label class="plan-opt"><input class="sr-only" type="radio" name="${name}" value="${o.id}" /><span class="plan-dot" aria-hidden="true"></span><span><strong>${escapeHtml(o.title.replace(/\.$/,''))}</strong><small>${escapeHtml(o.detail)}</small></span></label>`;
planner.innerHTML=`<div class="plan-quiz">
  <div class="plan-quiz-head"><span class="eyebrow">YOUR PERSONAL PLAN</span><h3 tabindex="-1">Built around you.</h3></div>
  <fieldset class="plan-q" data-q="sex"><legend><span class="plan-q-num">1</span>About you</legend>
    <div class="plan-sex" role="radiogroup" aria-label="Sex">${SEXES.map(o=>`<label class="plan-chip"><input class="sr-only" type="radio" name="sex" value="${o.id}" /><span>${o.title}</span></label>`).join('')}</div>
  </fieldset>
  <fieldset class="plan-q" data-q="stats"><legend><span class="plan-q-num">2</span>Your numbers</legend>
    <div class="plan-about">
      <div class="plan-stats">
        <label class="plan-field"><span class="sr-only">Age in years</span><span class="plan-input"><input name="age" type="number" inputmode="numeric" min="16" max="90" placeholder="Age" /><em>yrs</em></span></label>
        <label class="plan-field"><span class="sr-only">Height in centimetres</span><span class="plan-input"><input name="height" type="number" inputmode="numeric" min="120" max="220" placeholder="Height" /><em>cm</em></span></label>
        <label class="plan-field"><span class="sr-only">Weight in kilograms</span><span class="plan-input"><input name="weight" type="number" inputmode="decimal" min="35" max="250" placeholder="Weight" /><em>kg</em></span></label>
      </div>
    </div>
  </fieldset>
  <fieldset class="plan-q" data-q="activity"><legend><span class="plan-q-num">3</span>How active are you?</legend><div class="plan-opts">${ACTIVITY.map(o=>option('activity',o)).join('')}</div></fieldset>
  <fieldset class="plan-q" data-q="goal"><legend><span class="plan-q-num">4</span>What's your goal?</legend><div class="plan-opts">${GOALS.map(o=>option('goal',o)).join('')}</div></fieldset>
  <p class="plan-privacy">Your details stay on this page. Nothing is saved or sent unless you send your plan.</p>
  <div class="plan-suggest" data-plan-suggest aria-live="polite"></div>
  <div class="plan-send">
    <textarea id="plan-notes" rows="2" aria-label="Anything to add (optional)" placeholder="Anything to add? Allergies, foods you avoid, pickup time… (optional)"></textarea>
    <a id="plan-enquiry" class="pill-button plan-whatsapp" href="#" target="_blank" rel="noopener noreferrer" aria-disabled="true">Send my plan on WhatsApp <span aria-hidden="true">↗</span></a>
    <p class="plan-send-hint" data-plan-hint>Complete the four steps to see and send your plan.</p>
    <p class="plan-disclaimer">Targets are estimates from a standard formula, not medical advice. If you're pregnant, under 18 or managing a health condition, check with your doctor first. We confirm your plan, pickup and pricing on WhatsApp.</p>
  </div>
</div>`;
let current=null;
function complete(){return validStats(state.stats)&&state.activity&&state.goal;}
function render(){
  const target=planner.querySelector('[data-plan-suggest]');
  if(!complete()){current=null;target.innerHTML='';updateEnquiry();return;}
  const targets=dailyTargets({...state.stats,activity:state.activity,goal:state.goal});
  const week=weeks[state.week];
  const plan=buildWeek(week,targets,state.goal,extras);
  current={targets,plan,weekNumber:week.number};
  const notes=[];
  if(targets.floored)notes.push(`We've kept your target at a safe minimum of ${targets.calories} kcal. For a stricter plan, please speak with a nutritionist.`);
  if(plan.calories>targets.calories+120)notes.push('Lunch and dinner alone are a little above your estimate. Our team can suggest lighter swaps.');
  else if(plan.calories<targets.calories-200)notes.push(`You'd still be about ${targets.calories-plan.calories} kcal short a day. Add plant protein to a breakfast (+₹99) or ask us about bigger portions.`);
  if(plan.protein<targets.protein-15)notes.push(`Protein lands around ${plan.protein} g of your ${targets.protein} g. The plant protein add-on (+₹99) helps close the gap.`);
  const day=plan.days[state.day];
  target.innerHTML=`<div class="plan-summary">
      <div class="plan-summary-main"><span class="eyebrow">YOUR DAILY TARGET</span><strong>${targets.calories.toLocaleString('en-IN')} <small>kcal</small> · ${targets.protein} <small>g protein</small></strong></div>
      <p>This plan averages <b>${plan.calories.toLocaleString('en-IN')} kcal</b> and <b>${plan.protein} g protein</b> a day.</p>
    </div>
    ${notes.length?`<ul class="plan-notes">${notes.map(n=>`<li>${escapeHtml(n)}</li>`).join('')}</ul>`:''}
    <div class="plan-picker">
      <div class="plan-weeks" role="group" aria-label="Week">${weeks.map((w,i)=>`<button type="button" data-plan-week="${i}" aria-pressed="${i===state.week}">Week ${w.number}</button>`).join('')}</div>
      <div class="plan-daytabs" role="group" aria-label="Day">${plan.days.map((d,i)=>`<button type="button" data-plan-day="${i}" aria-pressed="${i===state.day}">${d.name.slice(0,3)}</button>`).join('')}</div>
    </div>
    <div class="plan-dayview">
      <div class="plan-dayview-head"><h4>${day.name}</h4><span>${day.calories} kcal · ${day.protein} g protein</span></div>
      <ul>${day.meals.map(m=>`<li class="${m.isJuice?'is-bottle':''}"><img src="${m.image}" alt="" loading="lazy" /><span><small>${m.slot}</small>${escapeHtml(m.name)}</span><em>${m.calories} kcal</em></li>`).join('')}</ul>
    </div>`;
  updateEnquiry();
}
function updateEnquiry(){
  const link=planner.querySelector('#plan-enquiry'),ready=!!current;
  link.setAttribute('aria-disabled',String(!ready));
  link.href=ready?`https://wa.me/917736005800?text=${encodeURIComponent(personalEnquiry({stats:state.stats,activity:state.activity,goal:state.goal,...current,note}))}`:'#';
  planner.querySelector('[data-plan-hint]').hidden=ready;
}
// Wait until people pause or leave the field, so "1" on the way to 160 isn't judged.
// Impossible numbers get a playful pop-up; unusual but real ones get a kind one.
const statPopup=document.createElement('dialog');
statPopup.className='stat-popup';
statPopup.setAttribute('aria-labelledby','stat-popup-title');
statPopup.innerHTML=`<span class="stat-popup-emoji" aria-hidden="true"></span><h4 id="stat-popup-title"></h4><p></p><div class="stat-popup-actions"><button type="button" class="pill-button stat-popup-fix">Let me fix that</button><a class="text-link stat-popup-chat" href="https://wa.me/917736005800?text=Hi%20Vegan%20Valley%2C%20I%27d%20like%20help%20with%20a%20personalised%20meal%20plan." target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></div>`;
document.body.append(statPopup);
let statTimer,popupField=null,lastShown='';
function issue(){return ['age','height','weight'].map(field=>[field,checkStat(field,state.stats[field])]).find(([,r])=>r);}
function statMessage(now){
  clearTimeout(statTimer);
  const found=issue();
  planner.querySelectorAll('.plan-field').forEach(f=>f.classList.toggle('is-invalid',!!found&&f.querySelector('input').name===found[0]));
  if(!found){lastShown='';return;}
  const open=()=>{
    const [field,result]=issue()||[];
    if(!field)return;
    const key=`${field}:${state.stats[field]}`;
    if(key===lastShown||statPopup.open)return;
    lastShown=key;popupField=field;
    statPopup.dataset.tone=result.tone;
    statPopup.querySelector('.stat-popup-emoji').textContent=result.emoji;
    statPopup.querySelector('h4').textContent=result.title;
    statPopup.querySelector('p').textContent=result.text;
    statPopup.querySelector('.stat-popup-fix').textContent=result.tone==='fun'?'Let me fix that':'Edit my numbers';
    statPopup.querySelector('.stat-popup-chat').hidden=result.tone==='fun';
    statPopup.showModal();
    statPopup.querySelector('.stat-popup-fix').focus();
  };
  if(now)open();else statTimer=setTimeout(open,900);
}
statPopup.querySelector('.stat-popup-fix').addEventListener('click',()=>statPopup.close());
statPopup.addEventListener('click',event=>{if(event.target===statPopup)statPopup.close();});
statPopup.addEventListener('close',()=>{const input=planner.querySelector(`input[name="${popupField}"]`);input?.focus();input?.select();});
planner.addEventListener('focusout',event=>{if(['age','height','weight'].includes(event.target.name))statMessage(true);});
planner.addEventListener('change',event=>{
  const input=event.target;
  if(input.name==='sex')state.stats.sex=input.value;
  if(input.name==='activity')state.activity=input.value;
  if(input.name==='goal')state.goal=input.value;
  input.closest('fieldset')?.classList.remove('needs-answer');
  render();
});
planner.addEventListener('input',event=>{
  const input=event.target;
  if(['age','height','weight'].includes(input.name)){state.stats[input.name]=input.value===''?null:Number(input.value);statMessage(false);render();}
  if(input.id==='plan-notes'){note=input.value;updateEnquiry();}
});
planner.addEventListener('click',event=>{
  const weekButton=event.target.closest('[data-plan-week]');
  if(weekButton){state.week=Number(weekButton.dataset.planWeek);render();planner.querySelector(`[data-plan-week="${state.week}"]`).focus();return;}
  const dayButton=event.target.closest('[data-plan-day]');
  if(dayButton){state.day=Number(dayButton.dataset.planDay);render();planner.querySelector(`[data-plan-day="${state.day}"]`).focus();return;}
  const link=event.target.closest('#plan-enquiry');if(!link||link.getAttribute('aria-disabled')!=='true')return;
  event.preventDefault();
  const missing=!state.stats.sex?'sex':!validStats(state.stats)?'stats':!state.activity?'activity':'goal';
  const fieldset=planner.querySelector(`[data-q="${missing}"]`);
  fieldset.classList.remove('needs-answer');void fieldset.offsetWidth;fieldset.classList.add('needs-answer');
  fieldset.scrollIntoView({block:'center',behavior:reduced.matches?'instant':'smooth'});
  fieldset.querySelector('input').focus({preventScroll:true});
});
render();
const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){animateIn(entry.target);revealObserver.unobserve(entry.target);}}),{threshold:.15});
document.querySelectorAll('[data-meal-reveal]').forEach(el=>revealObserver.observe(el));
const hero=document.querySelector('.meal-hero'),bowl=document.querySelector('.meal-bowl-wrap');let frame=0;
function moveBowl(){frame=0;if(reduced.matches){bowl.style.transform='';return;}const progress=Math.max(0,Math.min(1,-hero.getBoundingClientRect().top/hero.offsetHeight));bowl.style.transform=`translateY(${progress*38}px) rotate(${progress*13}deg)`;}
function onScroll(){if(!frame)frame=requestAnimationFrame(moveBowl);}
window.addEventListener('scroll',onScroll,{passive:true});reduced.addEventListener('change',moveBowl);
if(import.meta.hot)import.meta.hot.dispose(()=>{revealObserver.disconnect();window.removeEventListener('scroll',onScroll);cancelAnimationFrame(frame);});
