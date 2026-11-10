import { AuthIcon } from './AuthIcon';

interface AuthFieldProps {
  id: string;
  label: string;
  icon: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}

export function AuthField({
  id, label, icon, value, onChange, placeholder, type = 'text', autoComplete, required = true,
}: AuthFieldProps) {
  return <div>
    <label htmlFor={id} className="mb-2 block text-sm font-semibold text-on-surface">{label}</label>
    <div className="flex items-center rounded-lg border border-secondary/30 bg-surface-container-low/50 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
      <AuthIcon className="ml-3.5 shrink-0 text-xl text-outline">{icon}</AuthIcon>
      <input id={id} name={id} type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} required={required} className="min-w-0 w-full border-0 bg-transparent px-3 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-0" />
    </div>
  </div>;
}
