import React from 'react';

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
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{title}</span>
        <span
          style={{
            padding: '6px 10px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '16px',
          }}
        >
          {icon}
        </span>
      </div>

      <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{value}</div>

      {(subtitle || change) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          {change && (
            <span style={{ color: isPositive ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
              {isPositive ? '↑' : '↓'} {change}
            </span>
          )}
          {subtitle && <span style={{ color: '#94a3b8' }}>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

