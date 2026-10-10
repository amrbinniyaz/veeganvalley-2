import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import juices from './data/juices.json';
import { initOrder, openItem, addToOrder, menuCard, getItem, items as menuItems } from './modules/order.js';
import { startHomeIntro } from './modules/homeIntro.js';
import { createHomeEntrance } from './modules/homeEntrance.js';

gsap.registerPlugin(ScrollTrigger);

const products = Object.fromEntries(juices.map(juice => [juice.id, {...juice, color: juice.cardBg}]));
const bowls = {
  acai: {name:'Acai bowl', title:'Berry good beginnings.', category:'Your morning, brighter.', description:'Thick, cold acai. Crunchy granola. Toasted coconut and a generous handful of fresh berries. Get your spoon in.', image:'acai-bowl', alt:'Acai bowl with granola, toasted coconut and fresh berries'},
  oats: {name:'Oat meal', title:'Take the slow morning.', category:'A little comfort, a lot of colour.', description:'Whole-grain oats, cooked slow and creamy. Finished with mango, strawberry, kiwi and chia. A colourful start to your day.', image:'oat-meal', alt:'Creamy oatmeal with mango, strawberry, kiwi and chia'},
  vegan: {name:'Vegan bowl', title:'Lunch, in full colour.', category:'Make room for plants.', description:'Brown rice, edamame, avocado and crisp peppers, dressed and stacked. A whole bowl of plant-based goodness.', image:'vegan-bowl', alt:'Vegan bowl with brown rice, edamame, avocado and peppers'},
};
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const cleanups = [];
let lenis, bottle, homeIntro, homeEntrance, entranceProgress = 1, selectedFlavour = 'green-house', currentProgress = 0, disposed = false;
let resolveHeroBottle;
const heroBottleReady = new Promise(resolve => { resolveHeroBottle = resolve; });
const listen = (target, type, handler, options) => { target.addEventListener(type, handler, options); cleanups.push(() => target.removeEventListener(type, handler, options)); };
document.querySelector('[data-year]').textContent = new Date().getFullYear();

// Use a single clock for smooth scrolling and scroll-triggered animation.
const animateScroll = time => lenis?.raf(time * 1000);
function configureScroll() {
  lenis?.destroy();
  lenis = undefined;
  gsap.ticker.remove(animateScroll);
  if (!reducedMotion.matches) {
    lenis = new Lenis({duration:1.05, smoothWheel:true, syncTouch:false, anchors:true});
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(animateScroll);
    if (homeIntro?.active) lenis.stop();
  }
}
configureScroll();
homeEntrance = createHomeEntrance({ onBottleProgress: value => { entranceProgress = value; bottle?.setEntrance?.(value); } });
homeIntro = startHomeIntro({ ready: heroBottleReady, onReveal: options => homeEntrance.reveal(options), onUnlock: () => {
  if (disposed) return;
  lenis?.start();
  requestAnimationFrame(() => { if (!disposed) { ScrollTrigger.refresh(); lenis?.resize(); } });
} });
if (homeIntro.active) lenis?.stop();
listen(reducedMotion, 'change', configureScroll);
const media = gsap.matchMedia();
media.add({desktop:'(min-width: 768px)', mobile:'(max-width: 767px)', reduce:'(prefers-reduced-motion: reduce)'}, context => {
  if (context.conditions.reduce) return;
  if (context.conditions.desktop && !document.querySelector('.journey--short')) {
    const timeline = gsap.timeline({scrollTrigger:{trigger:'.journey',start:'top top',end:'bottom bottom',scrub:.65,invalidateOnRefresh:true,onUpdate:self=>{currentProgress=self.progress;bottle?.setProgress(currentProgress);}}});
    timeline.to('.hero-panel',{autoAlpha:0,y:-65,duration:.30,ease:'power1.inOut'},0)
      .to('.bottle-view',{xPercent:-32,scale:.89,duration:.65,ease:'power2.inOut'},.06)
      .to('.hero-orbit',{xPercent:-30,scale:1.14,duration:1,ease:'none'},0)
      .fromTo('.story-panel',{autoAlpha:0,y:55},{autoAlpha:1,y:0,duration:.35,ease:'power2.out'},.40)
      .from('.story-ingredients li',{y:18,opacity:0,stagger:.035,duration:.15},.54)
      .to('.chapter-track b',{scaleX:1,duration:1,ease:'none'},0);
  } else {
    ScrollTrigger.create({trigger:document.querySelector('.journey--short')?'.journey':'.hero-panel',start:'top top',end:'bottom top',onUpdate:self=>{currentProgress=self.progress*.6;bottle?.setProgress(currentProgress);}});
  }
  for (const heading of document.querySelectorAll('[data-reveal]')) {
    gsap.from(heading,{y:45,opacity:.15,duration:1,ease:'power3.out',scrollTrigger:{trigger:heading,start:'top 92%',once:true}});
  }
  if (document.querySelector('.bowl-art img')) gsap.fromTo('.bowl-art img',{rotation:-9,y:35},{rotation:6,y:-20,ease:'none',scrollTrigger:{trigger:'.bowls',start:'top bottom',end:'bottom top',scrub:1}});
  for (const study of document.querySelectorAll('[data-pencil-reveal]')) {
    gsap.fromTo(study, {clipPath: 'inset(100% 0 0 0)'}, {clipPath: 'inset(0% 0 0 0)', duration: 1.6, ease: 'power1.inOut', scrollTrigger: {trigger: study, start: 'top 92%', once: true}});
  }
  return () => { currentProgress = 0; bottle?.setProgress(0); };
});

// Keep the feature, its label, and its ingredient story in sync.
function selectFlavour(name) {
  if (!products[name] || name === selectedFlavour) return;
  selectedFlavour = name;
  const botanical = document.querySelector('[data-botanical-flavour]');
  if (botanical) botanical.dataset.botanicalFlavour = name === 'green-house' ? 'greens' : 'roots';
  const product = products[name];
  document.querySelector('[data-hero-name]').textContent = product.name;
  document.querySelector('.hero-product-link').dataset.product = name;
  document.querySelector('.hero-product>.eyebrow').textContent = product.eyebrow;
  document.querySelector('.bottle-fallback').src = `/img/bottles/${name}.webp`;
  document.querySelector('.bottle-view').setAttribute('aria-label',`${product.name} cold-pressed juice bottle`);
  const storyLabel = document.querySelector('.story-ingredients>.eyebrow');
  if (storyLabel) storyLabel.textContent = `Inside ${product.name}`;
  document.querySelector('.story-ingredients ul')?.replaceChildren(...product.ingredients.map((ingredient, i) => {
    const item = document.createElement('li');
    const text = document.createElement('span'); text.textContent = ingredient;
    const number = document.createElement('span'); number.textContent = String(i+1).padStart(2,'0');
    item.append(text,number); return item;
  }));
  document.querySelectorAll('[data-flavour]').forEach(button => {
    const active = button.dataset.flavour === name;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  bottle?.setFlavour(name, { animate: true });
}
for (const button of document.querySelectorAll('[data-flavour]')) listen(button,'click',()=>selectFlavour(button.dataset.flavour));

// Product details and ordering use the shared order sheets (src/modules/order.js).
initOrder();
for (const button of document.querySelectorAll('[data-product]')) listen(button,'click',()=>openItem(button.dataset.product));
for (const button of document.querySelectorAll('[data-add]')) listen(button,'click',()=>addToOrder(button.dataset.add));
listen(window,'vv-modal',event=>{if(event.detail.open)lenis?.stop();else if(!homeIntro?.active)lenis?.start();});
const picks = document.querySelector('[data-picks]');
if (picks) picks.replaceChildren(...picks.dataset.picks.split(',').map(getItem).filter(Boolean).map((item,i)=>menuCard(item,{index:i+1})));
for (const tile of document.querySelectorAll('[data-mood]')) {
  const ids = tile.dataset.mood.split(',');
  const count = menuItems.filter(item=>ids.includes(item.category)).length;
  tile.querySelector('.mood-count').textContent = `${count} ${count===1?'item':'items'}`;
}

const filters = [...document.querySelectorAll('[data-filter]')];
for (const button of filters) listen(button,'click',()=>{
  const filter = button.dataset.filter; let count=0;
  for (const filterButton of filters) {const active=filterButton===button;filterButton.classList.toggle('is-active',active);filterButton.setAttribute('aria-pressed',String(active));}
  for (const card of document.querySelectorAll('.product-card')) {card.hidden=filter!=='all'&&card.dataset.category!==filter;if(!card.hidden)count++;}
  document.querySelector('.filter-status').textContent=`Showing ${count} ${filter==='all'?'drinks':filter+' drinks'}`;
  ScrollTrigger.refresh();
  lenis?.resize();
});

const tabs = [...document.querySelectorAll('[data-bowl]')];
let bowlRequest = 0;
async function selectBowl(button) {
  const choice = bowls[button.dataset.bowl];
  const requestId = ++bowlRequest;
  for (const tab of tabs) {const active=tab===button;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
  document.querySelector('#bowl-panel').setAttribute('aria-labelledby',button.id);
  document.querySelector('[data-bowl-category]').textContent=choice.category;
  document.querySelector('[data-bowl-title]').textContent=choice.title;
  document.querySelector('[data-bowl-description]').textContent=choice.description;
  const img = document.querySelector('[data-bowl-image]');
  const nextImage = new Image(); nextImage.src=`/img/bowls/${choice.image}.webp`;
  try { await nextImage.decode(); } catch { /* The img element still exposes failure accessibly. */ }
  if(requestId!==bowlRequest||disposed)return;
  img.src=nextImage.src;img.alt=choice.alt;
  if(!reducedMotion.matches)gsap.fromTo(img,{opacity:.35,scale:.96},{opacity:1,scale:1,duration:.55,ease:'power2.out',overwrite:'auto'});
  ScrollTrigger.refresh();
}
for(const button of tabs){
  listen(button,'click',()=>selectBowl(button));
  listen(button,'keydown',event=>{let index=tabs.indexOf(button);if(event.key==='ArrowRight')index=(index+1)%tabs.length;else if(event.key==='ArrowLeft')index=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=tabs.length-1;else return;event.preventDefault();tabs[index].focus();selectBowl(tabs[index]);});
}

const menuToggle=document.querySelector('.menu-toggle');
const menu=document.querySelector('.mobile-menu');
function closeMenu(restoreFocus=false){menu.hidden=true;menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Open menu');document.querySelector('.site-header').classList.remove('menu-open');document.body.classList.remove('modal-open');lenis?.start();if(restoreFocus)menuToggle.focus();}
listen(menuToggle,'click',()=>{if(!menu.hidden){closeMenu();return;}menu.hidden=false;menuToggle.setAttribute('aria-expanded','true');menuToggle.setAttribute('aria-label','Close menu');document.querySelector('.site-header').classList.add('menu-open');document.body.classList.add('modal-open');lenis?.stop();menu.querySelector('a').focus();});
for(const link of menu.querySelectorAll('a'))listen(link,'click',()=>closeMenu());
listen(document,'keydown',event=>{
  if(menu.hidden)return;
  if(event.key==='Escape'){event.preventDefault();closeMenu(true);}
  if(event.key==='Tab'){
    const elements=[menuToggle,...menu.querySelectorAll('a')];const first=elements[0],last=elements.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});
const desktopQuery=window.matchMedia('(min-width:768px)');
listen(desktopQuery,'change',()=>{if(desktopQuery.matches&&!menu.hidden)closeMenu();});

const video=document.querySelector('.process-film video');
const filmControl=document.querySelector('.film-control');
let userPaused=false, filmVisible=false;
function updateVideoControl(){filmControl.setAttribute('aria-label',video.paused?'Play our process film':'Pause our process film');filmControl.querySelector('span').textContent=video.paused?'▶':'Ⅱ';}
listen(filmControl,'click',async()=>{if(video.paused){userPaused=false;try{await video.play();}catch{updateVideoControl();}}else{userPaused=true;video.pause();}});
listen(video,'play',updateVideoControl);listen(video,'pause',updateVideoControl);
const filmObserver=new IntersectionObserver(async([entry])=>{filmVisible=entry.isIntersecting;if(!filmVisible){video.pause();}else if(!userPaused&&!reducedMotion.matches&&!document.hidden){try{await video.play();}catch{updateVideoControl();}}},{threshold:.25});
filmObserver.observe(video);
listen(document,'visibilitychange',()=>{if(document.hidden)video.pause();else if(filmVisible&&!userPaused&&!reducedMotion.matches)video.play().catch(()=>{});});
listen(reducedMotion,'change',()=>{if(reducedMotion.matches)video.pause();});
for(const details of document.querySelectorAll('details'))listen(details,'toggle',()=>{ScrollTrigger.refresh();lenis?.resize();});

// Load the 3D engine separately, so it never blocks the page or its controls.
import('./modules/bottle3d.js').then(async({initBottle3D})=>{
  if(disposed)return;
  const instance=await initBottle3D(document.querySelector('.bottle-view'), { initialEntrance: entranceProgress });
  if(disposed){instance.destroy();return;}
  bottle=instance;
  bottle.setEntrance?.(entranceProgress);
  bottle.setProgress(currentProgress);
  if(selectedFlavour!=='green-house')bottle.setFlavour(selectedFlavour);
}).catch(error=>console.warn('[Vegan Valley] Using product photograph:',error.message)).finally(() => resolveHeroBottle());
document.fonts.ready.then(()=>{if(!disposed){ScrollTrigger.refresh();lenis?.resize();}});

if(import.meta.hot)import.meta.hot.dispose(()=>{
  disposed=true;bowlRequest++;
  homeIntro?.destroy();
  homeEntrance?.destroy();
  cleanups.forEach(cleanup=>cleanup());
  media.revert();gsap.ticker.remove(animateScroll);lenis?.destroy();bottle?.destroy();filmObserver.disconnect();video.pause();
  document.body.classList.remove('modal-open');
});
