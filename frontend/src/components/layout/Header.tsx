import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';

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
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
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
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
          E-Ticaret Yönetim Portalı
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* API Health Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor:
              isBackendHealthy === true
                ? '#ecfdf5'
                : isBackendHealthy === false
                ? '#fef2f2'
                : '#f8fafc',
            color:
              isBackendHealthy === true
                ? '#059669'
                : isBackendHealthy === false
                ? '#dc2626'
                : '#64748b',
            border: `1px solid ${
              isBackendHealthy === true
                ? '#a7f3d0'
                : isBackendHealthy === false
                ? '#fecaca'
                : '#e2e8f0'
            }`,
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor:
                isBackendHealthy === true
                  ? '#10b981'
                  : isBackendHealthy === false
                  ? '#ef4444'
                  : '#94a3b8',
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
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
            Super Administrator
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
            }}
          >
            Root
          </span>
        </div>
      </div>
    </header>
  );
};

