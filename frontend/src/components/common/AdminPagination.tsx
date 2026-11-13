import React from 'react';
import { theme } from '../../theme/tokens';

interface AdminPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  itemCount: number;
  onPageChange: (nextPage: number) => void;
  label?: string;
}

/** Shared pagination bar for admin data tables and lists. */
export const AdminPagination: React.FC<AdminPaginationProps> = ({
  page,
  pageSize,
  totalCount,
  itemCount,
  onPageChange,
  label = 'kayıt',
}) => {
  if (totalCount <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '14px 20px',
        borderTop: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.bgSurface,
        fontSize: '13px',
        color: theme.colors.taupe,
      }}
    >
      <span>
        Sayfa <strong style={{ color: theme.colors.espresso }}>{page}</strong> / {totalPages} ({itemCount} / {totalCount} {label})
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          disabled={!hasPrev}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          style={{
            padding: '6px 12px',
            borderRadius: theme.radii.xs,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.bgCard,
            color: theme.colors.espresso,
            fontWeight: 600,
            cursor: hasPrev ? 'pointer' : 'not-allowed',
            opacity: hasPrev ? 1 : 0.45,
          }}
        >
          Önceki
        </button>
        <span
          style={{
            minWidth: '32px',
            height: '32px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.radii.xs,
            backgroundColor: theme.colors.primary,
            color: '#FFFFFF',
            fontWeight: 700,
            padding: '0 8px',
          }}
        >
          {page}
        </span>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          style={{
            padding: '6px 12px',
            borderRadius: theme.radii.xs,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.bgCard,
            color: theme.colors.espresso,
            fontWeight: 600,
            cursor: hasNext ? 'pointer' : 'not-allowed',
            opacity: hasNext ? 1 : 0.45,
          }}
        >
          Sonraki
        </button>
      </div>
    </div>
  );
};
