import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BOTTLE, createBottleShell, createCap, createFrontLabel } from '../lib/realBottleGeometry.js';
import { createFlavourTurn, advanceFlavourTurn } from '../lib/flavourTurn.js';

const FLAVOURS = {
  'blue-magic': { color: '#00506b', label: '/img/labels/blue-magic.webp' },
  'green-house': { color: '#424604', label: '/img/labels/green-house.webp' },
  'golden-hour': { color: '#c95a08', label: '/img/labels/golden-hour.webp' },
  'classic-beet': { color: '#4c0b22', label: '/img/labels/classic-beet.webp' },
};

// Fine, irregular flecks like cold-pressed pulp, multiplied into the juice colour.
function createPulpTexture() {
  const size = 256, canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  context.fillStyle = '#cfcfcf';
  context.fillRect(0, 0, size, size);
  for (let i = 0; i < 5200; i++) {
    const shade = Math.random() < .55 ? 255 : 110 + Math.random() * 40;
    context.fillStyle = `rgba(${shade},${shade},${shade},${.35 + Math.random() * .5})`;
    context.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 1.6, 1 + Math.random() * 1.6);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  // About the same scale both ways: the body is ~2.6 units round and ~1.8 tall.
  texture.repeat.set(13, 9);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export async function initBottle3D(host, { reducedMotion = false, signal, initialEntrance = 1, flavour = 'green-house' } = {}) {
  if (signal?.aborted) return { setFlavour() {}, setProgress() {}, destroy() {} };
  const canvas = host.querySelector('canvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    // The original photograph is always present, including without WebGL.
    return { setFlavour() {}, setProgress() {}, destroy() {} };
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(29, 1, .1, 30);
  camera.position.set(0, .08, 5.9);
  camera.lookAt(0, 0, 0);
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(environment, .05);
  scene.environment = environmentTarget.texture;
  environment.dispose();
  pmrem.dispose();
  const key = new THREE.DirectionalLight('#fff9e8', 2.7);
  key.position.set(-3, 4, 5);
  const fill = new THREE.DirectionalLight('#e9f3db', .7);
  fill.position.set(3, 1, 3);
  const rim = new THREE.DirectionalLight('#ffffff', 2.3);
  rim.position.set(2, 3, -4);
  scene.add(key, fill, rim, new THREE.AmbientLight('#ffffff', .45));

  const lean = new THREE.Group();
  const spin = new THREE.Group();
  lean.add(spin);
  scene.add(lean);
  // Juice: a rich, slightly speckled colour (cold-pressed pulp) that darkens
  // towards the edges, where light travels through more of it.
  const juiceMaterial = new THREE.MeshPhysicalMaterial({
    color: FLAVOURS['green-house'].color, map: createPulpTexture(),
    roughness: .5, metalness: 0, envMapIntensity: .35, sheen: .2, sheenRoughness: .6,
  });
  juiceMaterial.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float juiceEdge = 1.0 - abs(dot(normalize(vViewPosition), normal));
      outgoingLight *= mix(.92, .38, pow(juiceEdge, 1.4));
      #include <opaque_fragment>`);
  };
  const juice = new THREE.Mesh(createBottleShell({ topPx: 163, inset: .006 }), juiceMaterial);
  spin.add(juice);

  // The label is printed paper on the outside of the plastic. The photographed
  // art already carries studio light, so keep its own reflections low.
  const labelMaterial = new THREE.MeshStandardMaterial({ color: '#c9c9c9', transparent: true, alphaTest: .4, roughness: .42, metalness: 0, envMapIntensity: .25, toneMapped: false });
  const labelMesh = new THREE.Mesh(createFrontLabel(), labelMaterial);
  spin.add(labelMesh);

  // Clear PET: only reflections show. Alpha follows how bright the reflection
  // is and rises at grazing angles, so the empty neck reads as clear plastic
  // over the page while highlights stay crisp.
  const plasticMaterial = new THREE.MeshPhysicalMaterial({
    color: '#000000', roughness: .05, metalness: 0, clearcoat: 1, clearcoatRoughness: .04,
    envMapIntensity: 1.7, transparent: true, depthWrite: false,
  });
  plasticMaterial.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float plasticEdge = 1.0 - abs(dot(normalize(vViewPosition), normal));
      float shine = max(max(outgoingLight.r, outgoingLight.g), outgoingLight.b);
      diffuseColor.a = clamp(.035 + pow(plasticEdge, 3.0) * .5 + smoothstep(.08, .9, shine) * .95, 0.0, 1.0);
      #include <opaque_fragment>`);
  };
  const shellGeometry = createBottleShell({ topPx: 135 });
  const shellBack = new THREE.Mesh(shellGeometry, plasticMaterial.clone());
  shellBack.material.side = THREE.BackSide;
  shellBack.material.onBeforeCompile = plasticMaterial.onBeforeCompile;
  shellBack.renderOrder = 1;
  const shellFront = new THREE.Mesh(shellGeometry, plasticMaterial);
  shellFront.renderOrder = 3;
  labelMesh.renderOrder = 2;
  spin.add(shellBack, shellFront);

  // Tamper ring left on the neck under the cap.
  const ringMaterial = plasticMaterial;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(BOTTLE.neckRadius + .004, .009, 12, 96), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = BOTTLE.ringY;
  ring.renderOrder = 3;
  spin.add(ring);

  const capMaterial = new THREE.MeshStandardMaterial({ color: '#191a19', roughness: .55, metalness: .05 });
  spin.add(new THREE.Mesh(createCap(), capMaterial));
  // Real ridges catch moving highlights as the bottle turns.
  const ridgeHeight = BOTTLE.capTop - BOTTLE.capBottom - .03;
  const ridges = new THREE.InstancedMesh(new THREE.BoxGeometry(.006, ridgeHeight, .006), capMaterial, 110);
  const matrix = new THREE.Matrix4(), turn = new THREE.Matrix4();
  for (let i = 0; i < 110; i++) {
    const theta = i / 110 * Math.PI * 2;
    turn.makeRotationY(-theta);
    matrix.makeTranslation(Math.cos(theta) * BOTTLE.capRadius, BOTTLE.capBottom + .008 + ridgeHeight / 2, Math.sin(theta) * BOTTLE.capRadius).multiply(turn);
    ridges.setMatrixAt(i, matrix);
  }
  spin.add(ridges);

  // Labels share the front face's width; each keeps its own proportions and
  // sits on the same bottom line as the real sticker.
  function fitLabel(texture) {
    const { width, height, bottom } = BOTTLE.label;
    const aspect = texture.image.width / texture.image.height;
    const fitted = Math.min(height, width / aspect);
    labelMesh.scale.y = fitted / height;
    labelMesh.position.y = bottom + fitted / 2;
  }

  const textureLoader = new THREE.TextureLoader();
  const textures = new Map();
  const pendingTextures = new Map();
  let isDisposed = false, selectedFlavour = FLAVOURS[flavour] ? flavour : 'green-house', selectionId = 0;
  function loadTexture(name) {
    if (textures.has(name)) return Promise.resolve(textures.get(name));
    if (pendingTextures.has(name)) return pendingTextures.get(name);
    const promise = textureLoader.loadAsync(FLAVOURS[name].label).then(texture => {
      if (isDisposed) { texture.dispose(); return null; }
      texture.colorSpace = THREE.SRGBColorSpace;
      // Keep small printed type legible when the label curves away from the camera.
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      textures.set(name, texture);
      pendingTextures.delete(name);
      return texture;
    }).catch(error => { pendingTextures.delete(name); throw error; });
    pendingTextures.set(name, promise);
    return promise;
  }

  let progress = 0, smoothProgress = 0, pointerX = 0, pointerY = 0;
  let entrance = THREE.MathUtils.clamp(initialEntrance, 0, 1);
  let flavourAngle = 0, flavourTurn;
  let smoothPointerX = 0, smoothPointerY = 0, frame = 0, visible = true, previousTime = 0;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopQuery = window.matchMedia('(min-width: 768px)');
  function resize() {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height || isDisposed) return;
    // Supersample the fine label lettering, including on Retina displays. Bound
    // the buffer to three megapixels so a large monitor cannot balloon GPU work.
    const pixelRatio = Math.min(
      Math.max(1.5, (window.devicePixelRatio || 1) * 1.25),
      3,
      Math.sqrt(3_000_000 / (width * height)),
    );
    if (renderer.getPixelRatio() !== pixelRatio) renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Keep a consistent product scale while avoiding clipping on narrow screens.
    camera.position.z = Math.max(5.05, 2.12 / (2 * Math.tan(THREE.MathUtils.degToRad(29) / 2)) / Math.min(1, camera.aspect * 1.65));
    camera.updateProjectionMatrix();
    requestFrame();
  }
  function draw(time) {
    frame = 0;
    if (isDisposed || !visible || document.hidden) return;
    const dt = Math.min((time - previousTime) / 1000 || .016, .05);
    previousTime = time;
    const reduce = reducedMotion || motionQuery.matches;
    if (flavourTurn) {
      const turn = advanceFlavourTurn(flavourTurn, dt, reduce);
      flavourAngle = turn.angle;
      // A newer click invalidates an older label, even while its turn finishes.
      if (flavourTurn.requestId === selectionId) {
        juiceMaterial.color.copy(flavourTurn.fromColor).lerp(flavourTurn.toColor, turn.blend);
        if (turn.swap && !flavourTurn.swapped) {
          labelMaterial.map = flavourTurn.texture;
          fitLabel(flavourTurn.texture);
          labelMaterial.needsUpdate = true;
          flavourTurn.swapped = true;
        }
      }
      if (turn.done) { flavourTurn = undefined; flavourAngle = 0; }
    }
    const damping = 1 - Math.exp(-8 * dt);
    smoothProgress += (progress - smoothProgress) * damping;
    smoothPointerX += (pointerX - smoothPointerX) * damping;
    smoothPointerY += (pointerY - smoothPointerY) * damping;
    // One full, continuous turn. No integer frames or competing scroll loops.
    spin.rotation.y = reduce ? .12 : smoothProgress * Math.PI * 2 + .12 + smoothPointerX * .10 - (1 - entrance) * Math.PI * 1.35 + flavourAngle;
    lean.rotation.z = reduce ? -.17 : THREE.MathUtils.lerp(-.20, .10, smoothProgress) + Math.sin(time * .0007) * .017;
    lean.rotation.x = reduce ? .03 : .035 + smoothPointerY * .04;
    lean.position.y = reduce ? 0 : Math.sin(time * .0011) * .027;
    renderer.render(scene, camera);
    if (!reduce) requestFrame();
  }
  function requestFrame() { if (!frame && !isDisposed && visible && !document.hidden) frame = requestAnimationFrame(draw); }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) requestFrame(); }, { rootMargin: '100px' });
  intersection.observe(host);
  const onPointer = event => {
    if (event.pointerType === 'touch' || !desktopQuery.matches) return;
    pointerX = event.clientX / window.innerWidth - .5;
    pointerY = event.clientY / window.innerHeight - .5;
    requestFrame();
  };
  const onVisibility = () => { previousTime = performance.now(); requestFrame(); };
  const onContextLost = event => { event.preventDefault(); host.classList.remove('is-3d-ready'); };
  const onContextRestored = () => { if (labelMaterial.map) host.classList.add('is-3d-ready'); requestFrame(); };
  window.addEventListener('pointermove', onPointer, { passive: true });
  // A browser moved between displays can change DPR without resizing the host.
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  motionQuery.addEventListener('change', requestFrame);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  async function setFlavour(name, { animate = false } = {}) {
    if (!FLAVOURS[name] || isDisposed) return;
    selectedFlavour = name;
    const requestId = ++selectionId;
    try {
      const texture = await loadTexture(name);
      if (isDisposed || requestId !== selectionId || !texture) return;
      if (animate && labelMaterial.map && host.classList.contains('is-3d-ready') && !reducedMotion && !motionQuery.matches) {
        flavourTurn = {
          ...createFlavourTurn(flavourAngle), requestId, texture, swapped: false,
          fromColor: juiceMaterial.color.clone(), toColor: new THREE.Color(FLAVOURS[name].color),
        };
        requestFrame();
        return;
      }
      flavourTurn = undefined;
      flavourAngle = 0;
      labelMaterial.map = texture;
      labelMaterial.needsUpdate = true;
      fitLabel(texture);
      juiceMaterial.color.set(FLAVOURS[name].color);
      resize();
      renderer.render(scene, camera);
      host.classList.add('is-3d-ready');
      requestFrame();
    } catch {
      if (isDisposed || requestId !== selectionId) return;
      flavourTurn = undefined;
      flavourAngle = 0;
      // Keep the selected bottle photo visible if its 3D label fails to load.
      host.classList.remove('is-3d-ready');
    }
  }
  const instance = {
    setFlavour,
    setProgress(value) { progress = THREE.MathUtils.clamp(value, 0, 1); requestFrame(); },
    setEntrance(value) { entrance = THREE.MathUtils.clamp(value, 0, 1); requestFrame(); },
    destroy() {
      if (isDisposed) return;
      isDisposed = true;
      signal?.removeEventListener('abort', instance.destroy);
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery.removeEventListener('change', requestFrame);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      scene.traverse(object => { if (object.isMesh) object.geometry.dispose(); });
      for (const material of [juiceMaterial, labelMaterial, capMaterial, plasticMaterial, shellBack.material]) material.dispose();
      juiceMaterial.map?.dispose();
      for (const texture of textures.values()) texture.dispose();
      environmentTarget.dispose();
      renderer.dispose();
      host.classList.remove('is-3d-ready');
    },
  };
  signal?.addEventListener('abort', instance.destroy, { once: true });
  if (signal?.aborted) instance.destroy();
  resize();
  await setFlavour(selectedFlavour);
  // Warm the other two labels so dot clicks can start their turn immediately.
  if (!isDisposed) for (const name of Object.keys(FLAVOURS)) {
    if (name !== selectedFlavour) loadTexture(name).catch(() => {});
  }
  return instance;
}
