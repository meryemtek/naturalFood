import { ReactNode } from 'react';

export interface NavigationItem {
  key: string;
  label: string;
  path: string;
  icon?: ReactNode;
  badge?: string | number;
  roles?: string[];
  order?: number;
}

export interface ModuleRoute {
  path: string;
  element: ReactNode;
  roles?: string[];
}

export interface AdminFeatureModule {
  id: string;
  title: string;
  order?: number;
  navItems: NavigationItem[];
  routes: ModuleRoute[];
}

export interface AdminShellProps {
  title?: string;
  logo?: ReactNode;
  modules: AdminFeatureModule[];
  currentUser?: {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  userMenuSlot?: ReactNode;
  defaultPath?: string;
  onLogout?: () => void;
}
