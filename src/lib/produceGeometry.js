import * as T from 'three';

const TAU = Math.PI * 2;
const mix = (a, b, t) => a.clone().lerp(b, T.MathUtils.clamp(t, 0, 1));

// Shape the skin itself so fruit retains its silhouette from every camera angle.
function fruitSurface(widthSegments, heightSegments, sample) {
  const geometry = new T.SphereGeometry(1, widthSegments, heightSegments);
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const colors = [];
  for (let i = 0; i < position.count; i++) {
    const theta = uv.getX(i) * TAU;
    const phi = (1 - uv.getY(i)) * Math.PI;
    const { point, color } = sample(theta, phi);
    position.setXYZ(i, ...point);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  // Average the seam and pole normals after deformation to avoid a visible join.
  const normals = geometry.attributes.normal;
  const stride = widthSegments + 1;
  for (let row = 0; row <= heightSegments; row++) {
    const first = row * stride, last = first + widthSegments;
    const normal = new T.Vector3().fromBufferAttribute(normals, first).add(new T.Vector3().fromBufferAttribute(normals, last)).normalize();
    normals.setXYZ(first, normal.x, normal.y, normal.z);
    normals.setXYZ(last, normal.x, normal.y, normal.z);
  }
  for (const row of [0, heightSegments]) {
    const normal = new T.Vector3();
    for (let j = 0; j <= widthSegments; j++) normal.add(new T.Vector3().fromBufferAttribute(normals, row * stride + j));
    normal.normalize();
    for (let j = 0; j <= widthSegments; j++) normals.setXYZ(row * stride + j, normal.x, normal.y, normal.z);
  }
  return geometry;
}

export function createAppleGeometry(detail = 40) {
  const green = new T.Color('#a8ba70'), gold = new T.Color('#ced391'), blush = new T.Color('#c4b77f');
  return fruitSurface(detail, Math.round(detail * .7), (theta, phi) => {
    const s = Math.sin(phi), c = Math.cos(phi);
    const lobes = 1 + .047 * Math.cos(theta * 5) * s;
    const radius = .37 * s * lobes * (1 + .075 * c);
    const topDimple = .082 * Math.exp(-((phi / .28) ** 2));
    const baseDimple = .029 * Math.exp(-(((Math.PI - phi) / .3) ** 2));
    const fleck = Math.sin(theta * 37 + phi * 71) * Math.sin(phi * 47 - theta * 13) * .018;
    const color = mix(green, gold, .28 + c * .16 + Math.sin(theta + .7) * .13 + fleck);
    color.lerp(blush, Math.max(0, Math.cos(theta - .8)) ** 5 * s * .18);
    return {point:[-radius * Math.cos(theta) + .009 * s * s, .34 * c - topDimple + baseDimple, radius * Math.sin(theta) * .96], color};
  });
}

export function createCucumberGeometry() {
  const green = new T.Color('#6b8956'), stripe = new T.Color('#a0af76');
  return fruitSurface(36, 32, (theta, phi) => {
    const t = Math.cos(phi);
    const section = Math.sqrt(Math.max(0, 1 - Math.abs(t) ** 5));
    const ridge = 1 + .027 * Math.cos(theta * 7 + t * .35);
    const pebbles = Math.sin(theta * 19 + t * 41) * Math.sin(theta * 13 - t * 37) * .006;
    const radius = .245 * section * ridge * (1 - .12 * t) + pebbles * section;
    const color = mix(green, stripe, .15 + .12 * Math.cos(theta * 7 + t * .35) + .1 * t);
    return {point:[radius * Math.cos(theta) + .085 * (1 - t * t), radius * Math.sin(theta), t * .94], color};
  });
}

export function createLemonGeometry() {
  const yellow = new T.Color('#d8c77e'), pale = new T.Color('#e5daa4');
  return fruitSurface(40, 28, (theta, phi) => {
    const t = Math.cos(phi), s = Math.sin(phi);
    const tip = .062 * Math.sign(t) * Math.abs(t) ** 12;
    const pores = .003 * Math.sin(theta * 27 + phi * 51) * Math.sin(theta * 31 - phi * 29);
    const radius = (.325 + pores) * s * (1 + .02 * Math.cos(theta * 5));
    return {point:[.45 * t + tip, radius * Math.cos(theta), radius * Math.sin(theta) * .94], color:mix(yellow, pale, .35 + .16 * Math.sin(theta) + pores * 8)};
  });
}

export function createCarrotGeometry() {
  const profile = [new T.Vector2(0, -.7)];
  for (let i = 1; i <= 26; i++) {
    const t = i / 26;
    const radius = .19 * Math.sin(t * Math.PI / 2) ** .92 * (1 - .1 * t);
    profile.push(new T.Vector2(radius * (1 - .016 * Math.sin(t * 67) ** 12), -.7 + t * 1.1));
  }
  profile.push(new T.Vector2(.155, .455), new T.Vector2(.1, .477), new T.Vector2(0, .48));
  const geometry = new T.LatheGeometry(profile, 32);
  const position = geometry.attributes.position, colors = [];
  const orange = new T.Color('#cf9868'), pale = new T.Color('#deb28a');
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i), t = (y + .7) / 1.18;
    const theta = Math.atan2(position.getZ(i), position.getX(i));
    position.setX(i, position.getX(i) + .038 * (1 - t) ** 2);
    const growth = Math.sin(t * 67 + Math.sin(theta * 3) * .25) ** 14;
    const color = mix(orange, pale, .24 + t * .12 + .08 * Math.sin(theta) - growth * .12);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

// A pointed, gently folded leaf with a raised midrib, rather than an ellipsoid.
export function createLeafGeometry() {
  const positions = [], uvs = [], indices = [];
  const rows = 16, columns = 8;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows, z = t * 2 - 1;
    const width = Math.sin(Math.PI * t) ** .85 * .38;
    for (let column = 0; column <= columns; column++) {
      const across = column / columns * 2 - 1;
      positions.push(across * width, .12 * Math.sin(Math.PI * t) * (1 - Math.abs(across)) + .13 * z * z + .035 * across * z, z);
      uvs.push(column / columns, t);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column, b = a + 1, c = a + columns + 1;
        indices.push(a, c, b, b, c, c + 1);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

export function createLeafVeinGeometry() {
  const points = Array.from({length: 9}, (_, i) => {
    const t = i / 8, z = t * 2 - 1;
    return new T.Vector3(0, .12 * Math.sin(Math.PI * t) + .13 * z * z + .008, z);
  });
  return new T.TubeGeometry(new T.CatmullRomCurve3(points), 16, .011, 5, false);
}
