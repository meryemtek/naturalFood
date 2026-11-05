import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminApi, AdminApiClient, AdminApiError } from '../api';
import { AdminTable } from '../components/Table/AdminTable';
import { StatusBadge } from '../components/StatusBadge/StatusBadge';
import { Modal } from '../components/Modal/Modal';
import type { AdminUser, AdminRole, Column, CreateAdminUserRequest } from '../types';

export interface UsersPageProps {
  apiClient?: AdminApiClient;
  title?: string;
  onUserCreated?: (user: AdminUser) => void;
  onStatusChanged?: (user: AdminUser) => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({
  apiClient = adminApi,
  title = 'Yönetici Kullanıcılar',
  onUserCreated,
  onStatusChanged,
}) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Modal durumu
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState<CreateAdminUserRequest>({
    email: '',
    fullName: '',
    password: '',
    role: 2, // Varsayılan: Admin
  });

  // Kullanıcı listesini yükleme
  const fetchUsers = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getUsers({ page: targetPage, pageSize });
      setUsers(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err: any) {
      setError(err.message || 'Kullanıcılar yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, pageSize]);

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  // Durum değiştirme
  const handleToggleStatus = async (user: AdminUser) => {
    try {
      const nextStatus = !user.isActive;
      const updated = await apiClient.updateUserStatus(user.id, { isActive: nextStatus });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u)));
      if (onStatusChanged) onStatusChanged(updated);
    } catch (err: any) {
      alert(err.message || 'Durum güncellenirken hata oluştu.');
    }
  };

  // Yeni kullanıcı kaydı
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const created = await apiClient.createUser(formData);
      setIsModalOpen(false);
      setFormData({ email: '', fullName: '', password: '', role: 2 });
      if (onUserCreated) onUserCreated(created);
      // İlk sayfaya dön ve yenile
      fetchUsers(1);
    } catch (err: any) {
      if (err instanceof AdminApiError && err.errors) {
        setFormErrors(err.errors);
      } else {
        alert(err.message || 'Kullanıcı oluşturulamadı.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<AdminUser>[] = useMemo(
    () => [
      {
        key: 'fullName',
        header: 'Ad Soyad / Kimlik',
        sortable: true,
        render: (_, row) => (
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.fullName}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
              {row.id}
            </div>
          </div>
        ),
      },
      {
        key: 'email',
        header: 'E-Posta',
        sortable: true,
      },
      {
        key: 'role',
        header: 'Rol',
        sortable: true,
        render: (role: AdminRole, row) => {
          const roleName = row.roleName || (typeof role === 'string' ? role : role === 1 ? 'SuperAdmin' : role === 2 ? 'Admin' : 'Moderator');
          const badgeColors: Record<string, { bg: string; color: string; border: string }> = {
            SuperAdmin: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
            Admin: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
            Moderator: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
          };
          const style = badgeColors[roleName] || { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };

          return (
            <span
              style={{
                backgroundColor: style.bg,
                color: style.color,
                border: `1px solid ${style.border}`,
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {roleName}
            </span>
          );
        },
      },
      {
        key: 'isActive',
        header: 'Durum',
        align: 'center',
        render: (isActive: boolean) => <StatusBadge isActive={isActive} />,
      },
      {
        key: 'createdAtUtc',
        header: 'Kayıt Tarihi',
        sortable: true,
        render: (val?: string) => (
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            {val ? new Date(val).toLocaleDateString('tr-TR') : '-'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'İşlemler',
        align: 'right',
        render: (_, row) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(row);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              color: row.isActive ? '#dc2626' : '#16a34a',
              transition: 'background-color 0.15s',
            }}
          >
            {row.isActive ? 'Pasife Al' : 'Aktif Et'}
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {error && (
        <div style={styles.errorBox}>
          <strong>Hata:</strong> {error}
          <button onClick={() => fetchUsers(page)} style={styles.retryBtn}>
            Yeniden Dene
          </button>
        </div>
      )}

      <AdminTable
        title={title}
        data={users}
        columns={columns}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        toolbarActions={
          <button
            onClick={() => setIsModalOpen(true)}
            style={styles.primaryBtn}
          >
            + Yeni Yönetici Ekle
          </button>
        }
      />

      {/* Yeni Kullanıcı Modalı */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Yönetici Kullanıcısı Ekle"
      >
        <form onSubmit={handleCreateSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Ad Soyad</label>
            <input
              type="text"
              required
              placeholder="Örn: Ayşe Yılmaz"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              style={styles.input}
            />
            {formErrors.FullName && (
              <span style={styles.errorText}>{formErrors.FullName.join(', ')}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>E-Posta Adresi</label>
            <input
              type="email"
              required
              placeholder="admin@ecommerce.local"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={styles.input}
            />
            {formErrors.Email && (
              <span style={styles.errorText}>{formErrors.Email.join(', ')}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Şifre</label>
            <input
              type="password"
              required
              placeholder="En az 6 karakter"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={styles.input}
            />
            {formErrors.Password && (
              <span style={styles.errorText}>{formErrors.Password.join(', ')}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Kullanıcı Rolü</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: Number(e.target.value) })}
              style={styles.select}
            >
              <option value={1}>SuperAdmin (Tam Yetkili)</option>
              <option value={2}>Admin (Yönetici)</option>
              <option value={3}>Moderator (Kısıtlı Yetkili)</option>
            </select>
            {formErrors.Role && (
              <span style={styles.errorText}>{formErrors.Role.join(', ')}</span>
            )}
          </div>

          <div style={styles.modalFooter}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={styles.cancelBtn}
              disabled={isSubmitting}
            >
              İptal
            </button>
            <button
              type="submit"
              style={styles.primaryBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Kullanıcıyı Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  primaryBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  errorBox: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#b91c1c',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  retryBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #b91c1c',
    color: '#b91c1c',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
  },
  select: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    backgroundColor: '#fff',
    outline: 'none',
  },
  errorText: {
    fontSize: '12px',
    color: '#dc2626',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
  },
};
