import { startCase, camelCase } from "es-toolkit/compat";

export function asTitle(str: string): string {
  return startCase(camelCase(str));
}

export function pluraliseWithCount(count: number, singularText: string, pluralText?: string): string {
  return `${count} ${pluralise(count, singularText, pluralText)}`;
}

export function pluralise(count: number, singularText: string, pluralText?: string): string {
  return count === 1 ? singularText : pluralText || (singularText + 's');
}

export function formatLatLong(latLong: number[] | { lat: number; lng: number } | null): string {
  if (!latLong) return '';

  let lat: number, lng: number;
  if (Array.isArray(latLong)) {
    [lat, lng] = latLong;
  } else {
    lat = latLong.lat;
    lng = latLong.lng;
  }

  if (typeof lat !== 'number' || typeof lng !== 'number') return '';

  return `lat: ${lat.toFixed(5)}, long: ${lng.toFixed(5)}`;
}

export const colours = {
  blueCar: 'rgb(34 93 173)',
  greyCar: 'rgb(204 205 207)',
  redCar: 'rgb(238 25 29)',
  osMapsPurple: '#453c90',
  osMapsPink: '#d40058',
};

const isDev = process.env.NODE_ENV === "development";

export const log = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug('[DEBUG]', ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info('[INFO]', ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
};
