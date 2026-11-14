import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { StorefrontHeader } from '../../components/storefront/StorefrontHeader';
import { AuthFooter } from '../../components/auth/AuthFooter';
import { AuthIcon } from '../../components/auth/AuthIcon';
import { AuthPasswordField } from '../../components/auth/AuthPasswordField';
import { AuthField } from '../../components/auth/AuthField';
import { authApi } from '../../api/authApi';
import './AuthPage.css';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Geçersiz şifre sıfırlama bağlantısı. Lütfen tekrar talep oluşturun.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }

    setBusy(true);
    try {
      const res = await authApi.resetPassword({
        token,
        email: email.trim(),
        newPassword,
        newPasswordConfirm,
      });
      setSuccess(res.message || 'Şifreniz başarıyla sıfırlandı.');
      setTimeout(() => navigate('/giris', { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre sıfırlanamadı.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page min-h-screen bg-background font-['Plus_Jakarta_Sans'] text-on-surface">
      <StorefrontHeader />
      <main className="mx-auto flex w-full max-w-[540px] flex-col px-4 py-10 sm:px-6">
        <div className="mb-6">
          <Link to="/giris" className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary">
            <AuthIcon>arrow_back</AuthIcon>
            <span>Giriş Ekranına Dön</span>
          </Link>
        </div>

        <section className="rounded-2xl border border-secondary/20 bg-surface-container-lowest p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-bold text-primary sm:text-2xl">Yeni Şifre Belirle</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Hesabınız için güçlü ve yeni bir şifre belirleyin.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <AuthField
              id="reset-email"
              label="E-posta Adresi"
              icon="alternate_email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="ornek@mail.com"
              autoComplete="email"
            />
            <AuthPasswordField
              id="reset-new-password"
              label="Yeni Şifre"
              value={newPassword}
              onChange={setNewPassword}
              visible={showPassword}
              onToggleVisibility={() => setShowPassword(v => !v)}
              autoComplete="new-password"
              minLength={8}
              description="En az 8 karakter; büyük harf, küçük harf ve rakam içermelidir."
            />
            <AuthPasswordField
              id="reset-new-password-confirm"
              label="Yeni Şifre Tekrarı"
              value={newPasswordConfirm}
              placeholder="Şifrenizi tekrar girin"
              onChange={setNewPasswordConfirm}
              visible={showPassword}
              onToggleVisibility={() => setShowPassword(v => !v)}
              autoComplete="new-password"
              showVisibilityToggle={false}
            />

            {error && (
              <div role="alert" className="rounded-lg border border-error/20 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
                {error}
              </div>
            )}
            {success && (
              <div role="status" className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                {success} Giriş sayfasına yönlendiriliyorsunuz…
              </div>
            )}

            <button
              disabled={busy || !token}
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary-container text-base font-bold text-on-primary shadow-sm transition-colors hover:bg-primary disabled:opacity-60"
            >
              <span>{busy ? 'Kaydediliyor…' : 'Şifremi Güncelle'}</span>
              <AuthIcon>{busy ? 'progress_activity' : 'check_circle'}</AuthIcon>
            </button>
          </form>
        </section>
      </main>
      <AuthFooter />
    </div>
  );
}
