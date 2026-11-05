import React from 'react';

export interface StatusBadgeProps {
  isActive: boolean;
  activeLabel?: string;
  passiveLabel?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  isActive,
  activeLabel = 'Aktif',
  passiveLabel = 'Pasif',
  size = 'md',
}) => {
  const isSm = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? '4px' : '6px',
        padding: isSm ? '2px 8px' : '4px 10px',
        borderRadius: '9999px',
        fontSize: isSm ? '11px' : '12px',
        fontWeight: 600,
        backgroundColor: isActive ? '#ecfdf5' : '#fef2f2',
        color: isActive ? '#059669' : '#dc2626',
        border: `1px solid ${isActive ? '#a7f3d0' : '#fecaca'}`,
        lineHeight: 1,
      }}
    >
      <span
        style={{
          width: isSm ? '6px' : '7px',
          height: isSm ? '6px' : '7px',
          borderRadius: '50%',
          backgroundColor: isActive ? '#10b981' : '#ef4444',
          display: 'inline-block',
        }}
      />
      {isActive ? activeLabel : passiveLabel}
    </span>
  );
};
