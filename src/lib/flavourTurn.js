const TAU = Math.PI * 2;
export function createFlavourTurn(angle = 0) {
  return { start: angle, end: (Math.floor(angle / TAU) + 1) * TAU, elapsed: 0 };
}
export function advanceFlavourTurn(turn, dt, immediate = false) {
  turn.elapsed += Math.max(0, dt);
  const progress = immediate ? 1 : Math.min(1, turn.elapsed / 1.15);
  const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
  return {
    angle: turn.start + (turn.end - turn.start) * eased,
    swap: progress >= .5,
    blend: Math.max(0, Math.min(1, (progress - .35) / .35)),
    done: progress === 1,
  };
}
