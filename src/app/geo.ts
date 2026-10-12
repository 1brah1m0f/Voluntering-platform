// Map support: approximate centre of each country in taxonomy COUNTRIES (no
// geocoding needed), and truly open, keyless tile layers.

export const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  // Azərbaycan və Qonşular
  Azərbaycan: { lat: 40.14, lng: 47.58 },
  Azerbaijan: { lat: 40.14, lng: 47.58 },
  Türkiyə: { lat: 38.96, lng: 35.24 },
  Turkey: { lat: 38.96, lng: 35.24 },
  Türkiye: { lat: 38.96, lng: 35.24 },
  Gürcüstan: { lat: 42.32, lng: 43.36 },
  Georgia: { lat: 42.32, lng: 43.36 },
  Ukrayna: { lat: 48.38, lng: 31.17 },
  Ukraine: { lat: 48.38, lng: 31.17 },

  // Qərbi və Mərkəzi Avropa
  Almaniya: { lat: 51.17, lng: 10.45 },
  Germany: { lat: 51.17, lng: 10.45 },
  Fransa: { lat: 46.23, lng: 2.21 },
  France: { lat: 46.23, lng: 2.21 },
  İtaliya: { lat: 41.87, lng: 12.57 },
  Italy: { lat: 41.87, lng: 12.57 },
  İspaniya: { lat: 40.46, lng: -3.75 },
  Spain: { lat: 40.46, lng: -3.75 },
  Portuqaliya: { lat: 39.4, lng: -8.22 },
  Portugal: { lat: 39.4, lng: -8.22 },
  Niderland: { lat: 52.13, lng: 5.29 },
  Netherlands: { lat: 52.13, lng: 5.29 },
  Belçika: { lat: 50.5, lng: 4.47 },
  Belgium: { lat: 50.5, lng: 4.47 },
  Avstriya: { lat: 47.52, lng: 14.55 },
  Austria: { lat: 47.52, lng: 14.55 },
  İsveçrə: { lat: 46.82, lng: 8.23 },
  Switzerland: { lat: 46.82, lng: 8.23 },
  Lüksemburq: { lat: 49.81, lng: 6.13 },
  Luxembourg: { lat: 49.81, lng: 6.13 },
  İrlandiya: { lat: 53.41, lng: -8.24 },
  Ireland: { lat: 53.41, lng: -8.24 },
  'Böyük Britaniya': { lat: 55.37, lng: -3.43 },
  'United Kingdom': { lat: 55.37, lng: -3.43 },
  UK: { lat: 55.37, lng: -3.43 },

  // Şimali Avropa (Skandinaviya & Baltik)
  İsveç: { lat: 60.12, lng: 18.64 },
  Sweden: { lat: 60.12, lng: 18.64 },
  Norveç: { lat: 60.47, lng: 8.46 },
  Norway: { lat: 60.47, lng: 8.46 },
  Danimarka: { lat: 56.26, lng: 9.5 },
  Denmark: { lat: 56.26, lng: 9.5 },
  Finlandiya: { lat: 61.92, lng: 25.74 },
  Finland: { lat: 61.92, lng: 25.74 },
  İslandiya: { lat: 64.96, lng: -19.02 },
  Iceland: { lat: 64.96, lng: -19.02 },
  Estoniya: { lat: 58.6, lng: 25.01 },
  Estonia: { lat: 58.6, lng: 25.01 },
  Latviya: { lat: 56.88, lng: 24.6 },
  Latvia: { lat: 56.88, lng: 24.6 },
  Litva: { lat: 55.17, lng: 23.88 },
  Lithuania: { lat: 55.17, lng: 23.88 },

  // Şərqi və Mərkəzi Avropa
  Polşa: { lat: 51.92, lng: 19.15 },
  Poland: { lat: 51.92, lng: 19.15 },
  Çexiya: { lat: 49.82, lng: 15.47 },
  'Czech Republic': { lat: 49.82, lng: 15.47 },
  Czechia: { lat: 49.82, lng: 15.47 },
  Slovakiya: { lat: 48.67, lng: 19.7 },
  Slovakia: { lat: 48.67, lng: 19.7 },
  Macarıstan: { lat: 47.16, lng: 19.5 },
  Hungary: { lat: 47.16, lng: 19.5 },
  Rumıniya: { lat: 45.94, lng: 24.97 },
  Romania: { lat: 45.94, lng: 24.97 },
  Bolqarıstan: { lat: 42.73, lng: 25.49 },
  Bulgaria: { lat: 42.73, lng: 25.49 },

  // Balkanlar və Aralıq dənizi
  Yunanıstan: { lat: 39.07, lng: 21.82 },
  Greece: { lat: 39.07, lng: 21.82 },
  Xorvatiya: { lat: 45.1, lng: 15.2 },
  Croatia: { lat: 45.1, lng: 15.2 },
  Sloveniya: { lat: 46.15, lng: 14.99 },
  Slovenia: { lat: 46.15, lng: 14.99 },
  Serbiya: { lat: 44.02, lng: 21.01 },
  Serbia: { lat: 44.02, lng: 21.01 },
  Bosniya: { lat: 43.91, lng: 17.67 },
  'Bosnia and Herzegovina': { lat: 43.91, lng: 17.67 },
  Albaniya: { lat: 41.15, lng: 20.17 },
  Albania: { lat: 41.15, lng: 20.17 },
  'Şimali Makedoniya': { lat: 41.6, lng: 21.74 },
  'North Macedonia': { lat: 41.6, lng: 21.74 },
  Monteneqro: { lat: 42.7, lng: 19.37 },
  Montenegro: { lat: 42.7, lng: 19.37 },
  Kipr: { lat: 35.12, lng: 33.43 },
  Cyprus: { lat: 35.12, lng: 33.43 },
  Malta: { lat: 35.93, lng: 14.37 },

  // Qlobal
  ABŞ: { lat: 37.09, lng: -95.71 },
  'United States': { lat: 37.09, lng: -95.71 },
  USA: { lat: 37.09, lng: -95.71 },
  Kanada: { lat: 56.13, lng: -106.34 },
  Canada: { lat: 56.13, lng: -106.34 },
  Yaponiya: { lat: 36.2, lng: 138.25 },
  Japan: { lat: 36.2, lng: 138.25 },
  'Cənubi Koreya': { lat: 35.9, lng: 127.76 },
  'South Korea': { lat: 35.9, lng: 127.76 },
  Qazaxıstan: { lat: 48.01, lng: 66.92 },
  Kazakhstan: { lat: 48.01, lng: 66.92 },
  Özbəkistan: { lat: 41.37, lng: 64.58 },
  Uzbekistan: { lat: 41.37, lng: 64.58 },
};

export interface TileConfig {
  url: string;
  attribution: string;
  subdomains?: string;
  maxZoom: number;
}

export const TILE_LAYERS: Record<string, TileConfig> = {
  cleanDark: {
    // Native dark tiles; same Esri Canvas service family as the light map.
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, &copy; OpenStreetMap contributors',
    maxZoom: 16,
  },
  clean: {
    // Esri Light Gray Canvas: clean, elegant, completely free without watermark
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Openly',
    maxZoom: 16,
  },
  standard: {
    // Official OpenStreetMap: 100% open and free without watermark
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  satellite: {
    // Esri World Imagery (satellite): free and public
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery',
    maxZoom: 18,
  },
  terrain: {
    // OpenStreetMap standard
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
};
