import React, { useEffect } from 'react';
import { theme } from '../../theme/tokens';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, maxWidth = '580px', children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(45, 36, 30, 0.45)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.colors.bgSurface,
          borderRadius: theme.radii.md,
          width: '100%',
          maxWidth: maxWidth,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${theme.colors.border}`,
          boxShadow: '0 8px 30px rgba(45, 36, 30, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.colors.bgCard,
            borderTopLeftRadius: theme.radii.md,
            borderTopRightRadius: theme.radii.md,
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: theme.colors.espresso, margin: 0, letterSpacing: '-0.2px' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Kapat"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              color: theme.colors.stoneMuted,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '6px 10px',
              borderRadius: theme.radii.sm,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bgHover;
              e.currentTarget.style.color = theme.colors.espresso;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.colors.stoneMuted;
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
};
