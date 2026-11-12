export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: number;
  roleName: string;
  isActive: boolean;
  createdAtUtc: string;
  lastLoginAtUtc?: string | null;
}

export interface CreateAdminUserRequest {
  email: string;
  fullName: string;
  password: string;
  role: number;
  customRoleName?: string | null;
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
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

