import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import type { AdminUser, CreateAdminUserRequest } from '../../api/types';
import { theme } from '../../theme/tokens';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Modal Durumu
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateAdminUserRequest>({
    email: '',
    fullName: '',
    password: '',
    role: 2,
  });

  const fetchUsers = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUsers(targetPage, pageSize);
      setUsers(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err: any) {
      setError(err.message || 'Kullanıcılar yüklenirken bir sorun oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      const nextStatus = !user.isActive;
      await adminApi.updateUserStatus(user.id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u))
      );
    } catch (err: any) {
      alert(err.message || 'Durum güncellenirken hata oluştu.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors(null);
    try {
      await adminApi.createUser(formData);
      setIsModalOpen(false);
      setFormData({ email: '', fullName: '', password: '', role: 2 });
      fetchUsers(1);
    } catch (err: any) {
      setFormErrors(err.message || 'Kullanıcı eklenemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeStyle = (role: number) => {
    switch (role) {
      case 1:
        return { bg: theme.colors.primarySubtle, color: theme.colors.primary, border: '#D5E5D4', label: 'SuperAdmin' };
      case 2:
        return { bg: '#F5F2EF', color: theme.colors.cedar, border: theme.colors.border, label: 'Admin' };
      case 3:
        return { bg: theme.colors.bgSurface, color: theme.colors.taupe, border: theme.colors.border, label: 'Moderator' };
      default:
        return { bg: theme.colors.bgSurface, color: theme.colors.taupe, border: theme.colors.border, label: 'Bilinmiyor' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: theme.colors.espresso, letterSpacing: '-0.3px', margin: 0 }}>
            Rol Bazlı Yetkilendirme & Yöneticiler
          </h1>
          <p style={{ fontSize: '13.5px', color: theme.colors.taupe, marginTop: '4px', marginBottom: 0 }}>
            PostgreSQL <code style={{ color: theme.colors.primary, fontWeight: 600 }}>"admin"</code> izole şemasındaki yetkili kullanıcıların yönetimi
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.textInverse,
            border: 'none',
            padding: '10px 18px',
            borderRadius: theme.radii.md,
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>+</span> Yeni Yönetici Ekle
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: theme.colors.statusDangerBg,
            border: `1px solid ${theme.colors.statusDanger}`,
            borderRadius: theme.radii.md,
            color: theme.colors.statusDanger,
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={() => fetchUsers(page)}
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.statusDanger}`,
              color: theme.colors.statusDanger,
              padding: '4px 10px',
              borderRadius: theme.radii.xs,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Yeniden Dene
          </button>
        </div>
      )}

      {/* Table Container */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radii.md,
          border: `1px solid ${theme.colors.border}`,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: theme.colors.espresso }}>
            Toplam {totalCount} Yönetici Kayıtlı
          </span>
          <button
            onClick={() => fetchUsers(page)}
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.border}`,
              padding: '6px 12px',
              borderRadius: theme.radii.sm,
              fontSize: '12px',
              cursor: 'pointer',
              color: theme.colors.cedar,
            }}
          >
            🔄 Yenile
          </button>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}><table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: theme.colors.bgSurface, borderBottom: `1px solid ${theme.colors.border}`, color: theme.colors.taupe, fontSize: '11.5px', textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 20px' }}>Yönetici / Kimlik</th>
              <th style={{ padding: '14px 20px' }}>E-Posta</th>
              <th style={{ padding: '14px 20px' }}>Rol</th>
              <th style={{ padding: '14px 20px', textAlign: 'center' }}>Durum</th>
              <th style={{ padding: '14px 20px' }}>Kayıt Tarihi</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: theme.colors.taupe }}>
                  Yöneticiler getiriliyor...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: theme.colors.stoneMuted }}>
                  Henüz kayıtlı kullanıcı bulunmuyor.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const roleStyle = getRoleBadgeStyle(user.role);
                return (
                  <tr key={user.id} style={{ borderBottom: `1px solid ${theme.colors.borderSubtle}` }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: theme.colors.espresso }}>{user.fullName}</div>
                      <div style={{ fontSize: '11px', color: theme.colors.stoneMuted, fontFamily: 'monospace' }}>{user.id}</div>
                    </td>
                    <td style={{ padding: '14px 20px', color: theme.colors.espresso }}>{user.email}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          backgroundColor: roleStyle.bg,
                          color: roleStyle.color,
                          border: `1px solid ${roleStyle.border}`,
                          padding: '3px 8px',
                          borderRadius: theme.radii.xs,
                          fontSize: '11.5px',
                          fontWeight: 600,
                        }}
                      >
                        {user.roleName || roleStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <StatusBadge isActive={user.isActive} />
                    </td>
                    <td style={{ padding: '14px 20px', color: theme.colors.taupe }}>
                      {user.createdAtUtc ? new Date(user.createdAtUtc).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: theme.radii.sm,
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          backgroundColor: user.isActive ? theme.colors.statusDangerBg : theme.colors.statusSuccessBg,
                          color: user.isActive ? theme.colors.statusDanger : theme.colors.statusSuccess,
                          border: `1px solid ${user.isActive ? '#F5D3CE' : '#D5E5D4'}`,
                        }}
                      >
                        {user.isActive ? 'Pasife Al' : 'Aktifleştir'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table></div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '14px 20px', borderTop: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '6px 12px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.bgSurface,
                color: theme.colors.espresso,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              Önceki
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '13px', color: theme.colors.taupe }}>
              Sayfa {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: '6px 12px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.bgSurface,
                color: theme.colors.espresso,
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages ? 0.5 : 1,
              }}
            >
              Sonraki
            </button>
          </div>
        )}
      </div>

      {/* Modal: Yeni Yönetici Ekle */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Sistem Yöneticisi Tanımla">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formErrors && (
            <div style={{ padding: '10px 14px', backgroundColor: theme.colors.statusDangerBg, color: theme.colors.statusDanger, borderRadius: theme.radii.sm, fontSize: '13px' }}>
              {formErrors}
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '6px' }}>
              Ad Soyad
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Örn: Merve Kaya"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '6px' }}>
              E-Posta Adresi
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="merve.kaya@naturalfood.local"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '6px' }}>
              Şifre (Min 8 karakter, büyük-küçük harf, rakam)
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '6px' }}>
              Rol Seçimi
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value={2}>Admin (Standart Yönetici)</option>
              <option value={3}>Moderator (Kısıtlı Yönetici)</option>
              <option value={1}>SuperAdmin (Tam Yetkili)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                padding: '9px 16px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.bgSurface,
                color: theme.colors.espresso,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '9px 18px',
                borderRadius: theme.radii.sm,
                border: 'none',
                backgroundColor: theme.colors.primary,
                color: theme.colors.textInverse,
                fontSize: '13px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Yöneticiyi Oluştur'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
