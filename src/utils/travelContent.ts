import type { CollectionEntry } from 'astro:content';

type TravelEntry = CollectionEntry<'travel'>;

export function isVisibleTravelEntry(entry: TravelEntry) {
  return entry.data.status === 'published' || entry.data.status === 'placeholder';
}

export function hasTravelFigures(entry: TravelEntry) {
  return /<figure[\s>]/i.test(entry.body);
}

export function isTravelPlaceholder(entry: TravelEntry) {
  return entry.data.status === 'placeholder' || /class=["'][^"']*\btravel-placeholder\b/i.test(entry.body);
}

export function getTravelContentState(entry: TravelEntry) {
  if (isTravelPlaceholder(entry)) return 'placeholder';
  if (hasTravelFigures(entry)) return 'content';
  return entry.data.status;
}
