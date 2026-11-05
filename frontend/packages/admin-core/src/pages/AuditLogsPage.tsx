import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminApi, AdminApiClient } from '../api';
import { AdminTable } from '../components/Table/AdminTable';
import type { AuditLog, Column } from '../types';

export interface AuditLogsPageProps {
  apiClient?: AdminApiClient;
  title?: string;
}

export const AuditLogsPage: React.FC<AuditLogsPageProps> = ({
  apiClient = adminApi,
  title = 'Sistem Denetim Kayıtları (Audit Logs)',
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getAuditLogs({ page: targetPage, pageSize });
      setLogs(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err: any) {
      setError(err.message || 'Denetim kayıtları yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, pageSize]);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  const columns: Column<AuditLog>[] = useMemo(
    () => [
      {
        key: 'timestampUtc',
        header: 'Tarih / Saat (UTC)',
        sortable: true,
        width: '180px',
        render: (val: string) => (
          <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>
            {val ? new Date(val).toLocaleString('tr-TR') : '-'}
          </span>
        ),
      },
      {
        key: 'action',
        header: 'Eylem (Action)',
        sortable: true,
        width: '180px',
        render: (action: string) => {
          const actionColors: Record<string, { bg: string; color: string }> = {
            CreateAdminUser: { bg: '#eff6ff', color: '#1d4ed8' },
            UpdateUserStatus: { bg: '#fef3c7', color: '#b45309' },
            SystemInitialize: { bg: '#f0fdf4', color: '#15803d' },
            DeleteAdminUser: { bg: '#fef2f2', color: '#b91c1c' },
          };
          const style = actionColors[action] || { bg: '#f8fafc', color: '#475569' };

          return (
            <span
              style={{
                backgroundColor: style.bg,
                color: style.color,
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              {action}
            </span>
          );
        },
      },
      {
        key: 'resource',
        header: 'Kaynak',
        width: '130px',
        render: (resource: string) => (
          <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
            {resource}
          </span>
        ),
      },
      {
        key: 'adminUserId',
        header: 'İşlemi Yapan Kullanıcı',
        width: '180px',
        render: (userId: string | null) => (
          <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
            {userId || 'Sistem / Anonim'}
          </span>
        ),
      },
      {
        key: 'ipAddress',
        header: 'IP Adresi',
        width: '120px',
        render: (ip: string | null) => (
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {ip || '127.0.0.1'}
          </span>
        ),
      },
      {
        key: 'details',
        header: 'Detaylar',
        render: (details: string | null) => (
          <span style={{ fontSize: '13px', color: '#334155' }}>
            {details || '-'}
          </span>
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
          <button onClick={() => fetchLogs(page)} style={styles.retryBtn}>
            Yeniden Dene
          </button>
        </div>
      )}

      <AdminTable
        title={title}
        data={logs}
        columns={columns}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        emptyMessage="Kayıtlı sistem logu bulunamadı."
        toolbarActions={
          <button
            onClick={() => fetchLogs(page)}
            style={styles.refreshBtn}
            title="Listeyi Yenile"
          >
            ↻ Yenile
          </button>
        }
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  refreshBtn: {
    backgroundColor: '#ffffff',
    color: '#334155',
    border: '1px solid #cbd5e1',
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
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
};
