// Map support: approximate centre of each country in taxonomy COUNTRIES (no
// geocoding needed), and Leaflet tile layer configurations.

export const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  Azərbaycan: { lat: 40.14, lng: 47.58 },
  Almaniya: { lat: 51.17, lng: 10.45 },
  Avstriya: { lat: 47.52, lng: 14.55 },
  Belçika: { lat: 50.5, lng: 4.47 },
  Bolqarıstan: { lat: 42.73, lng: 25.49 },
  Çexiya: { lat: 49.82, lng: 15.47 },
  Estoniya: { lat: 58.6, lng: 25.01 },
  Fransa: { lat: 46.23, lng: 2.21 },
  Gürcüstan: { lat: 42.32, lng: 43.36 },
  Xorvatiya: { lat: 45.1, lng: 15.2 },
  İspaniya: { lat: 40.46, lng: -3.75 },
  İtaliya: { lat: 41.87, lng: 12.57 },
  Latviya: { lat: 56.88, lng: 24.6 },
  Litva: { lat: 55.17, lng: 23.88 },
  Macarıstan: { lat: 47.16, lng: 19.5 },
  Niderland: { lat: 52.13, lng: 5.29 },
  Polşa: { lat: 51.92, lng: 19.15 },
  Portuqaliya: { lat: 39.4, lng: -8.22 },
  Rumıniya: { lat: 45.94, lng: 24.97 },
  Serbiya: { lat: 44.02, lng: 21.01 },
  Slovakiya: { lat: 48.67, lng: 19.7 },
  Sloveniya: { lat: 46.15, lng: 14.99 },
  Türkiyə: { lat: 38.96, lng: 35.24 },
  Ukrayna: { lat: 48.38, lng: 31.17 },
  Yunanıstan: { lat: 39.07, lng: 21.82 },
};

export interface TileConfig {
  url: string;
  attribution: string;
  subdomains?: string;
  maxZoom: number;
}

export const TILE_LAYERS: Record<string, TileConfig> = {
  clean: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  },
  standard: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery',
    maxZoom: 18,
  },
  terrain: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
};
