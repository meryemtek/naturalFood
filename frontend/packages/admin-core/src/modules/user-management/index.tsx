import type { AdminFeatureModule } from '../../types';
import { UsersPage } from '../../pages/UsersPage';
import { AuditLogsPage } from '../../pages/AuditLogsPage';

export interface UserManagementModuleOptions {
  basePath?: string;
}

export function createUserManagementModule(options?: UserManagementModuleOptions): AdminFeatureModule {
  const base = (options?.basePath || '/admin').replace(/\/+$/, '');

  return {
    id: 'user-management',
    title: 'Yönetici & Denetim',
    order: 1,
    navItems: [
      {
        key: 'users',
        label: 'Yöneticiler',
        path: `${base}/users`,
        icon: '👥',
      },
      {
        key: 'audit-logs',
        label: 'Denetim Kayıtları',
        path: `${base}/audit-logs`,
        icon: '🛡️',
      },
    ],
    routes: [
      {
        path: `${base}/users`,
        element: <UsersPage />,
      },
      {
        path: `${base}/audit-logs`,
        element: <AuditLogsPage />,
      },
    ],
  };
}

// Varsayılan /admin yoluyla yapılandırılmış modül örneği
export const userManagementModule = createUserManagementModule();
