export function AuthIcon({ children, className = '' }: { children: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>;
}
