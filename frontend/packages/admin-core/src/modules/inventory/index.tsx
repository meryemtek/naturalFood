import type { AdminFeatureModule } from '../../types';
import { InventoryPage } from './InventoryPage';

export interface InventoryModuleOptions {
  basePath?: string;
}

export function createInventoryModule(options?: InventoryModuleOptions): AdminFeatureModule {
  const base = (options?.basePath || '/admin').replace(/\/+$/, '');

  return {
    id: 'inventory',
    title: 'Stok Yönetimi',
    order: 2,
    navItems: [
      {
        key: 'inventory',
        label: 'Stok Listesi',
        path: `${base}/inventory`,
        icon: '📦',
      },
    ],
    routes: [
      {
        path: `${base}/inventory`,
        element: <InventoryPage />,
      },
    ],
  };
}

export const inventoryModule = createInventoryModule();
export { InventoryPage };
