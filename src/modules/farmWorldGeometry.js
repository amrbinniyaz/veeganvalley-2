import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createBottleBody, createLabelGeometry } from '../lib/bottleGeometry.js';
import { createAppleGeometry, createCarrotGeometry, createCucumberGeometry, createLemonGeometry, createLeafGeometry, createLeafVeinGeometry } from '../lib/produceGeometry.js';

const TAU = Math.PI * 2;
export function buildFarmWorld() {
  const staticRoot = new T.Group();
  const dynamic = new T.Group();
  const materials = {};
  const palette = {
    grass: '#a8bb88', paleGrass: '#c2d0a4', deepGrass: '#829c70',
    leaves: '#90aa79', lightLeaves: '#b4c491', darkLeaves: '#668763',
    soil: '#c5bca2', edge: '#d8d9bf', cream: '#f0eddb',
    wood: '#b8a782', green: '#4d7150', apple: '#c0c981',
    carrot: '#d6ac7b', lemon: '#dfd49a', metal: '#b8c7bc',
    darkMetal: '#698073', juice: '#c1cd82', cap: '#344b39',
  };
  for (const [name, color] of Object.entries(palette)) {
    materials[name] = new T.MeshStandardMaterial({ color, roughness: name === 'metal' ? .35 : .9, metalness: name === 'metal' ? .45 : 0 });
  }
  materials.bottle = new T.MeshPhysicalMaterial({color:'#b5c77c', roughness:.26, clearcoat:1, clearcoatRoughness:.2});
  materials.label = new T.MeshStandardMaterial({color:'#ffffff', roughness:.8, transparent:true});
  materials.glass = new T.MeshPhysicalMaterial({color:'#e4edda', transparent:true, opacity:.15, roughness:.2, depthWrite:false, side:T.DoubleSide});
  // Vertex colours add gentle ripening and growth marks without noisy image maps.
  materials.appleSkin = new T.MeshPhysicalMaterial({vertexColors:true, roughness:.48, clearcoat:.25, clearcoatRoughness:.45});
  materials.cucumberSkin = new T.MeshStandardMaterial({vertexColors:true, roughness:.68});
  materials.carrotSkin = new T.MeshStandardMaterial({vertexColors:true, roughness:.83});
  materials.lemonSkin = new T.MeshStandardMaterial({vertexColors:true, roughness:.72});
  materials.produceLeaf = new T.MeshStandardMaterial({color:'#759660', roughness:.78, side:T.DoubleSide});
  materials.leafVein = new T.MeshStandardMaterial({color:'#adbc85', roughness:.9});
  for (const name of ['leaves','lightLeaves','green']) materials[name].side = T.DoubleSide;
  const geoms = {
    box: new T.BoxGeometry(1,1,1), sphere: new T.SphereGeometry(1,16,12),
    canopy: new T.IcosahedronGeometry(1,2), cylinder:new T.CylinderGeometry(1,1,1,24),
    leaf:createLeafGeometry(), leafVein:createLeafVeinGeometry(),
    apple:createAppleGeometry(), orchardApple:createAppleGeometry(20),
    carrot:createCarrotGeometry(), cucumber:createCucumberGeometry(), lemon:createLemonGeometry(),
    fruitStem:new T.TubeGeometry(new T.CatmullRomCurve3([
      new T.Vector3(0,.245,0), new T.Vector3(.014,.34,.006), new T.Vector3(.045,.455,-.005),
    ]),12,.021,7,false),
  };
  function mesh(geometry, material, position, scale=[1,1,1], parent=staticRoot) {
    const m = new T.Mesh(geometry, typeof material === 'string' ? materials[material] : material);
    m.position.set(...position); m.scale.set(...scale); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
  }
  const box = (pos,size,mat='cream',parent=staticRoot) => mesh(geoms.box,mat,pos,size,parent);
  const ball = (pos,size,mat='leaves',parent=staticRoot) => mesh(geoms.sphere,mat,pos,size,parent);
  const cylinder = (pos,size,mat='wood',parent=staticRoot) => mesh(geoms.cylinder,mat,pos,size,parent);
  function beam(a,b,r,mat='wood',parent=staticRoot) {
    const start=new T.Vector3(...a), end=new T.Vector3(...b);
    const m=cylinder(start.clone().add(end).multiplyScalar(.5).toArray(),[r,start.distanceTo(end),r],mat,parent);
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize()); return m;
  }
  function leaf(pos, size=.45, angle=0, mat='leaves', parent=staticRoot) {
    const m=mesh(geoms.leaf,mat,pos,[size,size,size],parent);
    m.rotation.set(.35,angle,.4); return m;
  }
  function produceLeaf(pos,size,angle,parent) {
    const m=leaf(pos,size,angle,'produceLeaf',parent);
    mesh(geoms.leafVein,'leafVein',[0,0,0],[1,1,1],m);
    return m;
  }
  function apple(pos,scale=1,parent=staticRoot) {
    const g=new T.Group(); g.position.set(...pos); g.scale.setScalar(scale); parent.add(g);
    g.name='apple';
    mesh(scale<.7?geoms.orchardApple:geoms.apple,'appleSkin',[0,0,0],[1,1,1],g);
    mesh(geoms.fruitStem,'wood',[0,0,0],[1,1,1],g);
    const foliage=produceLeaf([.13,.397,.09],scale<.7?.2:.25,.6,g);
    foliage.rotation.z=-.35;
    return g;
  }
  function carrot(pos,scale=1,parent=staticRoot) {
    const g=new T.Group(); g.position.set(...pos); g.scale.setScalar(scale); parent.add(g);
    g.name='carrot';
    mesh(geoms.carrot,'carrotSkin',[0,0,0],[1,1,1],g);
    for(let i=0;i<4;i++) {
      const angle=i*2.4;
      const tip=[Math.cos(angle)*.28,.98+(i%2)*.14,Math.sin(angle)*.28];
      beam([0,.45,0],tip,.014,'green',g);
      for(let j=0;j<3;j++) {
        const t=.35+j*.23;
        for(const side of [-1,1]) {
          const p=[tip[0]*t+Math.cos(angle+Math.PI/2)*side*.065,.45+(tip[1]-.45)*t,tip[2]*t+Math.sin(angle+Math.PI/2)*side*.065];
          const frond=leaf(p,.13-j*.02,angle+side*.8,'produceLeaf',g);
          frond.rotation.x=-.5; frond.scale.x*=.6;
        }
      }
    }
    g.rotation.z=-.9; return g;
  }
  function cucumber(pos,parent=staticRoot) {
    const g=new T.Group();g.name='cucumber';g.position.set(...pos);parent.add(g);
    mesh(geoms.cucumber,'cucumberSkin',[0,0,0],[1,1,1],g);
    beam([0,0,-.91],[.04,.045,-1.07],.03,'wood',g);
    return g;
  }
  function lemon(pos,parent=staticRoot) {
    const g=new T.Group();g.name='lemon';g.position.set(...pos);parent.add(g);
    mesh(geoms.lemon,'lemonSkin',[0,0,0],[1,1,1],g);
    produceLeaf([-.38,.17,-.08],.22,-.9,g);
    return g;
  }
  function tree(x,z,s=1,fruit=true) {
    const g=new T.Group(); g.position.set(x,.05,z); g.scale.setScalar(s); staticRoot.add(g);
    beam([0,0,0],[.08,2.6,0],.16,'wood',g);
    beam([0,1.5,0],[-.65,2.5,.1],.09,'wood',g);
    beam([0,1.9,0],[.65,2.8,-.2],.08,'wood',g);
    [[0,3.15,0,1.15],[-.7,2.7,.25,.82],[.7,2.9,-.15,.87],[.12,3.8,-.05,.75]].forEach(([a,b,c,r],i)=>mesh(geoms.canopy,i%2?'lightLeaves':'leaves',[a,b,c],[r,r*.9,r*.86],g));
    if(fruit) for(let i=0;i<5;i++) apple([Math.sin(i*2.1)*.87,2.75+(i%3)*.34,Math.cos(i*2.1)*.85],.49,g);
  }
  function island(x, radius, depth) {
    cylinder([x,-1.5,0],[radius*.91,1.3,depth*.91],'edge');
    cylinder([x,-.7,0],[radius, .9,depth],'soil');
    cylinder([x,-.18,0],[radius*1.01,.28,depth*1.01],'paleGrass');
  }
  function path(points,r=.5,mat='cream') {
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    const tube=new T.TubeGeometry(curve,72,r,8,false);
    const m=mesh(tube,mat,[0,0,0]); m.scale.y=.07; return m;
  }
  function fence(x,z,count=5,spacing=1.2) {
    for(let i=0;i<count;i++) {
      const dx=x+i*spacing;
      cylinder([dx,.55,z],[.06,1.1,.06],'cream');
      if(i<count-1) for(const y of [.42,.8]) beam([dx,y,z],[dx+spacing,y,z],.045,'cream');
    }
  }
  // One ribbon of land connects the four little worlds. It is visible during travel.
  path([[-9,-12,3],[0,-12,4],[12,-12,2.2],[24,-12,4],[36,-12,2],[48,-12,4],[60,-12,2.3],[72,-12,3],[81,-12,1]],2.5,'edge');
  path([[-9,.5,3],[0,.5,4],[12,.5,2.2],[24,.5,4],[36,.5,2],[48,.5,4],[60,.5,2.3],[72,.5,3],[81,.5,1]],.7,'cream');
  island(0,11,7.4); island(24,8.5,6.8); island(48,9,7); island(72,8.5,7);
  // Orchard: curved planting beds, a cream farmhouse and a few considered trees.
  for(let row=0;row<6;row++) {
    const x=-7.2+row*.95;
    path([[x,.8,0],[x+.3,.8,2],[x+.9,.8,4.2]],.28,row%2?'grass':'deepGrass');
    for(let j=0;j<5;j++) {
      leaf([x+j*.16,.14,j*.72+.25],.25,j*.6,'leaves');
      leaf([x+j*.16+.16,.15,j*.72+.25],.23,-j*.8,'lightLeaves');
    }
  }
  [[-3,-3,1.12],[.2,-3.6,1.23],[3.3,-3,1.05],[-1.5,0,1.04],[2,0,1.12],[5,.2,.95]].forEach(([x,z,s])=>tree(x,z,s));
  box([5.5,1.05,-4.5],[3.5,2.1,2.8]);
  const roof=new T.ConeGeometry(2.65,1.6,4); const r=mesh(roof,'green',[5.5,2.9,-4.5],[1,.8,.85]); r.rotation.y=Math.PI/4;
  box([5.5,.85,-3.075],[.9,1.7,.06],'wood');
  for(const x of [4.4,6.6]) box([x,1.35,-3.04],[.55,.65,.04],'metal');
  box([6.45,3,-4.65],[.4,1.5,.4],'cream');
  fence(-3,5.6,7); fence(6,-1.8,3,.9);
  // Harvest: generous scale brings the real ingredients close to the camera.
  function crate(x,y,z,s=1) {
    const g=new T.Group(); g.position.set(x,y,z); g.scale.setScalar(s); staticRoot.add(g);
    box([0,.1,0],[3,.2,2],'wood',g);
    for(const px of [-1.4,1.4]) for(const pz of [-.9,.9]) box([px,.7,pz],[.14,1.4,.14],'wood',g);
    for(let row=0;row<3;row++) {
      for(const z of [-1,1]) box([0,.3+row*.38,z],[3,.23,.1],'wood',g);
      for(const x of [-1.5,1.5]) box([x,.3+row*.38,0],[.1,.23,2],'wood',g);
    }
    return g;
  }
  const produce=crate(24,.1,.6,1.6);
  [[-.8,1.24,-.3],[.08,1.38,-.35]].forEach((p,i)=>{
    const fruit=apple(p,1.35,produce);fruit.rotation.set(.05,i*.8,-.08+i*.14);
  });
  const green=cucumber([.76,1.4,-.15],produce);green.rotation.set(-.24,.28,.08);
  const firstCarrot=carrot([-.45,1.1,.92],1.12,produce);firstCarrot.rotation.set(.15,.2,-.8);
  const secondCarrot=carrot([.03,1.01,1.15],.98,produce);secondCarrot.rotation.set(.15,-.05,-.68);
  const citrus=lemon([1.04,.35,1.32],produce);citrus.rotation.set(.12,.32,-.06);
  crate(20.5,.05,-2.8,.8); tree(28,-3.5,1.2); tree(18,-3,.9,false); fence(18.5,4.9,6);
  // An open glasshouse wraps the press, letting the camera see through its ribs.
  box([48,.15,0],[8,.3,6.2],'cream');
  for(const x of [44.3,46.15,48,49.85,51.7]) {
    beam([x,.25,-2.8],[x,4.5,-2.8],.065,'green');
    beam([x,.25,2.8],[x,4.5,2.8],.065,'green');
    beam([x,4.5,-2.8],[x,6.3,0],.065,'green');
    beam([x,6.3,0],[x,4.5,2.8],.065,'green');
  }
  for(const [y,z] of [[4.5,-2.8],[6.3,0],[4.5,2.8]]) beam([44.3,y,z],[51.7,y,z],.06,'green');
  const roofGlass=box([48,5.38,-1.4],[7.4,.03,3.33],materials.glass); roofGlass.rotation.x=.57;
  // Press hardware is deliberately open, clean and readable from every angle.
  box([48,.65,0],[3.2,.8,2.8],'metal');
  for(const x of [46.7,49.3]) cylinder([x,2.75,0],[.13,4.2,.13],'darkMetal');
  box([48,4.8,0],[3.1,.35,.5],'metal');
  cylinder([48,4.1,0],[.14,1.6,.14],'darkMetal');
  cylinder([48,2.1,0],[1.05,1.6,1.05],'metal');
  // Thin basket bars read as the perforated press without a dense texture.
  for(let i=0;i<22;i++) {
    const a=i/22*TAU;
    cylinder([48+Math.sin(a)*1.058,2.1,Math.cos(a)*1.058],[.018,1.45,.018],'darkMetal');
  }
  beam([48,4.9,0],[50,5.65,0],.075,'darkMetal');
  beam([49.65,5.52,0],[50.4,5.8,0],.12,'green');
  path([[48,26,1],[48,26,1.6],[48,18,1.9]],.1,'metal');
  const piston=cylinder([48,3.6,0],[.98,.15,.98],'darkMetal',dynamic);
  const juiceStream=cylinder([48,1.3,1.9],[.055,1.4,.055],'juice',dynamic);
  cylinder([48,.4,1.9],[.44,.5,.44],'juice');
  cylinder([48,.65,1.9],[.5,1.1,.5],materials.glass);
  tree(54,-3,1.05,false); tree(42,-3,.85,false);
  // Finale: the existing rounded-square brand bottle becomes part of the world.
  cylinder([72,.15,0],[3.2,.4,3.2],'cream');
  cylinder([72,.43,0],[2.5,.2,2.5],'edge');
  const bottle=new T.Group(); bottle.position.set(72,3.3,0); bottle.scale.setScalar(2.65); dynamic.add(bottle);
  mesh(createBottleBody(64),materials.bottle,[0,0,0],[1,1,1],bottle);
  const label=mesh(createLabelGeometry(),materials.label,[0,0,0],[1,1,1],bottle);
  cylinder([0,.926,0],[.207,.15,.207],'cap',bottle);
  for(let i=0;i<48;i++) {
    const a=i/48*TAU;
    cylinder([Math.sin(a)*.208,.926,Math.cos(a)*.208],[.003,.13,.003],'cap',bottle);
  }
  apple([69.8,.95,1.35],1.5); carrot([74,.85,1.1],1.5);
  for(let i=0;i<4;i++) leaf([70+i*.8,.6,-1.4],.7,i,'leaves');
  tree(77,-3,.85,false); tree(67,-3,.65,false);
  const travellingApple=apple([-1.5,3.5,2],1.5,dynamic);
  const leafDrift=[];
  for(let i=0;i<7;i++) {
    const l=leaf([i*12-2,3+(i%3)*.8,2],.22,i,'lightLeaves',dynamic);
    leafDrift.push({mesh:l,base:l.position.clone(),phase:i*1.7});
  }
  // Bake immovable props by material. Hundreds of pieces become a few draw calls.
  staticRoot.updateMatrixWorld(true);
  const batches=new Map(), transparent=[];
  staticRoot.traverse(obj=>{
    if(!obj.isMesh) return;
    if(obj.material.transparent) { transparent.push(obj); return; }
    const key=`${obj.material.uuid}:${!!obj.geometry.index}:${Object.keys(obj.geometry.attributes).sort().join(',')}`;
    if(!batches.has(key)) batches.set(key,{material:obj.material,geometries:[]});
    batches.get(key).geometries.push(obj.geometry.clone().applyMatrix4(obj.matrixWorld));
  });
  const baked=new T.Group();
  for(const {material,geometries} of batches.values()) {
    const geometry=mergeGeometries(geometries);
    if(!geometry) throw new Error('Unable to assemble the farm geometry.');
    const m=mesh(geometry,material,[0,0,0],[1,1,1],baked);
    m.frustumCulled=false;
    geometries.forEach(g=>g.dispose());
  }
  for(const obj of transparent) { obj.matrixWorld.decompose(obj.position,obj.quaternion,obj.scale); baked.add(obj); }
  // Dispose only source geometries not shared by the dynamic pieces.
  const retained=new Set(); dynamic.traverse(obj=>{if(obj.isMesh) retained.add(obj.geometry);});
  transparent.forEach(obj=>retained.add(obj.geometry));
  const source=new Set(); staticRoot.traverse(obj=>{if(obj.isMesh) source.add(obj.geometry);});
  source.forEach(g=>{if(!retained.has(g)) g.dispose();});
  return { baked, dynamic, bottle, label, piston, juiceStream, travellingApple, leafDrift, materials };
}
