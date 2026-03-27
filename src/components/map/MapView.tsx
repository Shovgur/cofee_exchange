'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Locate, LocateFixed } from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';
import type { CoffeeShop } from '@/types';

import 'leaflet/dist/leaflet.css';

interface Props {
  shops: CoffeeShop[];
  onShopClick: (shop: CoffeeShop) => void;
  center: [number, number];
}

/* Тёмная подложка на данных OSM (Carto); leaflet.css подключён из npm */
const CARTO_DARK =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

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

  const handleLocate = useCallback(() => {
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
          marker.addTo(map);
          userMarkerRef.current = marker as unknown as { remove(): void };

          map.setView([lat, lng], 15);
          map.invalidateSize({ animate: false });
        });
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) setLocationError('Доступ к геолокации запрещён');
        else if (err.code === 2) setLocationError('Местоположение недоступно');
        else setLocationError('Не удалось определить местоположение');
        setTimeout(() => setLocationError(''), 5000);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    const el = mapRef.current;
    if (!el) return;

    import('leaflet').then((L) => {
      if (cancelled) return;

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
        zoomControl: true,
        attributionControl: false,
      });

      if (cancelled) {
        map.remove();
        return;
      }

      mapInstanceRef.current = map;

      const scheduleInvalidate = () => {
        map.invalidateSize({ animate: false });
      };
      requestAnimationFrame(() => {
        requestAnimationFrame(scheduleInvalidate);
      });
      resizeObserver = new ResizeObserver(scheduleInvalidate);
      resizeObserver.observe(el);

      L.tileLayer(CARTO_DARK, {
        subdomains: 'abcd',
        attribution: '',
        maxZoom: 19,
      }).addTo(map);

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
        const marker = L.marker([shop.lat, shop.lng], { icon: orangeIcon }).addTo(map);
        marker.on('click', () => onShopClickRef.current(shop));
        markers.push(marker as unknown as { remove(): void });
      });
      shopMarkersRef.current = markers;

      scheduleInvalidate();
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
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

  return (
    <div className="relative h-full min-h-0 w-full">
      <div
        ref={mapRef}
        className="z-0 h-full min-h-0 w-full"
        style={{ background: '#0d0d12' }}
      />

      <div className="pointer-events-none absolute inset-0 z-[10060] flex items-end justify-end p-4 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] lg:p-6 lg:pb-6">
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          title="Показать моё местоположение"
          aria-label="Показать моё местоположение на карте"
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface/95 shadow-lg backdrop-blur-md transition-colors hover:bg-surface-el disabled:opacity-50"
        >
          {locating ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-orange" />
          ) : hasLocation ? (
            <LocateFixed size={20} className="text-orange" />
          ) : (
            <Locate size={20} className="text-orange" />
          )}
        </button>
      </div>

      {locationError ? (
        <div className="absolute bottom-[calc(7rem+env(safe-area-inset-bottom,0px))] left-1/2 z-[10060] max-w-[90vw] -translate-x-1/2 rounded-xl bg-danger/95 px-4 py-2.5 text-center text-xs text-white shadow-lg lg:bottom-24">
          {locationError}
        </div>
      ) : null}
    </div>
  );
}
