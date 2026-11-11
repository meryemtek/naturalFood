import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import { Modal } from '../../components/common/Modal';
import type { AuditLog } from '../../api/types';
import { theme } from '../../theme/tokens';

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
      CreateAdminUser: { bg: theme.colors.primarySubtle, color: theme.colors.primary, border: '#D5E5D4' },
      UpdateUserStatus: { bg: theme.colors.statusWarningBg, color: theme.colors.statusWarning, border: '#FDF0E2' },
      SystemInitialize: { bg: theme.colors.statusSuccessBg, color: theme.colors.statusSuccess, border: '#D5E5D4' },
      DeleteAdminUser: { bg: theme.colors.statusDangerBg, color: theme.colors.statusDanger, border: '#F5D3CE' },
    };
    const c = config[action] || { bg: theme.colors.bgSurface, color: theme.colors.taupe, border: theme.colors.border };

    return (
      <span
        style={{
          backgroundColor: c.bg,
          color: c.color,
          border: `1px solid ${c.border}`,
          padding: '3px 8px',
          borderRadius: theme.radii.xs,
          fontSize: '11.5px',
          fontWeight: 600,
        }}
      >
        {action}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: theme.colors.espresso, letterSpacing: '-0.3px', margin: 0 }}>
            Sistem Denetim Kayıtları (Audit Logs)
          </h1>
          <p style={{ fontSize: '13.5px', color: theme.colors.taupe, marginTop: '4px', marginBottom: 0 }}>
            Yönetici işlemleri, yetki değişiklikleri ve güvenlik olaylarının değişmez günlüğü
          </p>
        </div>

        <button
          onClick={() => fetchLogs(page)}
          style={{
            padding: '8px 14px',
            borderRadius: theme.radii.sm,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.bgCard,
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: 500,
            color: theme.colors.espresso,
          }}
        >
          🔄 Yenile
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ padding: '14px 18px', backgroundColor: theme.colors.statusDangerBg, border: `1px solid ${theme.colors.statusDanger}`, borderRadius: theme.radii.md, color: theme.colors.statusDanger, fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radii.md,
          border: `1px solid ${theme.colors.border}`,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.colors.border}`, fontSize: '14px', fontWeight: 600, color: theme.colors.espresso }}>
          Toplam {totalCount} Olay Kaydedildi
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}><table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: theme.colors.bgSurface, borderBottom: `1px solid ${theme.colors.border}`, color: theme.colors.taupe, fontSize: '11.5px', textTransform: 'uppercase' }}>
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
                <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: theme.colors.taupe }}>
                  Kayıtlar getiriliyor...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: theme.colors.stoneMuted }}>
                  Henüz kayıtlı denetim verisi bulunmuyor.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: `1px solid ${theme.colors.borderSubtle}` }}>
                  <td style={{ padding: '14px 20px', fontWeight: 500, color: theme.colors.espresso }}>
                    {log.timestampUtc ? new Date(log.timestampUtc).toLocaleString('tr-TR') : '-'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>{getActionBadge(log.action)}</td>
                  <td style={{ padding: '14px 20px', color: theme.colors.cedar }}>{log.resource}</td>
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: theme.colors.taupe, fontSize: '12px' }}>
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
                          color: theme.colors.cedar,
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
                            borderRadius: theme.radii.xs,
                            border: `1px solid ${theme.colors.border}`,
                            background: theme.colors.bgSurface,
                            cursor: 'pointer',
                            fontSize: '11px',
                            color: theme.colors.primary,
                            fontWeight: 600,
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
        </table></div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ padding: '14px 20px', borderTop: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: theme.colors.taupe }}>
              Sayfa {page} / {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page <= 1}
                onClick={() => fetchLogs(page - 1)}
                style={{
                  padding: '6px 12px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.bgSurface,
                  color: theme.colors.espresso,
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
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.bgSurface,
                  color: theme.colors.espresso,
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
              <strong style={{ color: theme.colors.taupe }}>Kayıt ID:</strong>
              <div style={{ fontFamily: 'monospace', color: theme.colors.espresso, marginTop: '2px' }}>{selectedLog.id}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
              <div>
                <strong style={{ color: theme.colors.taupe }}>Eylem:</strong>
                <div style={{ marginTop: '2px' }}>{getActionBadge(selectedLog.action)}</div>
              </div>
              <div>
                <strong style={{ color: theme.colors.taupe }}>Kaynak:</strong>
                <div style={{ color: theme.colors.espresso, marginTop: '2px' }}>{selectedLog.resource}</div>
              </div>
            </div>

            <div>
              <strong style={{ color: theme.colors.taupe }}>Zaman (UTC):</strong>
              <div style={{ color: theme.colors.espresso, marginTop: '2px' }}>
                {new Date(selectedLog.timestampUtc).toUTCString()} ({new Date(selectedLog.timestampUtc).toLocaleString('tr-TR')})
              </div>
            </div>

            <div>
              <strong style={{ color: theme.colors.taupe }}>Kullanıcı / IP:</strong>
              <div style={{ color: theme.colors.espresso, marginTop: '2px', fontFamily: 'monospace' }}>
                {selectedLog.adminUserId || 'Sistem'} ({selectedLog.ipAddress || 'Bilinmiyor'})
              </div>
            </div>

            {selectedLog.details && (
              <div>
                <strong style={{ color: theme.colors.taupe }}>İşlem Detayları:</strong>
                <pre
                  style={{
                    backgroundColor: theme.colors.bgSurface,
                    border: `1px solid ${theme.colors.border}`,
                    padding: '12px',
                    borderRadius: theme.radii.sm,
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    marginTop: '4px',
                    color: theme.colors.espresso,
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
