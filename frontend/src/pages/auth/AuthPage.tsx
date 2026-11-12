import { type FormEvent, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthField } from '../../components/auth/AuthField';
import { AuthFooter } from '../../components/auth/AuthFooter';
import { StorefrontHeader } from '../../components/storefront/StorefrontHeader';
import { AuthIcon } from '../../components/auth/AuthIcon';
import { AuthPasswordField } from '../../components/auth/AuthPasswordField';
import { authApi, authStorage, isAdminRole, type CustomerProfile } from '../../api/authApi';
import './AuthPage.css';

type AuthMode = 'login' | 'register';

export function AuthPage({ initialMode = 'login' }: { initialMode?: AuthMode }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState<CustomerProfile | null>(() => authStorage.getCustomer());

  const returnTo = searchParams.get('returnUrl');
  const continueAfterAuth = (user: CustomerProfile | null) => {
    if (isAdminRole(user?.role)) {
      navigate('/dashboard', { replace: true });
      return;
    }
    const safePath = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes('\\')
      ? returnTo
      : '/';
    navigate(safePath, { replace: true });
  };

  // Zaten giriş yapmış kullanıcı /giris veya /uye-ol sayfasına gelirse rolüne göre yönlendir
  useEffect(() => {
    const path = window.location.pathname;
    if (customer && (path === '/giris' || path === '/uye-ol')) {
      continueAfterAuth(customer);
    }
  }, [customer]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError('');
    setPassword('');
    setPasswordConfirm('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (mode === 'register' && password !== passwordConfirm) {
      setError('Şifreler eşleşmiyor. Lütfen tekrar kontrol edin.');
      return;
    }

    setBusy(true);
    try {
      const auth = mode === 'login'
        ? await authApi.login({ email: email.trim(), password }, rememberMe)
        : await authApi.register({
          email: email.trim(), password, passwordConfirm,
          firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() || undefined,
        }, rememberMe);

      setCustomer(auth.customer);

      // Admin rolü ile giriş yapıldıysa yönetim paneline (/dashboard), müşteri ise anasayfaya yönlendir
      continueAfterAuth(auth.customer);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'İşlem tamamlanamadı. Lütfen tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await authApi.logout();
    setCustomer(null);
    setError('');
    setMode('login');
    setPassword('');
    setPasswordConfirm('');
  };

  return (
    <div className={`auth-page ${mode === 'login' && !customer ? 'auth-page--login' : ''} min-h-screen bg-background font-['Plus_Jakarta_Sans'] text-on-surface`}>
      <StorefrontHeader key={customer?.id ?? 'guest'} />
      <main className="auth-main mx-auto w-full max-w-[1320px] px-4 py-7 sm:px-6 lg:px-12 lg:py-12">
        <div className="auth-breadcrumb mb-8 flex items-center justify-between gap-4">
          <Link to="/products" className="group inline-flex items-center gap-2 text-sm font-semibold text-secondary transition-colors hover:text-primary">
            <AuthIcon className="transition-transform group-hover:-translate-x-1">arrow_back</AuthIcon>
            <span className="underline decoration-secondary/30 underline-offset-4">Alışverişe Geri Dön</span>
          </Link>
          <div className="hidden items-center gap-2 text-xs font-semibold text-on-surface-variant sm:flex">
            <Link to="/">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-primary">{customer ? 'Hesabım' : 'Giriş Yap'}</span>
          </div>
        </div>

        <div className="auth-card-wrap flex justify-center">
          <section className="auth-card-section w-full max-w-[580px]">
            <div className="auth-card relative rounded-2xl border border-secondary/25 bg-surface-container-lowest p-5 shadow-[0_4px_24px_rgba(48,43,37,0.06)] sm:p-8">
              {customer ? (
                <div className="py-6 text-center sm:py-10">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-primary">
                    <AuthIcon className="text-3xl">account_circle</AuthIcon>
                  </div>
                  <h1 className="text-2xl font-bold text-primary">Merhaba, {customer.firstName} {customer.lastName}</h1>
                  <p className="mt-2 text-sm text-on-surface-variant">{customer.email} hesabınızla giriş yaptınız.</p>
                  <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    {isAdminRole(customer.role) && (
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:bg-primary-container"
                      >
                        <AuthIcon>admin_panel_settings</AuthIcon>
                        Yönetim Paneline Git
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-5 py-3 text-sm font-bold text-on-primary hover:bg-primary"
                    >
                      <AuthIcon>storefront</AuthIcon>
                      Anasayfaya Dön
                    </button>
                    <button
                      type="button"
                      onClick={logout}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-secondary/30 px-5 py-3 text-sm font-bold text-secondary hover:bg-surface-container-low"
                    >
                      <AuthIcon>logout</AuthIcon>
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="auth-tabs mb-7 flex rounded-xl border border-secondary/15 bg-surface-container p-1.5" role="tablist" aria-label="Hesap işlemi">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === 'login'}
                      onClick={() => switchMode('login')}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-bold transition-colors sm:text-base ${
                        mode === 'login' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
                      }`}
                    >
                      <AuthIcon>login</AuthIcon>
                      Giriş Yap
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === 'register'}
                      onClick={() => switchMode('register')}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-bold transition-colors sm:text-base ${
                        mode === 'register' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
                      }`}
                    >
                      <AuthIcon>person_add</AuthIcon>
                      Kayıt Ol
                    </button>
                  </div>

                  <div className="auth-intro mb-7">
                    <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl">
                      {mode === 'login' ? 'Köy Sofrasına Giriş Yapın' : 'Köy Sofrasına Katılın'}
                    </h1>
                    <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                      {mode === 'login'
                        ? 'Kayıtlı hesabınızla siparişlerinizi ve sepetinizi yönetin.'
                        : 'Üyeliğinizi oluşturun, yöresel lezzetleri keşfetmeye başlayın.'}
                    </p>
                  </div>

                  <form className="auth-form space-y-5" onSubmit={submit}>
                    {mode === 'register' && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <AuthField id="firstName" label="Ad" icon="person" value={firstName} onChange={setFirstName} placeholder="Adınız" autoComplete="given-name" />
                        <AuthField id="lastName" label="Soyad" icon="person" value={lastName} onChange={setLastName} placeholder="Soyadınız" autoComplete="family-name" />
                      </div>
                    )}
                    <AuthField id="email" label="E-posta Adresi" icon="alternate_email" type="email" value={email} onChange={setEmail} placeholder="ornek@mail.com" autoComplete="email" />
                    {mode === 'register' && (
                      <AuthField id="phone" label="Cep Telefonu (isteğe bağlı)" icon="call" type="tel" value={phone} onChange={setPhone} placeholder="05XX XXX XX XX" autoComplete="tel" required={false} />
                    )}
                    <AuthPasswordField
                      id="auth-password"
                      label="Şifre"
                      value={password}
                      onChange={setPassword}
                      visible={showPassword}
                      onToggleVisibility={() => setShowPassword(value => !value)}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      minLength={mode === 'register' ? 8 : undefined}
                      description={mode === 'register' ? 'En az 8 karakter; büyük harf, küçük harf ve rakam içermelidir.' : undefined}
                      rightAction={mode === 'login' && (
                        <button type="button" onClick={() => setError('Şifre sıfırlama e-posta hizmeti henüz etkinleştirilmedi. Lütfen destek ekibiyle iletişim kurun.')} className="text-xs font-bold text-primary underline underline-offset-2 hover:text-primary-container">
                          Şifremi Unuttum?
                        </button>
                      )}
                    />
                    {mode === 'register' && (
                      <AuthPasswordField
                        id="auth-password-confirm"
                        label="Şifre Tekrarı"
                        value={passwordConfirm}
                        placeholder="Şifrenizi tekrar girin"
                        onChange={setPasswordConfirm}
                        visible={showPassword}
                        onToggleVisibility={() => setShowPassword(value => !value)}
                        autoComplete="new-password"
                        showVisibilityToggle={false}
                      />
                    )}

                    {mode === 'login' && (
                      <label className="flex cursor-pointer select-none items-center gap-2.5 pt-1 text-sm text-on-surface">
                        <input
                          checked={rememberMe}
                          onChange={event => setRememberMe(event.target.checked)}
                          className="h-5 w-5 cursor-pointer rounded border-secondary/40 bg-surface-container-low text-primary focus:ring-primary focus:ring-offset-0"
                          type="checkbox"
                        />
                        Bu cihazda beni hatırla
                      </label>
                    )}

                    {error && (
                      <div role="alert" className="rounded-lg border border-error/20 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
                        {error}
                      </div>
                    )}

                    <button
                      disabled={busy}
                      className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary-container text-base font-bold text-on-primary shadow-sm transition-colors hover:bg-primary active:translate-y-px disabled:cursor-wait disabled:opacity-65"
                      type="submit"
                    >
                      <span>{busy ? 'Lütfen bekleyin…' : mode === 'login' ? 'Giriş Yap' : 'Hesabımı Oluştur'}</span>
                      <AuthIcon>{busy ? 'progress_activity' : 'arrow_forward'}</AuthIcon>
                    </button>
                  </form>

                  {mode === 'login' && (
                    <div className="auth-social">
                      <div className="auth-divider relative my-7">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-surface-container-highest" />
                        </div>
                        <div className="relative flex justify-center text-xs font-semibold">
                          <span className="bg-surface-container-lowest px-4 text-on-surface-variant">veya hızlı giriş yap</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {['Google', 'Apple', 'SMS ile Giriş'].map(method => (
                          <button
                            key={method}
                            disabled
                            type="button"
                            title="Yakında"
                            className="flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-secondary/25 bg-surface-container-lowest px-3 py-2.5 text-sm font-semibold text-on-surface opacity-60"
                          >
                            <AuthIcon>{method === 'SMS ile Giriş' ? 'sms' : method === 'Google' ? 'language' : 'phone_iphone'}</AuthIcon>
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="auth-signup-prompt mt-8 border-t border-surface-container-highest pt-6 text-center">
                    <p className="text-sm text-on-surface-variant">
                      {mode === 'login' ? 'Henüz hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
                      <button
                        type="button"
                        onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                        className="ml-1 font-bold text-primary hover:underline"
                      >
                        {mode === 'login' ? 'Hemen Üye Olun' : 'Giriş Yapın'}
                      </button>
                    </p>
                  </div>
                  <div className="auth-security mt-6 flex flex-col justify-between gap-3 border-t border-dashed border-secondary/20 pt-5 text-xs font-semibold text-outline sm:flex-row">
                    <div className="flex items-center gap-2">
                      <AuthIcon className="text-primary">lock</AuthIcon>
                      256-Bit SSL Şifreli Güvenli {mode === 'login' ? 'Giriş' : 'Kayıt'}
                    </div>
                    <div className="flex items-center gap-2">
                      <AuthIcon className="text-primary">shield</AuthIcon>
                      KVKK Uyumlu Kişisel Veri Koruması
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        <section className="auth-benefits mt-12 grid grid-cols-1 gap-4 border-t border-surface-container-highest pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['ac_unit', 'Soğuk Zincir Koruma', 'Özel strafor ve buz akülü kargo'],
            ['handshake', 'Kooperatif Onaylı', 'Aracısız yerel üretici desteği'],
            ['eco', '%100 Katkısız & Saf', 'Geleneksel ata tohumu ve maya'],
            ['security', '256-Bit SSL Güvenlik', 'Uçtan uca şifreli güvenli ödeme'],
          ].map(([icon, title, description]) => (
            <div key={title} className="flex items-center gap-3.5 rounded-xl border border-secondary/15 bg-surface-container-low p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary">
                <AuthIcon className="text-2xl">{icon}</AuthIcon>
              </div>
              <div>
                <h2 className="text-sm font-bold text-primary">{title}</h2>
                <p className="text-xs text-on-surface-variant">{description}</p>
              </div>
            </div>
          ))}
        </section>
      </main>
      <AuthFooter />
    </div>
  );
}
