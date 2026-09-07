import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createBottleBody, createLabelGeometry } from '../lib/bottleGeometry.js';
import { createFlavourTurn, advanceFlavourTurn } from '../lib/flavourTurn.js';

const FLAVOURS = {
  'green-house': { color: '#a4ae43', label: '/img/labels/green-house.png' },
  'golden-hour': { color: '#efa334', label: '/img/labels/golden-hour.png' },
  'classic-beet': { color: '#7a303b', label: '/img/labels/classic-beet.png' },
};

export async function initBottle3D(host, { reducedMotion = false, signal, initialEntrance = 1 } = {}) {
  if (signal?.aborted) return { setFlavour() {}, setProgress() {}, destroy() {} };
  const canvas = host.querySelector('canvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    // The original photograph is always present, including without WebGL.
    return { setFlavour() {}, setProgress() {}, destroy() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
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
  const juiceMaterial = new THREE.MeshPhysicalMaterial({
    color: FLAVOURS['green-house'].color,
    roughness: .31, metalness: 0, clearcoat: 1,
    clearcoatRoughness: .13, envMapIntensity: .55,
  });
  spin.add(new THREE.Mesh(createBottleBody(), juiceMaterial));
  const labelMaterial = new THREE.MeshStandardMaterial({ transparent: true, roughness: .74, metalness: 0, envMapIntensity: .15 });
  const labelMesh = new THREE.Mesh(createLabelGeometry(), labelMaterial);
  spin.add(labelMesh);

  const capMaterial = new THREE.MeshStandardMaterial({color: '#282a25', roughness: .46, metalness: .17});
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.204, .208, .15, 96), capMaterial);
  cap.position.y = .926;
  spin.add(cap);
  // Real geometry on the cap creates moving highlights instead of a painted stripe.
  const ridgeGeometry = new THREE.CylinderGeometry(.0032, .0032, .132, 4);
  const ridges = new THREE.InstancedMesh(ridgeGeometry, capMaterial, 72);
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < 72; i++) {
    const theta = i / 72 * Math.PI * 2;
    matrix.makeTranslation(Math.cos(theta) * .206, .926, Math.sin(theta) * .206);
    ridges.setMatrixAt(i, matrix);
  }
  spin.add(ridges);
  const ringMaterial = new THREE.MeshPhysicalMaterial({color:'#cad37c', roughness:.22, clearcoat:1, envMapIntensity:.6});
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.177, .010, 10, 96), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = .833;
  spin.add(ring);

  const textureLoader = new THREE.TextureLoader();
  const textures = new Map();
  const pendingTextures = new Map();
  let isDisposed = false, selectedFlavour = 'green-house', selectionId = 0;
  function loadTexture(name) {
    if (textures.has(name)) return Promise.resolve(textures.get(name));
    if (pendingTextures.has(name)) return pendingTextures.get(name);
    const promise = textureLoader.loadAsync(FLAVOURS[name].label).then(texture => {
      if (isDisposed) { texture.dispose(); return null; }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
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
        ringMaterial.color.copy(juiceMaterial.color).lerp(new THREE.Color('#ffffff'), .2);
        if (turn.swap && !flavourTurn.swapped) {
          labelMaterial.map = flavourTurn.texture;
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
      juiceMaterial.color.set(FLAVOURS[name].color);
      ringMaterial.color.set(FLAVOURS[name].color).lerp(new THREE.Color('#ffffff'), .2);
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
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery.removeEventListener('change', requestFrame);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      scene.traverse(object => { if (object.isMesh) object.geometry.dispose(); });
      for (const material of [juiceMaterial, labelMaterial, capMaterial, ringMaterial]) material.dispose();
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
