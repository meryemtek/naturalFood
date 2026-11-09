import React from 'react';
import { theme } from '../../theme/tokens';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  change,
  isPositive = true,
}) => {
  return (
    <div
      style={{
        backgroundColor: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radii.md,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12.5px', color: theme.colors.taupe, fontWeight: 600 }}>{title}</span>
        <span
          style={{
            padding: '5px 9px',
            backgroundColor: theme.colors.bgSurface,
            borderRadius: theme.radii.sm,
            border: `1px solid ${theme.colors.border}`,
            fontSize: '15px',
          }}
        >
          {icon}
        </span>
      </div>

      <div style={{ fontSize: '24px', fontWeight: 700, color: theme.colors.espresso, letterSpacing: '-0.3px' }}>
        {value}
      </div>

      {(subtitle || change) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          {change && (
            <span style={{ color: isPositive ? theme.colors.statusSuccess : theme.colors.statusDanger, fontWeight: 600 }}>
              {isPositive ? '↑' : '↓'} {change}
            </span>
          )}
          {subtitle && <span style={{ color: theme.colors.taupe }}>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
