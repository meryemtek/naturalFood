import { useEffect, useState } from 'react';
import { locations, type Location } from '../../api/addressApi';
export interface AddressLocation { city: string; district: string; neighborhood: string }
export function AddressLocationFields({ value, onChange }: { value: AddressLocation; onChange: (value: AddressLocation) => void }) {
  const [cities, setCities] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Location[]>([]);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const cityId = cities.find(city => city.name === value.city)?.id;
  const districtId = districts.find(district => district.name === value.district)?.id;
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    locations('provinces', controller.signal).then(setCities).catch(() => { if (!controller.signal.aborted) setError('İl listesi yüklenemedi.'); });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    const controller = new AbortController();
    setDistricts([]); setNeighborhoods([]);
    if (cityId) locations(`provinces/${cityId}/districts`, controller.signal).then(setDistricts).catch(() => { if (!controller.signal.aborted) setError('İlçe listesi yüklenemedi.'); });
    return () => controller.abort();
  }, [cityId, retry]);
  useEffect(() => {
    const controller = new AbortController();
    setNeighborhoods([]);
    if (districtId) locations(`districts/${districtId}/neighborhoods`, controller.signal).then(setNeighborhoods).catch(() => { if (!controller.signal.aborted) setError('Mahalle listesi yüklenemedi.'); });
    return () => controller.abort();
  }, [districtId, retry]);
  const inputClass = 'mt-1 w-full rounded-lg border border-secondary/30 bg-white px-3 py-3 text-on-surface';
  return <div className="grid gap-4 sm:grid-cols-2">
    {error && <p role="alert">{error} <button type="button" className="underline" onClick={() => setRetry(n => n + 1)}>Tekrar dene</button></p>}
      <label className="block font-semibold">İl<select className={inputClass} required value={value.city} onChange={event => onChange({ ...value, city: event.target.value, district: '', neighborhood: '' })}><option value="">{cities.length ? "İl seçin" : "İller yükleniyor…"}</option>{value.city && !cities.some(item => item.name === value.city) && <option value={value.city}>{value.city} (kayıtlı)</option>}{cities.map(city => <option key={city.id} value={city.name}>{city.name}</option>)}</select></label>
      <label className="block font-semibold">İlçe<select className={inputClass} required disabled={!cityId} value={value.district} onChange={event => onChange({ ...value, district: event.target.value, neighborhood: '' })}><option value="">{!cityId ? "Önce il seçin" : districts.length ? "İlçe seçin" : "İlçeler yükleniyor…"}</option>{value.district && !districts.some(item => item.name === value.district) && <option value={value.district}>{value.district} (kayıtlı)</option>}{districts.map(district => <option key={district.id} value={district.name}>{district.name}</option>)}</select></label>
      <label className="block font-semibold">Mahalle / Köy<select className={inputClass} required disabled={!districtId} value={value.neighborhood} onChange={event => onChange({ ...value, neighborhood: event.target.value })}><option value="">{!districtId ? "Önce ilçe seçin" : neighborhoods.length ? "Mahalle / köy seçin" : "Mahalleler yükleniyor…"}</option>{value.neighborhood && !neighborhoods.some(item => item.name === value.neighborhood) && <option value={value.neighborhood}>{value.neighborhood} (kayıtlı)</option>}{neighborhoods.map(neighborhood => <option key={neighborhood.id} value={neighborhood.name}>{neighborhood.name}</option>)}</select></label>
  </div>;
}
