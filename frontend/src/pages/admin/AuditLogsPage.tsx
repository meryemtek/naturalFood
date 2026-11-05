import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import { Modal } from '../../components/common/Modal';
import type { AuditLog } from '../../api/types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAuditLogs(targetPage, pageSize);
      setLogs(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err: any) {
      setError(err.message || 'Denetim kayıtları yüklenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  const getActionBadge = (action: string) => {
    const config: Record<string, { bg: string; color: string; border: string }> = {
      CreateAdminUser: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
      UpdateUserStatus: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
      SystemInitialize: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
      DeleteAdminUser: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
    };
    const c = config[action] || { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };

    return (
      <span
        style={{
          backgroundColor: c.bg,
          color: c.color,
          border: `1px solid ${c.border}`,
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        {action}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Sistem Denetim Kayıtları (Audit Logs)
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Yönetici işlemleri, yetki değişiklikleri ve güvenlik olaylarının değişmez günlüğü
          </p>
        </div>

        <button
          onClick={() => fetchLogs(page)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: 500,
            color: '#334155',
          }}
        >
          🔄 Yenile
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ padding: '14px 18px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
          Toplam {totalCount} Olay Kaydedildi
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 20px' }}>Tarih / Saat (UTC)</th>
              <th style={{ padding: '14px 20px' }}>Eylem (Action)</th>
              <th style={{ padding: '14px 20px' }}>Kaynak</th>
              <th style={{ padding: '14px 20px' }}>İşlemi Yapan Kullanıcı ID</th>
              <th style={{ padding: '14px 20px' }}>Detay</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  Kayıtlar getiriliyor...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                  Henüz kayıtlı denetim verisi bulunmuyor.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 500, color: '#0f172a' }}>
                    {log.timestampUtc ? new Date(log.timestampUtc).toLocaleString('tr-TR') : '-'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>{getActionBadge(log.action)}</td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>{log.resource}</td>
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: '#64748b', fontSize: '12px' }}>
                    {log.adminUserId || 'Sistem (Otomatik)'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          maxWidth: '220px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: '#475569',
                        }}
                        title={log.details || ''}
                      >
                        {log.details || '-'}
                      </span>
                      {log.details && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            background: '#f8fafc',
                            cursor: 'pointer',
                            fontSize: '11px',
                            color: '#2563eb',
                            fontWeight: 500,
                          }}
                        >
                          İncele
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
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
                onClick={() => fetchLogs(page - 1)}
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
                onClick={() => fetchLogs(page + 1)}
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

      {/* Detay Modalı */}
      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Denetim İzi Detayları">
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div>
              <strong style={{ color: '#475569' }}>Kayıt ID:</strong>
              <div style={{ fontFamily: 'monospace', color: '#0f172a', marginTop: '2px' }}>{selectedLog.id}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <strong style={{ color: '#475569' }}>Eylem:</strong>
                <div style={{ marginTop: '2px' }}>{getActionBadge(selectedLog.action)}</div>
              </div>
              <div>
                <strong style={{ color: '#475569' }}>Kaynak:</strong>
                <div style={{ color: '#0f172a', marginTop: '2px' }}>{selectedLog.resource}</div>
              </div>
            </div>

            <div>
              <strong style={{ color: '#475569' }}>Zaman (UTC):</strong>
              <div style={{ color: '#0f172a', marginTop: '2px' }}>
                {new Date(selectedLog.timestampUtc).toUTCString()} ({new Date(selectedLog.timestampUtc).toLocaleString('tr-TR')})
              </div>
            </div>

            <div>
              <strong style={{ color: '#475569' }}>Kullanıcı / IP:</strong>
              <div style={{ color: '#0f172a', marginTop: '2px', fontFamily: 'monospace' }}>
                {selectedLog.adminUserId || 'Sistem'} ({selectedLog.ipAddress || 'Bilinmiyor'})
              </div>
            </div>

            {selectedLog.details && (
              <div>
                <strong style={{ color: '#475569' }}>İşlem Detayları:</strong>
                <pre
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    marginTop: '4px',
                    color: '#1e293b',
                  }}
                >
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                    } catch {
                      return selectedLog.details;
                    }
                  })()}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

