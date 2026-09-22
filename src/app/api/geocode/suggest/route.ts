import { NextRequest, NextResponse } from 'next/server';

interface NominatimItem {
  display_name: string;
  lat: string;
  lon: string;
}

/** Подсказки адреса для админки (прокси к OpenStreetMap Nominatim). */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 3) {
    return NextResponse.json([]);
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '6');
  url.searchParams.set('countrycodes', 'ru');
  url.searchParams.set('q', q);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CoffeeExchange/1.0 (store admin; contact@coffeeexchange.ru)',
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json([], { status: 200 });
    }
    const data = (await res.json()) as NominatimItem[];
    const items = data.map((row) => ({
      label: row.display_name,
      lat: Number(row.lat),
      lng: Number(row.lon),
    })).filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lng));

    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}
