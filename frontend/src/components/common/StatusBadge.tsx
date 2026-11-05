import React from 'react';

export interface StatusBadgeProps {
  isActive: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ isActive }) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: isActive ? '#ecfdf5' : '#fef2f2',
        color: isActive ? '#059669' : '#dc2626',
        border: `1px solid ${isActive ? '#a7f3d0' : '#fecaca'}`,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: isActive ? '#10b981' : '#ef4444',
        }}
      />
      {isActive ? 'Aktif' : 'Pasif'}
    </span>
  );
};

