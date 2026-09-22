'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  adminGetStore,
  adminPatchStore,
  type AdminStore,
  type StoreWorkingHours,
} from '@/lib/api/loyalty/stores';
import { loyaltyUploadMedia } from '@/lib/api/loyalty/client';
import WorkingHoursEditor, { normalizeWorkingHours } from '@/components/admin/stores/WorkingHoursEditor';
import AddressSuggestInput from '@/components/admin/stores/AddressSuggestInput';
import { geocodeAddress } from '@/lib/geocode';

export default function AdminStorePage({ params }: { params: { storeId: string } }) {
  const { storeId } = params;
  const router = useRouter();
  const [store, setStore] = useState<AdminStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [workingHours, setWorkingHours] = useState<StoreWorkingHours>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await adminGetStore(storeId);
      setStore(s);
      setName(s.name ?? '');
      setDescription(s.description ?? '');
      setAddress(s.address ?? '');
      setPhone(s.phone ?? '');
      setLat(s.latitude != null ? String(s.latitude) : '');
      setLng(s.longitude != null ? String(s.longitude) : '');
      setWorkingHours(normalizeWorkingHours(s.working_hours));
      setPhotos(s.photos ?? []);
      setIsPublished(s.is_published);
      setIsActive(s.is_active);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let latitude = lat ? Number(lat) : undefined;
      let longitude = lng ? Number(lng) : undefined;
      if ((latitude == null || longitude == null) && address.trim()) {
        const geo = await geocodeAddress(address.trim());
        if (geo) {
          latitude = geo.lat;
          longitude = geo.lng;
          setLat(String(geo.lat));
          setLng(String(geo.lng));
        } else if (isPublished) {
          setError(
            'Не удалось определить координаты по адресу. Выберите адрес из подсказок или укажите широту и долготу — без них кофейня не появится на карте.',
          );
          setSaving(false);
          return;
        }
      }

      const updated = await adminPatchStore(storeId, {
        name,
        description,
        address,
        phone,
        latitude,
        longitude,
        working_hours: workingHours,
        photos,
        is_published: isPublished,
        is_active: isActive,
      });
      setStore(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    const out = await loyaltyUploadMedia('stores', file);
    setPhotos((prev) => [...prev, out.url]);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-muted" />
      </div>
    );
  }

  if (!store) {
    return <div className="p-8 text-danger">{error ?? 'Не найдено'}</div>;
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <button
        type="button"
        onClick={() => router.push('/admin/stores')}
        className="flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> К списку
      </button>

      <div>
        <h1 className="text-2xl font-bold">{name || 'Кофейня'}</h1>
        <p className="text-xs text-muted font-mono mt-1">{store.external_id}</p>
        {store.pos_name && (
          <p className="text-xs text-muted mt-2">С кассы: {store.pos_name} · {store.pos_address}</p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <Field label="Название" value={name} onChange={setName} />
        <Field label="Описание" value={description} onChange={setDescription} multiline />
        <AddressSuggestInput
          value={address}
          onChange={setAddress}
          onPick={(pick) => {
            setAddress(pick.label);
            setLat(String(pick.lat));
            setLng(String(pick.lng));
          }}
        />
        <Field label="Телефон" value={phone} onChange={setPhone} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Широта" value={lat} onChange={setLat} />
          <Field label="Долгота" value={lng} onChange={setLng} />
        </div>
        {!lat || !lng ? (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            Без координат точка не отображается на карте в приложении. Выберите адрес из подсказок.
          </p>
        ) : null}

        <WorkingHoursEditor value={workingHours} onChange={setWorkingHours} />

        <div>
          <label className="block text-sm font-medium mb-2">Фото</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {photos.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />
            ))}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm text-muted hover:border-orange/50">
            <Upload size={14} />
            Загрузить
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadPhoto(f).catch(() => setError('Ошибка загрузки файла'));
              }}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
          Показывать в приложении (опубликована)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Активна
        </label>

        <Button onClick={handleSave} disabled={saving} className="flex w-full items-center justify-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Сохранить
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
        />
      )}
    </div>
  );
}
