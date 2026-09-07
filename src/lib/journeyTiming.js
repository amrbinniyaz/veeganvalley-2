export const CHAPTERS = [
  { id: 'the-farm', label: 'The farm' },
  { id: 'the-harvest', label: 'The harvest' },
  { id: 'the-press', label: 'The cold press' },
  { id: 'your-bottle', label: 'Your bottle' },
];
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export function activeChapterAt(scrollLeft, width) {
  return width > 0 ? clamp(Math.round(scrollLeft / width), 0, CHAPTERS.length - 1) : 0;
}
export function chapterScrollPosition(index, width) {
  return clamp(index, 0, CHAPTERS.length - 1) * Math.max(0, width);
}
export function layerOffset(scrollLeft, width, index, depth) {
  return width > 0 ? clamp(scrollLeft / width - index, -1, 1) * depth : 0;
}
