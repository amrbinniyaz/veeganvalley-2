import * as T from 'three';
import { buildFarmWorld } from './farmWorldGeometry.js';
import { flightAt, appleRoute, smoothRange } from '../lib/worldFlight.js';

export async function initFarmWorld(host, { onReady, onUnavailable } = {}) {
  const canvas=host.querySelector('canvas');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const coarse=matchMedia('(pointer: coarse)');
  let renderer;
  try { renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'}); }
  catch { onUnavailable?.(); return { setProgress(){}, destroy(){} }; }
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.22;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.setClearColor('#eef2e6');
  const scene=new T.Scene();
  scene.fog=new T.FogExp2('#eef2e6',.018);
  const camera=new T.PerspectiveCamera(39,1,.1,150);
  const world=buildFarmWorld();
  scene.add(world.baked,world.dynamic);
  const ground=new T.Mesh(new T.PlaneGeometry(240,100),new T.MeshStandardMaterial({color:'#eef2e6',roughness:1}));
  ground.rotation.x=-Math.PI/2; ground.position.set(35,-2.35,0); ground.receiveShadow=true; scene.add(ground);
  const sky=new T.HemisphereLight('#fffdf1','#b9c4a5',2.1);
  const sun=new T.DirectionalLight('#fff4d9',3.2);
  sun.castShadow=true;
  sun.shadow.mapSize.set(coarse.matches?1024:2048,coarse.matches?1024:2048);
  Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:65});
  sun.shadow.bias=-.0004; sun.shadow.normalBias=.04; sun.shadow.radius=4;
  const fill=new T.DirectionalLight('#eaf2df',.8); fill.position.set(10,8,12);
  scene.add(sky,sun,sun.target,fill);
  let progress=0, smoothed=0, frame=0, last=0, disposed=false, ready=false, lost=false;
  let width=1,height=1,mobile=false,pointerX=0,pointerY=0,smoothX=0,smoothY=0;
  let labelTexture, labelSettled=false;
  const cleanup=[];
  const listen=(el,event,fn,opts)=>{el.addEventListener(event,fn,opts);cleanup.push(()=>el.removeEventListener(event,fn,opts));};
  function requestFrame() { if(!frame&&!disposed&&!lost&&!document.hidden) frame=requestAnimationFrame(draw); }
  function draw(time) {
    frame=0;
    if(disposed||lost||document.hidden) return;
    if(coarse.matches&&last&&time-last<30) { requestFrame(); return; }
    const dt=Math.min(.05,(time-last)/1000||.016); last=time;
    const damping=1-Math.exp(-10*dt);
    smoothed=motion.matches?Math.round(progress):T.MathUtils.lerp(smoothed,progress,damping);
    smoothX=T.MathUtils.lerp(smoothX,motion.matches?0:pointerX,damping);
    smoothY=T.MathUtils.lerp(smoothY,motion.matches?0:pointerY,damping);
    const flight=flightAt(smoothed,mobile);
    camera.position.copy(flight.position);
    camera.position.x+=smoothX*.55; camera.position.y+=smoothY*.25;
    camera.lookAt(flight.target);
    sun.position.set(flight.target.x-9,20,10);
    sun.target.position.set(flight.target.x,0,0);
    fill.position.x=flight.target.x+12;
    // A single apple leaves the orchard, passes the harvest and drops into the press.
    world.travellingApple.position.copy(appleRoute.getPoint(Math.min(1,smoothed/2)));
    const squeeze=smoothRange(smoothed,1.93,2.25);
    world.travellingApple.position.y-=squeeze*2;
    world.travellingApple.scale.setScalar(1.5*(1-squeeze));
    world.travellingApple.rotation.y=smoothed*2;
    world.piston.position.y=3.6-squeeze*.76;
    const pour=smoothRange(smoothed,2.02,2.3);
    world.juiceStream.scale.y=1.4*Math.max(.001,pour);
    world.juiceStream.visible=pour>.01;
    world.bottle.rotation.y=.32+(1-smoothRange(smoothed,2.45,3))*Math.PI*1.7;
    world.bottle.rotation.z=motion.matches?-.025:Math.sin(time*.0006)*.025;
    world.bottle.position.y=3.3+(motion.matches?0:Math.sin(time*.001)*.045);
    for(const leaf of world.leafDrift) {
      leaf.mesh.position.y=leaf.base.y+(motion.matches?0:Math.sin(time*.00065+leaf.phase)*.2);
      leaf.mesh.rotation.z=motion.matches?.25:Math.sin(time*.0007+leaf.phase)*.3;
    }
    renderer.render(scene,camera);
    if(!ready&&labelSettled) {ready=true;onReady?.();}
    if(!motion.matches) requestFrame();
  }
  function resize() {
    width=host.clientWidth; height=host.clientHeight;
    if(!width||!height||disposed) return;
    mobile=width<768;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.3:1.65));
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.fov=mobile?47:39;
    // Lens shift keeps the world beside desktop copy and below phone copy.
    camera.setViewOffset(width,height,mobile?0:-width*.21,mobile?-height*.23:0,width,height);
    camera.updateProjectionMatrix();
    requestFrame();
  }
  const observer=new ResizeObserver(resize); observer.observe(host);
  listen(window,'pointermove',event=>{
    if(event.pointerType==='touch'||coarse.matches) return;
    pointerX=event.clientX/width-.5; pointerY=.5-event.clientY/height; requestFrame();
  },{passive:true});
  listen(document,'visibilitychange',()=>{last=0;requestFrame();});
  listen(motion,'change',requestFrame);
  listen(canvas,'webglcontextlost',event=>{event.preventDefault();lost=true;ready=false;onUnavailable?.();});
  listen(canvas,'webglcontextrestored',()=>{lost=false;requestFrame();});
  resize();
  new T.TextureLoader().loadAsync('/img/labels/green-house-hd.webp').then(texture => {
    labelSettled=true;
    labelTexture=texture;
    if(disposed) labelTexture.dispose();
    else {
      labelTexture.colorSpace=T.SRGBColorSpace;
      labelTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();
      world.materials.label.map=labelTexture; world.materials.label.needsUpdate=true; requestFrame();
    }
  }).catch(() => { labelSettled=true; world.materials.label.opacity=0; requestFrame(); });
  return {
    setProgress(value) { progress=T.MathUtils.clamp(value,0,3); requestFrame(); },
    destroy() {
      disposed=true;cancelAnimationFrame(frame);observer.disconnect();cleanup.forEach(fn=>fn());
      const geometries=new Set(),materials=new Set();
      scene.traverse(obj=>{if(obj.isMesh){geometries.add(obj.geometry);(Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>materials.add(m));}});
      geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
      labelTexture?.dispose();sun.shadow.map?.dispose();renderer.dispose();
    },
  };
}
