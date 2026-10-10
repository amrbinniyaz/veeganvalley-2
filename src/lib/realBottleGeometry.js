import * as THREE from 'three';

// The real 375 ml bottle, measured from the Blue Magic product photograph
// (art/bottle-photos/blue-magic.png): 583 px from cap top (y 67) to base
// (y 650) maps to two units, so 1 px = 2 / 583. Each entry is
// [photo y, half width in px, superellipse exponent]: 6 is the rounded-square
// body, 2 the round neck.
const PX = 2 / 583;
const TOP = 67;
const OUTLINE = [
  [650, 0, 6], [649, 44, 6], [646, 70, 6], [642, 82, 6], [638, 89, 6], [630, 93.5, 6],
  [622, 96, 6], [614, 97.2, 6], [606, 98, 6], [230, 98, 6], [222, 97, 5.6],
  [214, 95, 5], [206, 91, 4.3], [198, 86, 3.7], [190, 81, 3.1], [182, 75.5, 2.6],
  [174, 70, 2.2], [166, 65, 2], [160, 62, 2], [135, 61.5, 2],
];
const toY = px => 1 - (px - TOP) * PX;

export const BOTTLE = {
  bodyRadius: 98 * PX,
  neckRadius: 61.5 * PX,
  neckTop: toY(135),
  capRadius: 69 * PX,
  capTop: toY(69),
  capBottom: toY(134),
  ringY: toY(150),
  fillY: toY(163),
  // The printed label on the front face, from the same photograph.
  label: { width: (334 - 204) * PX, height: (613 - 235) * PX, bottom: toY(613) },
};

// Point on a rounded square of "radius" r and exponent n at angle a.
function superellipse(a, r, n) {
  const c = Math.cos(a), s = Math.sin(a);
  return [Math.sign(c) * Math.abs(c) ** (2 / n) * r, Math.sign(s) * Math.abs(s) ** (2 / n) * r];
}

// A closed, lathe-like body following OUTLINE from the base up to topPx.
// inset shrinks the radius (for the juice inside the plastic).
export function createBottleShell({ segments = 128, topPx = 135, inset = 0, bottomPx = 650 } = {}) {
  const outline = OUTLINE.filter(([y]) => y <= bottomPx && y >= topPx);
  if (outline[0][0] !== bottomPx) outline.unshift([bottomPx, 0, 6]);
  if (outline.at(-1)[0] !== topPx) {
    const k = OUTLINE.findIndex(([y]) => y < topPx);
    const [y0, r0, n0] = OUTLINE[k - 1], [y1, r1, n1] = OUTLINE[k];
    const t = (y0 - topPx) / (y0 - y1);
    outline.push([topPx, r0 + (r1 - r0) * t, n0 + (n1 - n0) * t]);
  }
  // Densify so the shoulder curve stays smooth.
  const rings = [];
  for (let i = 0; i < outline.length; i++) {
    if (i) {
      const [ya, ra, na] = outline[i - 1], [yb, rb, nb] = outline[i];
      const steps = Math.max(1, Math.ceil(Math.abs(ya - yb) / 3));
      for (let j = 1; j < steps; j++) {
        const t = j / steps;
        rings.push([ya + (yb - ya) * t, ra + (rb - ra) * t, na + (nb - na) * t]);
      }
    }
    rings.push(outline[i]);
  }
  const positions = [], uvs = [], indices = [];
  const stride = segments + 1;
  for (const [y, r, n] of rings) {
    const radius = Math.max(0, r * PX - inset);
    for (let i = 0; i <= segments; i++) {
      const a = i / segments * Math.PI * 2 - Math.PI / 2;
      const [x, z] = superellipse(a, radius, n);
      positions.push(x, toY(y), z);
      uvs.push(i / segments, (bottomPx - y) / (bottomPx - topPx));
    }
  }
  for (let j = 0; j < rings.length - 1; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * stride + i, b = a + 1, c = a + stride, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  // A flat top closes the juice (its surface) or the open neck rim.
  const centre = positions.length / 3;
  positions.push(0, toY(topPx), 0); uvs.push(.5, 1);
  const last = (rings.length - 1) * stride;
  for (let i = 0; i < segments; i++) indices.push(centre, last + i + 1, last + i);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // Share normals across the seam so it never shows as a line.
  const normals = geometry.attributes.normal;
  for (let j = 0; j < rings.length; j++) {
    const a = j * stride, b = a + segments;
    const n = new THREE.Vector3().fromBufferAttribute(normals, a).add(new THREE.Vector3().fromBufferAttribute(normals, b)).normalize();
    normals.setXYZ(a, n.x, n.y, n.z); normals.setXYZ(b, n.x, n.y, n.z);
  }
  return geometry;
}

// The label wraps the flat-ish front face, just outside the plastic.
export function createFrontLabel() {
  const { width, height } = BOTTLE.label;
  const geometry = new THREE.PlaneGeometry(width, height, 48, 1);
  const positions = geometry.attributes.position;
  const r = BOTTLE.bodyRadius;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = r * (1 - (Math.abs(x) / r) ** 6) ** (1 / 6) + .0025;
    positions.setZ(i, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// A ridged screw cap with a softly rounded top edge.
export function createCap(segments = 128) {
  const r = BOTTLE.capRadius, top = BOTTLE.capTop, bottom = BOTTLE.capBottom, bevel = .018;
  const points = [new THREE.Vector2(0, top)];
  for (let i = 0; i <= 6; i++) {
    const a = Math.PI / 2 * (1 - i / 6);
    points.push(new THREE.Vector2(r - bevel + Math.cos(a) * bevel, top - bevel + Math.sin(a) * bevel));
  }
  points.push(new THREE.Vector2(r, bottom + .01), new THREE.Vector2(r - .004, bottom), new THREE.Vector2(BOTTLE.neckRadius, bottom));
  // LatheGeometry faces outward when its profile runs bottom to top.
  return new THREE.LatheGeometry(points.reverse(), segments);
}
