import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { theme } from '../../theme/tokens';

export const Header: React.FC = () => {
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    adminApi
      .checkHealth()
      .then(() => setIsBackendHealthy(true))
      .catch(() => setIsBackendHealthy(false));
  }, []);

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: theme.colors.bgSurface,
        borderBottom: `1px solid ${theme.colors.border}`,
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: theme.colors.espresso, letterSpacing: '-0.2px' }}>
          Natural Food Operasyon & Yönetim Portalı
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* API Health Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: theme.radii.full,
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor:
              isBackendHealthy === true
                ? theme.colors.statusSuccessBg
                : isBackendHealthy === false
                ? theme.colors.statusDangerBg
                : theme.colors.bgCanvas,
            color:
              isBackendHealthy === true
                ? theme.colors.statusSuccess
                : isBackendHealthy === false
                ? theme.colors.statusDanger
                : theme.colors.taupe,
            border: `1px solid ${
              isBackendHealthy === true
                ? '#D5E5D4'
                : isBackendHealthy === false
                ? '#F5D3CE'
                : theme.colors.border
            }`,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor:
                isBackendHealthy === true
                  ? theme.colors.statusSuccess
                  : isBackendHealthy === false
                  ? theme.colors.statusDanger
                  : theme.colors.stoneMuted,
            }}
          />
          {isBackendHealthy === true
            ? 'API: Çevrimiçi'
            : isBackendHealthy === false
            ? 'API: Bağlantı Yok'
            : 'API: Kontrol Ediliyor...'}
        </div>

        {/* User Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 10px',
            borderRadius: theme.radii.md,
            backgroundColor: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: theme.colors.espresso }}>
            Super Administrator
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: theme.radii.xs,
              backgroundColor: theme.colors.primarySubtle,
              color: theme.colors.primary,
            }}
          >
            Root
          </span>
        </div>
      </div>
    </header>
  );
};
