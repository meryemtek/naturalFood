import { AddressLocationFields } from '../../components/address/AddressLocationFields';
import { useEffect, useState, type FormEvent } from 'react';
import { accountApi, type Address, type AddressInput } from '../../api/accountApi';

const emptyAddress: AddressInput = { title: '', recipientName: '', phone: '', city: '', district: '', neighborhood: '', fullAddress: '', postalCode: '', isDefault: false, isBillingAddress: false, companyName: '', taxOffice: '', taxNumber: '' };

export function AccountAddresses() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [form, setForm] = useState<AddressInput>(emptyAddress);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => setAddresses(await accountApi.addresses());
  useEffect(() => { let active = true; accountApi.addresses().then(data => { if (active) setAddresses(data); }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Adresler yüklenemedi.'); }); return () => { active = false; }; }, []);
  const set = (key: keyof AddressInput, value: string | boolean) => setForm(previous => ({ ...previous, [key]: value }));
  const save = async (event: FormEvent) => { event.preventDefault(); if (![form.city, form.district, form.neighborhood].every(value => value?.trim())) { setError('İl, ilçe ve mahalle seçin.'); return; } setBusy(true); setError(''); try { await accountApi.saveAddress(form, editing ?? undefined); await load(); setOpen(false); setEditing(null); setForm(emptyAddress); } catch (e) { setError(e instanceof Error ? e.message : 'Adres kaydedilemedi.'); } finally { setBusy(false); } };
  const remove = async (id: string) => { if (!window.confirm('Bu adresi silmek istiyor musunuz?')) return; setBusy(true); setError(''); try { await accountApi.deleteAddress(id); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Adres silinemedi.'); } finally { setBusy(false); } };
  const edit = (address: Address) => { const { id, ...values } = address; setForm(values); setEditing(id); setOpen(true); };
  const newAddress = () => { setForm(emptyAddress); setEditing(null); setOpen(true); };
  return <><div className="account-heading"><div><h1>Kayıtlı Adreslerim</h1><p>Teslimat ve fatura adreslerinizi yönetin.</p></div><button className="account-primary" onClick={newAddress}>Yeni Adres</button></div>
    {error && <p className="account-error" role="alert">{error}</p>}{!addresses && !error && <p className="account-muted">Adresler yükleniyor...</p>}
    {addresses?.length === 0 && !open && <div className="account-card">Henüz kayıtlı adresiniz bulunmuyor.</div>}
    {addresses?.map(address => <section className="account-card" key={address.id}><div className="account-row"><strong>{address.title}</strong><span className="account-tag">{address.isDefault ? 'Varsayılan' : address.isBillingAddress ? 'Fatura' : 'Teslimat'}</span></div><p>{address.recipientName} · {address.phone}</p><p className="account-muted">{[address.fullAddress, address.neighborhood, address.district, address.city, address.postalCode].filter(Boolean).join(', ')}</p><div className="account-actions"><button className="account-outline" onClick={() => edit(address)}>Düzenle</button><button className="account-outline" disabled={busy} onClick={() => remove(address.id)}>Sil</button></div></section>)}
    {open && <section className="account-card"><h2>{editing ? 'Adresi Düzenle' : 'Yeni Adres'}</h2><form className="account-form" onSubmit={save}><div className="account-fields">
      <label>Adres Başlığı<input required maxLength={100} value={form.title} onChange={e => set('title', e.target.value)} /></label><label>Ad Soyad<input required maxLength={200} value={form.recipientName} onChange={e => set('recipientName', e.target.value)} /></label>
      <label>Telefon<input required maxLength={20} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} /></label><div className="account-field-full"><AddressLocationFields value={{ city: form.city, district: form.district, neighborhood: form.neighborhood ?? '' }} onChange={location => setForm(previous => ({ ...previous, ...location }))} /></div>
      <label className="account-field-full">Açık Adres<textarea required maxLength={500} value={form.fullAddress} onChange={e => set('fullAddress', e.target.value)} /></label><label>Posta Kodu<input maxLength={10} value={form.postalCode ?? ''} onChange={e => set('postalCode', e.target.value)} /></label>
      <label className="account-check"><input type="checkbox" checked={form.isDefault} onChange={e => set('isDefault', e.target.checked)} /> Varsayılan adres</label><label className="account-check"><input type="checkbox" checked={form.isBillingAddress} onChange={e => set('isBillingAddress', e.target.checked)} /> Fatura adresi</label>
      {form.isBillingAddress && <><label>Firma Adı<input value={form.companyName ?? ''} onChange={e => set('companyName', e.target.value)} /></label><label>Vergi Dairesi<input value={form.taxOffice ?? ''} onChange={e => set('taxOffice', e.target.value)} /></label><label>Vergi Numarası<input maxLength={20} value={form.taxNumber ?? ''} onChange={e => set('taxNumber', e.target.value)} /></label></>}
    </div><div className="account-actions"><button type="button" className="account-outline" onClick={() => setOpen(false)}>Vazgeç</button><button className="account-primary" disabled={busy} type="submit">Adresi Kaydet</button></div></form></section>}
  </>;
}
