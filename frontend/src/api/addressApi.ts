/// <reference types="vite/client" />
export type Location = { id: number; name: string };
type LocalLocation = Location & { provinceId?: number; districtId?: number };
type AddressData = { provinces: LocalLocation[]; districts: LocalLocation[]; neighborhoods: LocalLocation[]; villages: LocalLocation[] };
let addressData: Promise<AddressData> | undefined;
function loadAddressData(): Promise<AddressData> {
  if (!addressData) {
    addressData = fetch(`${import.meta.env.BASE_URL}address-data/turkiye-2025.json`).then(response => {
      if (!response.ok) throw new Error('Adres listesi yüklenemedi.');
      return response.json() as Promise<AddressData>;
    }).catch(error => { addressData = undefined; throw error; });
  }
  return addressData;
}
export async function locations(path: string, signal: AbortSignal): Promise<Location[]> {
  // The API's versioned dataset ships with the app, so checkout does not depend on the external service.
  const data = await loadAddressData();
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const parts = path.split('/');
  let result: Location[];
  if (path === 'provinces') result = data.provinces;
  else if (parts[0] === 'provinces') result = data.districts.filter(item => item.provinceId === Number(parts[1]));
  else result = [
    ...data.neighborhoods.filter(item => item.districtId === Number(parts[1])),
    ...data.villages.filter(item => item.districtId === Number(parts[1])).map(item => ({ ...item, id: -item.id, name: `${item.name} Köyü` })),
  ];
  return [...result].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

