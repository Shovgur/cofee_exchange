import type { TileLayerOptions } from 'leaflet';

/**
 * Подложка карты. Carto CDN без ключа отдаёт размытую карту с водяным знаком «API key required».
 * По умолчанию — OpenStreetMap. Для светлой темы Carto: NEXT_PUBLIC_CARTO_API_KEY в Vercel.
 * Свой URL: NEXT_PUBLIC_MAP_TILE_URL (шаблон Leaflet {z}/{x}/{y}).
 */
export function getMapTileConfig(): { url: string; options: TileLayerOptions } {
  const custom = process.env.NEXT_PUBLIC_MAP_TILE_URL?.trim();
  if (custom) {
    return {
      url: custom,
      options: {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      },
    };
  }

  const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim();
  if (cartoKey) {
    return {
      url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?api_key=${encodeURIComponent(cartoKey)}`,
      options: {
        subdomains: 'abcd',
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a> &copy; OpenStreetMap',
      },
    };
  }

  return {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    },
  };
}
