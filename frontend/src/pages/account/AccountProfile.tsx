import { useState, type FormEvent } from 'react';
import { accountApi } from '../../api/accountApi';
import { authStorage, type CustomerProfile } from '../../api/authApi';

export function AccountProfile({ profile, onUpdate }: { profile: CustomerProfile; onUpdate: (profile: CustomerProfile) => void }) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [phone, setPhone] = useState(profile.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const updated = await accountApi.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() || null });
      authStorage.updateCustomer(updated); onUpdate(updated); setMessage('Bilgileriniz güncellendi.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Bilgiler güncellenemedi.'); }
    finally { setBusy(false); }
  };
  const changePassword = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    if (newPassword !== confirmation) { setError('Yeni şifreler eşleşmiyor.'); return; }
    setBusy(true);
    try {
      const result = await accountApi.changePassword({ currentPassword, newPassword, newPasswordConfirm: confirmation });
      setMessage(result.message); setCurrentPassword(''); setNewPassword(''); setConfirmation('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Şifre değiştirilemedi.'); }
    finally { setBusy(false); }
  };

  return <>
    <div className="account-heading"><div><h1>Hesap Bilgilerim &amp; Güvenlik</h1><p>Kişisel bilgilerinizi ve giriş güvenliğinizi bu ekrandan yönetebilirsiniz.</p></div><span className="material-symbols-outlined">shield_person</span></div>
    {message && <p className="account-notice" role="status">{message}</p>}{error && <p className="account-error" role="alert">{error}</p>}
    <section className="account-card"><h2><span className="material-symbols-outlined">badge</span> Kişisel Bilgiler</h2>
      <div className="account-profile-summary"><span className="account-avatar material-symbols-outlined">person</span><div><strong>{profile.firstName} {profile.lastName}</strong><p>Üyelik bilgileriniz</p></div></div>
      <form onSubmit={update} className="account-form"><div className="account-fields">
        <label>Adınız<input value={firstName} onChange={e => setFirstName(e.target.value)} required maxLength={100} autoComplete="given-name" /></label>
        <label>Soyadınız<input value={lastName} onChange={e => setLastName(e.target.value)} required maxLength={100} autoComplete="family-name" /></label>
        <label>E-posta Adresi<input value={profile.email} readOnly type="email" /></label>
        <label>Cep Telefonu<input value={phone} onChange={e => setPhone(e.target.value)} maxLength={20} type="tel" autoComplete="tel" /></label>
      </div><div className="account-actions"><button disabled={busy} className="account-primary" type="submit">Kişisel Bilgileri Güncelle</button></div></form>
    </section>
    <section className="account-card"><h2><span className="material-symbols-outlined">password</span> Giriş ve Şifre Güvenliği</h2>
      <form onSubmit={changePassword} className="account-form"><div className="account-fields account-fields--three">
        <label>Mevcut Şifreniz<input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" autoComplete="current-password" required /></label>
        <label>Yeni Şifre<input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" autoComplete="new-password" minLength={8} required /></label>
        <label>Yeni Şifre (Tekrar)<input value={confirmation} onChange={e => setConfirmation(e.target.value)} type="password" autoComplete="new-password" minLength={8} required /></label>
      </div><p className="account-hint">En az 8 karakter, büyük harf, küçük harf ve rakam kullanın.</p><div className="account-actions"><button disabled={busy} className="account-outline" type="submit">Şifreyi Değiştir</button></div></form>
    </section>
    <section className="account-card"><h2><span className="material-symbols-outlined">phonelink_lock</span> İki Adımlı Doğrulama</h2><p className="account-muted">İki adımlı doğrulama henüz kullanıma sunulmadı.</p></section>
  </>;
}
