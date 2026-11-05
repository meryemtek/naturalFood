import React from 'react';
import type { AdminGuardProps } from '../../types';

export const AdminGuard: React.FC<AdminGuardProps> = ({
  isAuthenticated,
  userRole,
  allowedRoles,
  children,
  fallback,
}) => {
  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconCircle}>🔒</div>
          <h2 style={styles.title}>Oturum Açılması Gerekiyor</h2>
          <p style={styles.description}>
            Bu alana erişebilmek için lütfen geçerli yönetici kimlik bilgilerinizle giriş yapın.
          </p>
        </div>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && userRole) {
    const hasRole = allowedRoles.includes(userRole);
    if (!hasRole) {
      if (fallback) return <>{fallback}</>;
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.iconCircle}>⛔</div>
            <h2 style={styles.title}>Yetkisiz Erişim</h2>
            <p style={styles.description}>
              Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.
            </p>
            <div style={styles.roleTag}>Mevcut Rolünüz: <strong>{userRole}</strong></div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '24px',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '36px',
    maxWidth: '460px',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  },
  iconCircle: {
    fontSize: '40px',
    marginBottom: '16px',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '20px',
    fontWeight: 600,
    color: '#0f172a',
  },
  description: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#64748b',
    lineHeight: 1.5,
  },
  roleTag: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '6px',
    backgroundColor: '#f1f5f9',
    fontSize: '12px',
    color: '#334155',
  },
};
