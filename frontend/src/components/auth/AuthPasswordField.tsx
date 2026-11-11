import type { ReactNode } from 'react';
import { AuthIcon } from './AuthIcon';

interface AuthPasswordFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
  showVisibilityToggle?: boolean;
  description?: string;
  rightAction?: ReactNode;
}

export function AuthPasswordField({
  id, label, value, placeholder = '••••••••••••', onChange, visible, onToggleVisibility, autoComplete,
  required = true, minLength, showVisibilityToggle = true, description, rightAction,
}: AuthPasswordFieldProps) {
  return <div>
    <div className="mb-2 flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm font-semibold text-on-surface">{label}</label>
      {rightAction}
    </div>
    <div className="flex items-center rounded-lg border border-secondary/30 bg-surface-container-low/50 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
      <AuthIcon className="ml-3.5 shrink-0 text-xl text-outline">lock</AuthIcon>
      <input id={id} name={id} type={visible ? 'text' : 'password'} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} required={required} minLength={minLength} className="min-w-0 w-full border-0 bg-transparent px-3 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-0" />
      {showVisibilityToggle && <button type="button" aria-label={visible ? 'Şifreyi gizle' : 'Şifreyi göster'} onClick={onToggleVisibility} className="px-3.5 text-outline hover:text-primary"><AuthIcon>{visible ? 'visibility_off' : 'visibility'}</AuthIcon></button>}
    </div>
    {description && <p className="mt-1.5 text-xs text-on-surface-variant">{description}</p>}
  </div>;
}
