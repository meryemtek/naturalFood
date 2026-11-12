import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePermissions } from '../../context/PermissionContext';
import { theme } from '../../theme/tokens';

const QUICK_TEST_ACCOUNTS = [
  {
    label: 'SuperAdmin',
    email: 'superadmin@naturalfood.local',
    password: 'Admin123!',
    hint: 'Tüm modüller açık',
  },
  {
    label: 'Şube Müdürü',
    email: 'sube.muduru@naturalfood.local',
    password: 'Sube123!',
    hint: 'Stok / Ürün / Sipariş',
  },
  {
    label: 'Depo',
    email: 'depo@naturalfood.local',
    password: 'Depo123!',
    hint: 'Stok & Depo',
  },
] as const;

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, login } = usePermissions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawReturnUrl = searchParams.get('returnUrl');
  const targetAfterLogin =
    rawReturnUrl &&
    rawReturnUrl.startsWith('/') &&
    !rawReturnUrl.startsWith('//') &&
    !rawReturnUrl.startsWith('/admin/login')
      ? rawReturnUrl
      : '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(targetAfterLogin, { replace: true });
    }
  }, [isAuthenticated, navigate, targetAfterLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password, rememberMe);
      navigate(targetAfterLogin, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Giriş yapılamadı. E-posta ve şifrenizi kontrol edin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickAccount = (accountEmail: string, accountPassword: string) => {
    setEmail(accountEmail);
    setPassword(accountPassword);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.colors.bgCanvas,
        backgroundImage:
          'radial-gradient(circle at 12% 15%, rgba(45, 90, 39, 0.06) 0%, transparent 45%), radial-gradient(circle at 88% 85%, rgba(162, 123, 92, 0.08) 0%, transparent 45%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 36px)',
        color: theme.colors.espresso,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radii.lg,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: '0 10px 30px rgba(45, 36, 30, 0.06)',
          padding: 'clamp(22px, 4vw, 34px)',
          boxSizing: 'border-box',
        }}
      >
        {/* Kurumsal Başlık & Amblem */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              margin: '0 auto 14px auto',
              borderRadius: theme.radii.md,
              backgroundColor: theme.colors.primarySubtle,
              border: '1px solid #D3E4D1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.primary,
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9.5 12.5 11 14l3.5-3.5" />
            </svg>
          </div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              color: theme.colors.primary,
              marginBottom: '6px',
            }}
          >
            Köy Kokusu · Doğal Gıda Yönetimi
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 700,
              color: theme.colors.espresso,
              letterSpacing: '-0.3px',
            }}
          >
            Yönetim Paneli Girişi
          </h1>
          <p
            style={{
              margin: '6px 0 0 0',
              fontSize: '13.5px',
              color: theme.colors.taupe,
              lineHeight: 1.5,
            }}
          >
            Yetkili personel hesabınızla giriş yaparak rolünüze tanımlı modüllere erişin.
          </p>
        </div>

        {/* Hata Mesajı */}
        {error && (
          <div
            role="alert"
            style={{
              marginBottom: '18px',
              padding: '11px 14px',
              borderRadius: theme.radii.md,
              backgroundColor: theme.colors.statusDangerBg,
              border: `1px solid ${theme.colors.statusDanger}`,
              color: theme.colors.statusDanger,
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* Kurumsal Giriş Formu */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label
              htmlFor="admin-email"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: theme.colors.espresso,
                marginBottom: '6px',
              }}
            >
              E-posta Adresi
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@naturalfood.local"
              style={{
                width: '100%',
                padding: '11px 13px',
                borderRadius: theme.radii.md,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.bgSurface,
                color: theme.colors.espresso,
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: theme.colors.espresso,
                marginBottom: '6px',
              }}
            >
              Şifre
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '11px 44px 11px 13px',
                  borderRadius: theme.radii.md,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.bgSurface,
                  color: theme.colors.espresso,
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'transparent',
                  border: 'none',
                  padding: '6px',
                  cursor: 'pointer',
                  color: theme.colors.taupe,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: theme.radii.xs,
                }}
              >
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              fontSize: '13.5px',
              color: theme.colors.espresso,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: '17px',
                height: '17px',
                accentColor: theme.colors.primary,
                cursor: 'pointer',
              }}
            />
            <span>Oturumu Açık Tut</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: '4px',
              width: '100%',
              padding: '12px 18px',
              borderRadius: theme.radii.md,
              border: 'none',
              backgroundColor: theme.colors.primary,
              color: theme.colors.textInverse,
              fontSize: '14.5px',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.72 : 1,
              transition: 'background-color 0.15s ease',
            }}
          >
            {isSubmitting ? 'Doğrulanıyor...' : 'Yönetim Paneline Giriş Yap'}
          </button>
        </form>

        {/* Hızlı Test Hesabı Doldur */}
        <div
          style={{
            marginTop: '22px',
            paddingTop: '18px',
            borderTop: `1px dashed ${theme.colors.border}`,
          }}
        >
          <div
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              color: theme.colors.taupe,
              marginBottom: '10px',
            }}
          >
            Hızlı Test Hesabı Doldur (Geliştirme)
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 118px), 1fr))',
              gap: '8px',
            }}
          >
            {QUICK_TEST_ACCOUNTS.map((acc) => (
              <button
                key={acc.label}
                type="button"
                onClick={() => fillQuickAccount(acc.email, acc.password)}
                title={`${acc.email} — ${acc.hint}`}
                style={{
                  padding: '8px 10px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.bgSurface,
                  color: theme.colors.espresso,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <span style={{ color: theme.colors.primary }}>{acc.label}</span>
                <span style={{ fontSize: '10.5px', color: theme.colors.taupe, fontWeight: 500 }}>
                  {acc.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mağaza Vitrini Linki */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: `1px solid ${theme.colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            fontSize: '12px',
            color: theme.colors.taupe,
          }}
        >
          <span>İzole Yönetici Oturumu</span>
          <Link
            to="/"
            style={{
              color: theme.colors.primary,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            ← Mağaza Vitrinine Dön
          </Link>
        </div>
      </div>
    </div>
  );
};
