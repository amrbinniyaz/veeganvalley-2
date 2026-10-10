// Line icons from /icons.svg. Decorative only: give the parent an accessible name.
const SVG = 'http://www.w3.org/2000/svg';

export const iconHTML = name => `<svg class="icon" aria-hidden="true"><use href="/icons.svg#${name}"/></svg>`;

export function icon(name) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG, 'use');
  use.setAttribute('href', `/icons.svg#${name}`);
  svg.append(use);
  return svg;
}
