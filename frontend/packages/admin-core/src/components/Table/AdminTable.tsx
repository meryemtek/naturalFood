import React, { useState, useMemo } from 'react';
import type { AdminTableProps, SortDirection } from '../../types';

export function AdminTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  searchPlaceholder = 'Tabloda ara...',
  searchableKeys,
  page,
  pageSize = 10,
  totalCount,
  totalPages: propTotalPages,
  onPageChange,
  emptyMessage = 'Gösterilecek veri bulunamadı.',
  title,
  toolbarActions,
  onRowClick,
}: AdminTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [clientPage, setClientPage] = useState(1);

  const isServerPaged = onPageChange !== undefined && totalCount !== undefined;
  const currentPage = isServerPaged ? (page || 1) : clientPage;

  // İstemci taraflı filtreleme
  const filteredData = useMemo(() => {
    if (isServerPaged || !searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((item) => {
      const keys = searchableKeys || (Object.keys(item) as (keyof T)[]);
      return keys.some((key) => {
        const val = item[key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, searchableKeys, isServerPaged]);

  // İstemci taraflı sıralama
  const sortedData = useMemo(() => {
    if (isServerPaged || !sortColumn || !sortDirection) return filteredData;

    const col = columns.find((c) => c.key === sortColumn);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = col.accessor && typeof col.accessor === 'string' ? a[col.accessor] : a[sortColumn];
      const bVal = col.accessor && typeof col.accessor === 'string' ? b[col.accessor] : b[sortColumn];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const compareResult = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
  }, [filteredData, sortColumn, sortDirection, columns, isServerPaged]);

  // Sayfalama hesaplamaları
  const effectiveTotalCount = isServerPaged ? totalCount : sortedData.length;
  const calculatedTotalPages = Math.max(1, Math.ceil(effectiveTotalCount / pageSize));
  const effectiveTotalPages = isServerPaged && propTotalPages ? propTotalPages : calculatedTotalPages;

  const displayData = useMemo(() => {
    if (isServerPaged) return data;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [data, sortedData, currentPage, pageSize, isServerPaged]);

  const handlePageChange = (newPage: number) => {
    if (isServerPaged) {
      onPageChange(newPage);
    } else {
      setClientPage(newPage);
    }
  };

  const handleSort = (colKey: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortColumn !== colKey) {
      setSortColumn(colKey);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortColumn(null);
      setSortDirection(null);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Üst Araç Çubuğu */}
      {(title || !isServerPaged || toolbarActions) && (
        <div style={styles.toolbar}>
          <div style={styles.leftToolbar}>
            {title && <h3 style={styles.tableTitle}>{title}</h3>}
            {!isServerPaged && (
              <div style={styles.searchBox}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setClientPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  style={styles.searchInput}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={styles.clearBtn} title="Temizle">
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>

          {toolbarActions && <div style={styles.rightToolbar}>{toolbarActions}</div>}
        </div>
      )}

      {/* Tablo */}
      <div style={styles.tableScroll}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                return (
                  <th
                    key={col.key}
                    style={{
                      ...styles.th,
                      width: col.width,
                      textAlign: col.align || 'left',
                      cursor: col.sortable ? 'pointer' : 'default',
                    }}
                    onClick={() => handleSort(col.key, col.sortable)}
                  >
                    <div style={styles.thContent}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span style={styles.sortIndicator}>
                          {isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} style={styles.loadingCell}>
                  <div style={styles.spinnerWrapper}>
                    <div style={styles.spinner} />
                    <span>Veriler yükleniyor...</span>
                  </div>
                </td>
              </tr>
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={styles.emptyCell}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIndex) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{
                    ...styles.bodyRow,
                    cursor: onRowClick ? 'pointer' : 'default',
                    backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#fcfcfd',
                  }}
                >
                  {columns.map((col) => {
                    let cellContent: React.ReactNode;
                    if (col.render) {
                      const rawVal = col.accessor && typeof col.accessor === 'string' ? row[col.accessor] : undefined;
                      cellContent = col.render(rawVal, row, rowIndex);
                    } else if (typeof col.accessor === 'function') {
                      cellContent = col.accessor(row);
                    } else if (col.accessor) {
                      cellContent = row[col.accessor];
                    } else {
                      cellContent = row[col.key];
                    }

                    return (
                      <td
                        key={col.key}
                        style={{
                          ...styles.td,
                          textAlign: col.align || 'left',
                        }}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Alt Sayfalama */}
      <div style={styles.pagination}>
        <div style={styles.pageInfo}>
          Toplam <strong>{effectiveTotalCount}</strong> kayıttan{' '}
          <strong>{effectiveTotalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> -{' '}
          <strong>{Math.min(currentPage * pageSize, effectiveTotalCount)}</strong> arası gösteriliyor
        </div>
        <div style={styles.pageControls}>
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || isLoading}
            style={{
              ...styles.pageBtn,
              opacity: currentPage <= 1 || isLoading ? 0.5 : 1,
              cursor: currentPage <= 1 || isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            ← Önceki
          </button>
          <span style={styles.pageNumber}>
            Sayfa {currentPage} / {effectiveTotalPages}
          </span>
          <button
            onClick={() => handlePageChange(Math.min(effectiveTotalPages, currentPage + 1))}
            disabled={currentPage >= effectiveTotalPages || effectiveTotalPages === 0 || isLoading}
            style={{
              ...styles.pageBtn,
              opacity: currentPage >= effectiveTotalPages || effectiveTotalPages === 0 || isLoading ? 0.5 : 1,
              cursor: currentPage >= effectiveTotalPages || effectiveTotalPages === 0 || isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            Sonraki →
          </button>
        </div>
      </div>
    </div>
  );
}

// Geriye dönük uyumluluk için alias
export const DataTable = AdminTable;

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    flexWrap: 'wrap',
    gap: '12px',
  },
  leftToolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: '1',
  },
  tableTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#0f172a',
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minWidth: '240px',
  },
  searchInput: {
    width: '100%',
    padding: '8px 30px 8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
  },
  clearBtn: {
    position: 'absolute',
    right: '8px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px',
  },
  rightToolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  tableScroll: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
  },
  headerRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '12px 16px',
    fontWeight: 600,
    color: '#475569',
    userSelect: 'none',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  thContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  sortIndicator: {
    fontSize: '10px',
    color: '#94a3b8',
  },
  bodyRow: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.15s ease',
  },
  td: {
    padding: '14px 16px',
    color: '#334155',
  },
  loadingCell: {
    padding: '48px 16px',
    textAlign: 'center',
  },
  spinnerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    color: '#64748b',
    fontSize: '14px',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyCell: {
    padding: '48px 16px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '14px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
    flexWrap: 'wrap',
    gap: '12px',
  },
  pageInfo: {
    fontSize: '13px',
    color: '#64748b',
  },
  pageControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pageBtn: {
    padding: '6px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    fontSize: '13px',
    color: '#334155',
    outline: 'none',
  },
  pageNumber: {
    fontSize: '13px',
    color: '#475569',
    fontWeight: 500,
  },
};
