import * as THREE from 'three';

// A continuous rounded-square bottle, transitioning into a circular neck.
// Each ring shares a consistent vertex order, including a welded UV seam.
const PROFILE = [
  [0, .263, 5], [.012, .291, 5.6], [.035, .305, 6],
  [.08, .308, 6], [.69, .308, 6], [.725, .305, 6],
  [.755, .295, 5.6], [.79, .275, 4.8], [.825, .244, 3.8],
  [.858, .203, 2.7], [.882, .177, 2], [.91, .173, 2],
  [.928, .173, 2],
];
const TAU = Math.PI * 2;

function profileAt(height) {
  let k = PROFILE.findIndex(p => p[0] >= height);
  if (k <= 0) return PROFILE[Math.max(k, 0)].slice(1);
  const a = PROFILE[k - 1], b = PROFILE[k];
  const t = (height - a[0]) / (b[0] - a[0]);
  return [THREE.MathUtils.lerp(a[1], b[1], t), THREE.MathUtils.lerp(a[2], b[2], t)];
}

export function createBottleBody(radialSegments = 96) {
  const heights = [...new Set(PROFILE.flatMap((p, index) => {
    if (!index) return [p[0]];
    const previous = PROFILE[index - 1][0];
    const steps = Math.max(3, Math.ceil((p[0] - previous) * 160));
    return Array.from({length: steps}, (_, j) => previous + (p[0] - previous) * (j + 1) / steps);
  }))];
  const positions = [], indices = [];
  for (const height of heights) {
    const [radius, exponent] = profileAt(height);
    for (let i = 0; i <= radialSegments; i++) {
      const angle = i / radialSegments * TAU - Math.PI / 2;
      const c = Math.cos(angle), s = Math.sin(angle);
      positions.push(Math.sign(c) * Math.abs(c) ** (2 / exponent) * radius, height * 2 - 1, Math.sign(s) * Math.abs(s) ** (2 / exponent) * radius);
    }
  }
  const stride = radialSegments + 1;
  for (let j = 0; j < heights.length - 1; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = j * stride + i, b = a + 1, c = a + stride, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  // Close the top and base so every view remains a solid object.
  const bottom = positions.length / 3;
  positions.push(0, -1, 0);
  const top = positions.length / 3;
  positions.push(0, heights.at(-1) * 2 - 1, 0);
  const lastRing = (heights.length - 1) * stride;
  for (let i = 0; i < radialSegments; i++) {
    indices.push(bottom, i, i + 1);
    indices.push(top, lastRing + i + 1, lastRing + i);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // Share normals across the duplicate seam vertices to prevent a dark line.
  const normals = geometry.attributes.normal;
  for (let j = 0; j < heights.length; j++) {
    const a = j * stride, b = a + radialSegments;
    const average = new THREE.Vector3().fromBufferAttribute(normals, a).add(new THREE.Vector3().fromBufferAttribute(normals, b)).normalize();
    normals.setXYZ(a, average.x, average.y, average.z);
    normals.setXYZ(b, average.x, average.y, average.z);
  }
  return geometry;
}

export function createLabelGeometry() {
  const geometry = new THREE.PlaneGeometry(.464, 1.08, 32, 1);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = .308 * (1 - (Math.abs(x) / .308) ** 6) ** (1 / 6) + .0015;
    positions.setXYZ(i, x, positions.getY(i) - .3, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}
