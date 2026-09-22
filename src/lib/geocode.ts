export interface AddressSuggestion {
  label: string;
  lat: number;
  lng: number;
}

export async function geocodeAddress(query: string): Promise<AddressSuggestion | null> {
  const res = await fetch(`/api/geocode/suggest?q=${encodeURIComponent(query)}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const list = (await res.json()) as AddressSuggestion[];
  return list[0] ?? null;
}
