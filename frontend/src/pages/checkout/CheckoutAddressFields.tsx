import { AddressLocationFields } from '../../components/address/AddressLocationFields';

export interface CheckoutAddress {
  recipientName: string;
  city: string;
  district: string;
  neighborhood: string;
  fullAddress: string;
}

export const emptyCheckoutAddress: CheckoutAddress = { recipientName: '', city: '', district: '', neighborhood: '', fullAddress: '' };

export function formatCheckoutAddress(address: CheckoutAddress): string {
  return [address.recipientName, address.fullAddress, address.neighborhood, address.district, address.city]
    .map(value => value.trim()).join(', ');
}

export function CheckoutAddressFields({ title, section, value, onChange }: {
  title: string;
  section: 'shipping' | 'billing';
  value: CheckoutAddress;
  onChange: (value: CheckoutAddress) => void;
}) {
  const inputClass = 'mt-1 w-full rounded-lg border border-secondary/30 bg-white px-3 py-3 text-on-surface';
  return <fieldset className="space-y-4">
    <legend className="text-lg font-bold text-primary">{title}</legend>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block font-semibold">Ad soyad<input className={inputClass} name={`${section}-recipientName`} autoComplete={`${section} name`} required pattern=".*\S.*" maxLength={200} value={value.recipientName} onChange={event => onChange({ ...value, recipientName: event.target.value })} /></label>

    </div>
    <AddressLocationFields value={value} onChange={location => onChange({ ...value, ...location })} />
    <label className="block font-semibold">Açık adres<textarea className={inputClass} name={`${section}-address`} autoComplete={`${section} street-address`} required maxLength={450} rows={3} placeholder="Cadde, sokak, bina ve daire numarası" value={value.fullAddress} onChange={event => onChange({ ...value, fullAddress: event.target.value })} /></label>
  </fieldset>;
}
