// Map support: approximate centre of each country in taxonomy COUNTRIES (no
// geocoding needed), and the Google Maps JavaScript API loader.

export const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  Azərbaycan: { lat: 40.14, lng: 47.58 },
  ABŞ: { lat: 39.83, lng: -98.58 },
  Almaniya: { lat: 51.17, lng: 10.45 },
  Avstriya: { lat: 47.52, lng: 14.55 },
  Belçika: { lat: 50.5, lng: 4.47 },
  Bolqarıstan: { lat: 42.73, lng: 25.49 },
  'Böyük Britaniya': { lat: 54.0, lng: -2.0 },
  Çexiya: { lat: 49.82, lng: 15.47 },
  Çin: { lat: 35.86, lng: 104.2 },
  Estoniya: { lat: 58.6, lng: 25.01 },
  Fransa: { lat: 46.23, lng: 2.21 },
  Gürcüstan: { lat: 42.32, lng: 43.36 },
  Xorvatiya: { lat: 45.1, lng: 15.2 },
  İspaniya: { lat: 40.46, lng: -3.75 },
  İsveçrə: { lat: 46.82, lng: 8.23 },
  İtaliya: { lat: 41.87, lng: 12.57 },
  Latviya: { lat: 56.88, lng: 24.6 },
  Litva: { lat: 55.17, lng: 23.88 },
  Macarıstan: { lat: 47.16, lng: 19.5 },
  Moldova: { lat: 47.41, lng: 28.37 },
  Niderland: { lat: 52.13, lng: 5.29 },
  Polşa: { lat: 51.92, lng: 19.15 },
  Portuqaliya: { lat: 39.4, lng: -8.22 },
  Rumıniya: { lat: 45.94, lng: 24.97 },
  // European Russia (Moscow region) rather than the geographic centre in Siberia.
  Rusiya: { lat: 55.75, lng: 37.62 },
  Serbiya: { lat: 44.02, lng: 21.01 },
  Slovakiya: { lat: 48.67, lng: 19.7 },
  Sloveniya: { lat: 46.15, lng: 14.99 },
  Türkiyə: { lat: 38.96, lng: 35.24 },
  Ukrayna: { lat: 48.38, lng: 31.17 },
  Yunanıstan: { lat: 39.07, lng: 21.82 },
};

/** Browser key for the Maps JavaScript API (restrict it to the site's domains in Google Cloud). */
const MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '';
export const hasMapsKey = MAPS_KEY !== '';

// The Maps API has no bundled types here; it's used through this loose alias.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GoogleMaps = any;

let loading: Promise<GoogleMaps> | null = null;

/** Loads the Maps JavaScript API once; resolves with `google.maps`. */
export function loadGoogleMaps(): Promise<GoogleMaps> {
  const w = window as unknown as Record<string, unknown> & { google?: { maps?: GoogleMaps } };
  if (!hasMapsKey) return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set'));
  if (w.google?.maps?.Map) return Promise.resolve(w.google.maps);
  loading ??= new Promise((resolve, reject) => {
    const callback = '__openlyMapsReady';
    w[callback] = () => resolve(w.google!.maps);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_KEY)}&callback=${callback}&loading=async&v=weekly`;
    script.async = true;
    script.onerror = () => {
      loading = null;
      reject(new Error('Google Maps failed to load'));
    };
    document.head.appendChild(script);
  });
  return loading;
}
