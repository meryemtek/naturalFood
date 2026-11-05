import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/common/StatCard';
import { adminApi } from '../../api/adminApi';
import type { AdminUser, AuditLog } from '../../api/types';

export const DashboardPage: React.FC = () => {
  const [adminCount, setAdminCount] = useState<number>(1);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [usersRes, logsRes] = await Promise.all([
          adminApi.getUsers(1, 5),
          adminApi.getAuditLogs(1, 5),
        ]);
        setAdminCount(usersRes.totalCount);
        setRecentUsers(usersRes.items);
        setRecentLogs(logsRes.items);
      } catch (err) {
        console.error('Dashboard verileri yüklenirken hata:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
          E-Ticaret Yönetim Gösterge Paneli
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          Platform genel durumu, satış metrikleri ve sistem yönetici hareketleri
        </p>
      </div>

      {/* KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
        <StatCard
          title="Aylık Ciro"
          value="₺348.500"
          icon="💳"
          change="%12,4"
          isPositive={true}
          subtitle="geçen aya göre"
        />
        <StatCard
          title="Bekleyen Siparişler"
          value="18 Adet"
          icon="🛍️"
          change="4 acil"
          isPositive={true}
          subtitle="kargoya verilecek"
        />
        <StatCard
          title="Katalogdaki Ürünler"
          value="5 Kalem"
          icon="📦"
          change="1 kritik"
          isPositive={false}
          subtitle="envanterde kayıtlı"
        />
        <StatCard
          title="Kayıtlı Yöneticiler"
          value={`${adminCount} Kullanıcı`}
          icon="👥"
          change="Aktif"
          isPositive={true}
          subtitle="admin şemasında"
        />
      </div>

      {/* Hızlı Erişim ve Mimari Durum */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Hızlı Kısayollar */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
            Hızlı Yönetici Kısayolları
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              to="/admin/users"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: '#1e293b',
                fontWeight: 500,
                fontSize: '13px',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👥</span> Yeni Yönetici Ekle / Listele
              </span>
              <span style={{ color: '#2563eb', fontWeight: 600 }}>Git →</span>
            </Link>

            <Link
              to="/inventory"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: '#1e293b',
                fontWeight: 500,
                fontSize: '13px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📦</span> Stok & Ürünleri Yönet
              </span>
              <span style={{ color: '#2563eb', fontWeight: 600 }}>Git →</span>
            </Link>

            <Link
              to="/admin/audit-logs"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: '#1e293b',
                fontWeight: 500,
                fontSize: '13px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🛡️</span> Güvenlik & Denetim Loglarını İncele
              </span>
              <span style={{ color: '#2563eb', fontWeight: 600 }}>Git →</span>
            </Link>
          </div>
        </div>

        {/* Backend Mimari & Şema Durumu */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
            Sistem Mimarisi & Şema İzolasyonu
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Backend Mimarisi:</span>
              <strong style={{ color: '#0f172a' }}>.NET 10 Klasik Onion Architecture</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Aktif Veritabanı Şeması:</span>
              <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>"admin" (İzole)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Frontend Mimarisi:</span>
              <strong style={{ color: '#0f172a' }}>React 19 + TypeScript + Vite (Tek src)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Güvenlik Standardı:</span>
              <strong style={{ color: '#059669' }}>PBKDF2 SHA-256 (100k iterasyon)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Son Sistem Denetim Logları Özeti */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
            Son Sistem ve Yönetici Hareketleri
          </h3>
          <Link to="/admin/audit-logs" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
            Tümünü Gör ({recentLogs.length}) →
          </Link>
        </div>

        {isLoading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Yükleniyor...</div>
        ) : recentLogs.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Henüz denetim kaydı yok.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                    }}
                  >
                    {log.action}
                  </span>
                  <span style={{ color: '#334155' }}>{log.details || log.resource}</span>
                </div>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                  {new Date(log.timestampUtc).toLocaleTimeString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

