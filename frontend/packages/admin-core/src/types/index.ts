import { ReactNode } from 'react';

export type AdminRole = 1 | 2 | 3 | 'SuperAdmin' | 'Admin' | 'Moderator';

export const AdminRoleEnum = {
  SuperAdmin: 1,
  Admin: 2,
  Moderator: 3,
} as const;

export const AdminRoleNames: Record<number, string> = {
  1: 'SuperAdmin',
  2: 'Admin',
  3: 'Moderator',
};

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  roleName?: string;
  isActive: boolean;
  createdAtUtc: string;
  lastLoginAtUtc?: string | null;
}

export interface AuditLog {
  id: string;
  adminUserId?: string | null;
  action: string;
  resource: string;
  timestampUtc: string;
  ipAddress?: string | null;
  details?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateAdminUserRequest {
  email: string;
  fullName: string;
  password: string;
  role: AdminRole | number;
}

export interface UpdateStatusRequest {
  isActive: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Layout Tipleri
export interface NavItem {
  key: string;
  label: string;
  icon?: ReactNode;
  path?: string;
  badge?: string | number;
  roles?: string[];
}

export interface AdminLayoutProps {
  title?: string;
  logo?: ReactNode;
  currentUser?: {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  navItems: NavItem[];
  activeNavKey?: string;
  onNavSelect?: (key: string) => void;
  onLogout?: () => void;
  children: ReactNode;
  headerActions?: ReactNode;
  userMenuSlot?: ReactNode;
}

// Tablo Tipleri
export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: string;
  header: string;
  accessor?: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => ReactNode;
}

export interface AdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchableKeys?: (keyof T)[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
  title?: string;
  toolbarActions?: ReactNode;
  onRowClick?: (row: T) => void;
}

// Eski DataTableProps ile uyumluluk için alias
export type DataTableProps<T> = AdminTableProps<T>;

export interface AdminGuardProps {
  isAuthenticated: boolean;
  userRole?: string;
  allowedRoles?: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export interface ApiClientConfig {
  baseUrl?: string;
  getAuthToken?: () => string | null | Promise<string | null>;
  onError?: (error: Error) => void;
}

// Modüler Kabuk (Pluggable Admin Shell) Tipleri
export * from './module';
