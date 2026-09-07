import { CatmullRomCurve3, Vector3, MathUtils } from 'three';

// One continuous camera route; every chapter is a position in the same world.
export const WORLD_STATIONS = [0, 24, 48, 72];
const path = points => new CatmullRomCurve3(points.map(p => new Vector3(...p)), false, 'catmullrom', .35);
export const cameraRoute = path([
  [13, 11, 19], [15, 7.5, 13], [21, 6, 13],
  [31, 8, 13], [36, 7.5, 11], [43, 6.5, 12],
  [55, 7, 14], [61, 6, 12], [67, 6.5, 13],
  [77, 6.5, 14],
]);
export const lookRoute = path([
  [0, 1, 0], [8, 1.8, .4], [16, 1.4, 0],
  [24, 1.4, 0], [32, 1.8, 0], [40, 1.9, 0],
  [48, 2.2, 0], [56, 2.1, 0], [64, 2.5, 0],
  [72, 2.8, 0],
]);
export const appleRoute = path([
  [-1.5, 3.5, 2], [7, 2.6, 2.4], [15, 2.6, 2.3],
  [24, 2.6, 2], [32, 2.7, 1.6], [40, 3.2, 1.2],
  [48, 4.6, 0],
]);
export function flightAt(progress, mobile = false) {
  const p = MathUtils.clamp(progress, 0, 3);
  const position = cameraRoute.getPoint(p / 3);
  const target = lookRoute.getPoint(p / 3);
  if (mobile) position.sub(target).multiplyScalar(1.25).add(target);
  return { position, target };
}
export function smoothRange(value, from, to) {
  return MathUtils.smoothstep(value, from, to);
}
