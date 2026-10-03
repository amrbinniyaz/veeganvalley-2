import './main.js';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
// Reuse the original homepage, its 3D scene, and its single smooth-scroll instance.
const media=gsap.matchMedia();
media.add('(prefers-reduced-motion: no-preference)',()=>{
  const timeline=gsap.timeline({scrollTrigger:{trigger:'.valley-arch',start:'top top',end:'bottom bottom',scrub:1,invalidateOnRefresh:true}});
  timeline.to('.valley-arch-heading',{y:-65,autoAlpha:0,duration:.23},0)
    .to('.valley-arch-aside,.valley-arch-scroll,.valley-arch-outline',{autoAlpha:0,duration:.2},.04)
    .to('.valley-arch-window',{width:'100%',height:'100%',bottom:'0%',borderRadius:'0% 0% 0% 0%',duration:.68,ease:'power2.inOut'},.04)
    .to('.valley-arch-landscape',{scale:1,duration:.8,ease:'none'},0)
    .to('.valley-arch-shade',{opacity:1,duration:.3},.4)
    .fromTo('.valley-arch-destination',{autoAlpha:0,y:55},{autoAlpha:1,y:0,duration:.28},.56)
    .to({}, {duration:.16});
});
const refresh=()=>ScrollTrigger.refresh();
document.fonts.ready.then(refresh);
window.addEventListener('load',refresh,{once:true});
if(import.meta.hot)import.meta.hot.dispose(()=>{media.revert();window.removeEventListener('load',refresh);});
