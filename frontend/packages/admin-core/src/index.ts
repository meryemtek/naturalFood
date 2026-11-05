// 1. Modüler Kabuk (Pluggable Admin Shell) & Düzen
export { AdminShell } from './components/Shell/AdminShell';
export { AdminLayout } from './components/Layout/AdminLayout';
export { AdminTable, DataTable } from './components/Table/AdminTable';
export { StatusBadge, type StatusBadgeProps } from './components/StatusBadge/StatusBadge';
export { Modal, type ModalProps } from './components/Modal/Modal';
export { AdminGuard } from './components/Guard/AdminGuard';

// 2. Modüller & Modül Fabrikaları
export {
  userManagementModule,
  createUserManagementModule,
  type UserManagementModuleOptions,
} from './modules/user-management';

export {
  inventoryModule,
  createInventoryModule,
  InventoryPage,
  type InventoryModuleOptions,
} from './modules/inventory';

// 3. Hazır Modül Sayfaları
export { UsersPage, type UsersPageProps } from './pages/UsersPage';
export { AuditLogsPage, type AuditLogsPageProps } from './pages/AuditLogsPage';

// 4. API İstemcisi & Servisler
export {
  AdminApiClient,
  AdminApiError,
  adminApi,
  createAdminApiClient,
} from './api';

// 5. Tipler, Modül Sözleşmesi & Enumlar
export {
  AdminRoleEnum,
  AdminRoleNames,
} from './types';

export type {
  AdminRole,
  AdminUser,
  AuditLog,
  PagedResult,
  CreateAdminUserRequest,
  UpdateStatusRequest,
  PaginationParams,
  NavItem,
  AdminLayoutProps,
  Column,
  AdminTableProps,
  DataTableProps,
  SortDirection,
  AdminGuardProps,
  ApiClientConfig,
  // Modül Sözleşmesi Tipleri
  AdminFeatureModule,
  NavigationItem,
  ModuleRoute,
  AdminShellProps,
} from './types';
