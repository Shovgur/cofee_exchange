'use client';

import { useEffect, useRef, useState } from 'react';
import { Locate, LocateFixed } from 'lucide-react';
import type { CoffeeShop } from '@/types';

interface Props {
  shops: CoffeeShop[];
  onShopClick: (shop: CoffeeShop) => void;
  center: [number, number];
}

type LeafletMap = { remove(): void; setView(c: [number, number], z: number): void };

export default function MapView({ shops, onShopClick, center }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const userMarkerRef = useRef<{ remove(): void } | null>(null);
  const shopMarkersRef = useRef<{ remove(): void }[]>([]);
  const onShopClickRef = useRef(onShopClick);
  onShopClickRef.current = onShopClick;

  const [locating, setLocating] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const el = mapRef.current;
    if (!el) return;

    import('leaflet').then((L) => {
      if (cancelled) return;

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const container = el as HTMLElement & { _leaflet_id?: number };
      if (container._leaflet_id) {
        return;
      }

      const map = L.map(el, {
        center,
        zoom: 12,
        zoomControl: false,
        /* Своя атрибуция: без HTML-ссылок (у ссылок браузер может показывать чужие favicon/флаги) */
        attributionControl: false,
      }) as unknown as LeafletMap;

      if (cancelled) {
        map.remove();
        return;
      }

      mapInstanceRef.current = map;

      /* Тёмная подложка на данных OSM (Carto); атрибуция только текстом */
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '',
        maxZoom: 19,
      }).addTo(map as never);

      L.control
        .attribution({ prefix: false })
        .addAttribution('© OpenStreetMap © CARTO')
        .addTo(map as never);

      const orangeIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:36px;height:36px;border-radius:50% 50% 50% 0;
          background:#FF6B35;transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 10px rgba(255,107,53,0.6);border:2px solid white;
        "></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const markers: { remove(): void }[] = [];
      shops.forEach((shop) => {
        const marker = L.marker([shop.lat, shop.lng], { icon: orangeIcon }).addTo(map as never);
        marker.on('click', () => onShopClickRef.current(shop));
        markers.push(marker as unknown as { remove(): void });
      });
      shopMarkersRef.current = markers;
    });

    return () => {
      cancelled = true;
      shopMarkersRef.current.forEach((m) => {
        try {
          m.remove();
        } catch {
          /* noop */
        }
      });
      shopMarkersRef.current = [];
      if (userMarkerRef.current) {
        try {
          userMarkerRef.current.remove();
        } catch {
          /* noop */
        }
        userMarkerRef.current = null;
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          /* noop */
        }
        mapInstanceRef.current = null;
      }
    };
  }, [center, shops]);

  function handleLocate() {
    if (!navigator.geolocation) {
      setLocationError('Геолокация не поддерживается браузером');
      return;
    }

    setLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocating(false);
        setHasLocation(true);

        import('leaflet').then((L) => {
          const map = mapInstanceRef.current;
          if (!map) return;

          if (userMarkerRef.current) {
            try {
              userMarkerRef.current.remove();
            } catch {
              /* noop */
            }
          }

          const userIcon = L.divIcon({
            className: '',
            html: `
              <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
                <div style="
                  position:absolute;width:24px;height:24px;border-radius:50%;
                  background:rgba(59,130,246,0.25);
                  animation:pulse-ring 2s cubic-bezier(0.455,0.03,0.515,0.955) infinite;
                "></div>
                <div style="
                  position:absolute;width:14px;height:14px;border-radius:50%;
                  background:#3B82F6;border:2.5px solid white;
                  box-shadow:0 0 0 2px rgba(59,130,246,0.5);
                "></div>
              </div>
              <style>
                @keyframes pulse-ring{0%{transform:scale(0.8);opacity:1}80%,100%{transform:scale(2.2);opacity:0}}
              </style>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const marker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 });
          marker.addTo(map as never);
          userMarkerRef.current = marker as unknown as { remove(): void };

          map.setView([lat, lng], 15);
        });
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) setLocationError('Доступ к геолокации запрещён');
        else if (err.code === 2) setLocationError('Местоположение недоступно');
        else setLocationError('Не удалось определить местоположение');
        setTimeout(() => setLocationError(''), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full z-0" style={{ background: '#1a1a2e' }} />

      <div className="absolute bottom-20 right-4 lg:bottom-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          title="Моё местоположение"
          className="w-11 h-11 rounded-2xl bg-surface/95 backdrop-blur-md border border-border flex items-center justify-center shadow-lg hover:bg-surface-el transition-colors disabled:opacity-50"
        >
          {locating ? (
            <span className="w-5 h-5 border-2 border-white/20 border-t-orange rounded-full animate-spin" />
          ) : hasLocation ? (
            <LocateFixed size={18} className="text-orange" />
          ) : (
            <Locate size={18} className="text-muted" />
          )}
        </button>
      </div>

      {locationError && (
        <div className="absolute bottom-28 lg:bottom-20 left-1/2 -translate-x-1/2 z-30 bg-danger/90 text-white text-xs px-4 py-2 rounded-xl shadow-lg max-w-[90vw] text-center">
          {locationError}
        </div>
      )}
    </div>
  );
}
