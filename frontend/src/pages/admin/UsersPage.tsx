import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import type { AdminUser, CreateAdminUserRequest } from '../../api/types';

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

  const getRoleBadgeStyle = (role: number | string) => {
    const r = typeof role === 'number' ? role : role === 'SuperAdmin' ? 1 : role === 'Admin' ? 2 : 3;
    switch (r) {
      case 1:
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: 'SuperAdmin' };
      case 2:
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Admin' };
      case 3:
      default:
        return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'Moderator' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Sistem Yöneticileri (Admin Users)
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            PostgreSQL <code style={{ color: '#2563eb' }}>"admin"</code> şemasındaki yetkili kullanıcıların yönetimi
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
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
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#b91c1c',
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
              border: '1px solid #b91c1c',
              color: '#b91c1c',
              padding: '4px 10px',
              borderRadius: '4px',
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
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
            Toplam {totalCount} Yönetici Kayıtlı
          </span>
          <button
            onClick={() => fetchUsers(page)}
            style={{
              background: 'none',
              border: '1px solid #cbd5e1',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              color: '#475569',
            }}
          >
            🔄 Yenile
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
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
                <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  Yöneticiler getiriliyor...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                  Henüz kayıtlı kullanıcı bulunmuyor.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const roleStyle = getRoleBadgeStyle(user.role);
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{user.fullName}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{user.id}</div>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155' }}>{user.email}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          backgroundColor: roleStyle.bg,
                          color: roleStyle.color,
                          border: `1px solid ${roleStyle.border}`,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {user.roleName || roleStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <StatusBadge isActive={user.isActive} />
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748b' }}>
                      {user.createdAtUtc ? new Date(user.createdAtUtc).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          backgroundColor: user.isActive ? '#fff5f5' : '#f0fdf4',
                          color: user.isActive ? '#dc2626' : '#16a34a',
                          border: `1px solid ${user.isActive ? '#fca5a5' : '#86efac'}`,
                        }}
                      >
                        {user.isActive ? 'Pasife Al' : 'Aktif Et'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Sayfa {page} / {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page <= 1}
                onClick={() => fetchUsers(page - 1)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1,
                  fontSize: '12px',
                }}
              >
                ← Önceki
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchUsers(page + 1)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.5 : 1,
                  fontSize: '12px',
                }}
              >
                Sonraki →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Yeni Yönetici Modalı */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Yönetici Kullanıcısı Ekle">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formErrors && (
            <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '13px' }}>
              {formErrors}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Ad Soyad *</label>
            <input
              type="text"
              required
              placeholder="Örn: Mehmet Can"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>E-Posta *</label>
            <input
              type="email"
              required
              placeholder="admin@ecommerce.local"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Şifre *</label>
            <input
              type="password"
              required
              placeholder="En az 6 karakter"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Rol *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: Number(e.target.value) })}
              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff', outline: 'none' }}
            >
              <option value={1}>SuperAdmin (Tam Yetkili)</option>
              <option value={2}>Admin (Yönetici)</option>
              <option value={3}>Moderator (Kısıtlı Yetkili)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', cursor: 'pointer', fontSize: '13px' }}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

