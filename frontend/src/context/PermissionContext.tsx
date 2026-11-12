import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  rbacService,
  RoleDto,
  ModulePermissionDto,
  AdminLoginResponse,
  getAdminSession,
  setAdminSession,
  clearAdminSession,
  getActiveAdminRole,
  setActiveAdminRole,
  ensureAdminRoleFetchInterceptor,
} from '../services/rbacService';
import { theme } from '../theme/tokens';

// İlk yüklemede /api/admin interceptor hazır olsun
ensureAdminRoleFetchInterceptor();

interface PermissionContextValue {
  adminSession: AdminLoginResponse | null;
  isAuthenticated: boolean;
  activeRole: string;
  activeRoleDisplay: string;
  isSuperAdmin: boolean;
  canSwitchPreviewRole: boolean;
  permissions: string[];
  roles: RoleDto[];
  allPermissions: ModulePermissionDto[];
  isLoadingPermissions: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AdminLoginResponse>;
  logout: () => void;
  switchRole: (roleName: string) => Promise<void>;
  refreshPermissions: () => Promise<void>;
  hasPermission: (permissionKey?: string) => boolean;
}

const ROLE_LABELS: Record<string, string> = {
  SuperAdmin: 'SuperAdmin (Tam Yetkili)',
  Root: 'Root (Tam Yetkili)',
  BranchManager: 'Şube Müdürü (BranchManager)',
  WarehouseStaff: 'Depo Personeli (WarehouseStaff)',
};

export function getRoleDisplayLabel(roleName: string): string {
  return ROLE_LABELS[roleName] || roleName;
}

function isSuperAdminRoleName(roleName?: string | null): boolean {
  if (!roleName) return false;
  const n = roleName.trim().toLowerCase();
  return n === 'superadmin' || n === 'root';
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminSession, setAdminSessionState] = useState<AdminLoginResponse | null>(() =>
    getAdminSession()
  );
  const [activeRole, setActiveRoleState] = useState<string>(() => getActiveAdminRole());
  const [permissions, setPermissions] = useState<string[]>(() => getAdminSession()?.permissions ?? []);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [allPermissions, setAllPermissions] = useState<ModulePermissionDto[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState<boolean>(() =>
    Boolean(getAdminSession()?.adminToken)
  );

  const isAuthenticated = Boolean(adminSession?.adminToken);
  const canSwitchPreviewRole = Boolean(adminSession && isSuperAdminRoleName(adminSession.role));
  const isSuperAdmin = isSuperAdminRoleName(activeRole);

  const loadRbacState = useCallback(async (targetRole: string, hasSession: boolean, silent = false) => {
    if (!hasSession) {
      setIsLoadingPermissions(false);
      return;
    }
    if (!silent) {
      setIsLoadingPermissions(true);
    }
    try {
      const [myPerms, rolesList, catalogList] = await Promise.all([
        rbacService.getMyPermissions(targetRole),
        rbacService.getRoles().catch(() => [] as RoleDto[]),
        rbacService.getPermissions().catch(() => [] as ModulePermissionDto[]),
      ]);
      setPermissions(myPerms);
      if (rolesList.length > 0) setRoles(rolesList);
      if (catalogList.length > 0) setAllPermissions(catalogList);
    } catch {
      // Backend erişim hatasında oturumdaki izinlerle devam edilir
    } finally {
      if (!silent) {
        setIsLoadingPermissions(false);
      }
    }
  }, []);

  useEffect(() => {
    loadRbacState(activeRole, isAuthenticated, false);
  }, [activeRole, isAuthenticated, loadRbacState]);

  useEffect(() => {
    if (!isAuthenticated || isSuperAdmin) return;
    const handleFocus = () => {
      loadRbacState(activeRole, true, true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeRole, isAuthenticated, isSuperAdmin, loadRbacState]);

  const login = useCallback(
    async (email: string, password: string, rememberMe = true): Promise<AdminLoginResponse> => {
      const res = await rbacService.loginAdmin(email, password);
      setAdminSession(res, rememberMe);
      setActiveAdminRole(res.role);
      setAdminSessionState(res);
      setActiveRoleState(res.role);
      setPermissions(res.permissions);
      await loadRbacState(res.role, true);
      return res;
    },
    [loadRbacState]
  );

  const logout = useCallback(() => {
    clearAdminSession();
    setAdminSessionState(null);
    setActiveRoleState('SuperAdmin');
    setPermissions([]);
    setRoles([]);
  }, []);

  const switchRole = useCallback(
    async (roleName: string) => {
      if (!canSwitchPreviewRole) return;
      setActiveAdminRole(roleName);
      setActiveRoleState(roleName);
      await loadRbacState(roleName, true);
    },
    [canSwitchPreviewRole, loadRbacState]
  );

  const refreshPermissions = useCallback(async () => {
    await loadRbacState(activeRole, isAuthenticated);
  }, [activeRole, isAuthenticated, loadRbacState]);

  const hasPermission = useCallback(
    (permissionKey?: string): boolean => {
      if (!permissionKey) return true;
      if (isSuperAdmin) return true;
      if (
        allPermissions.length > 0 &&
        !allPermissions.some((p) => p.key.toLowerCase() === permissionKey.toLowerCase())
      ) {
        return true;
      }
      return permissions.some((p) => p.toLowerCase() === permissionKey.toLowerCase());
    },
    [isSuperAdmin, allPermissions, permissions]
  );

  return (
    <PermissionContext.Provider
      value={{
        adminSession,
        isAuthenticated,
        activeRole,
        activeRoleDisplay: getRoleDisplayLabel(activeRole),
        isSuperAdmin,
        canSwitchPreviewRole,
        permissions,
        roles,
        allPermissions,
        isLoadingPermissions,
        login,
        logout,
        switchRole,
        refreshPermissions,
        hasPermission,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export function usePermissions(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error('usePermissions must be used inside PermissionProvider');
  }
  return ctx;
}

export const AdminAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = usePermissions();
  const location = useLocation();

  if (!isAuthenticated) {
    const returnUrl = `${location.pathname}${location.search}`;
    return <Navigate to={`/admin/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }

  return <>{children}</>;
};

export const PermissionGuard: React.FC<{
  requiredPermission?: string;
  children: React.ReactNode;
}> = ({ requiredPermission, children }) => {
  const { hasPermission, isLoadingPermissions, isSuperAdmin, activeRoleDisplay } = usePermissions();

  if (!requiredPermission || isSuperAdmin) {
    return <>{children}</>;
  }

  if (isLoadingPermissions) {
    return (
      <div
        style={{
          padding: '40px 24px',
          textAlign: 'center',
          color: theme.colors.taupe,
          fontSize: '14px',
        }}
      >
        Rol ve modül izinleri doğrulanıyor...
      </div>
    );
  }

  if (!hasPermission(requiredPermission)) {
    return (
      <div
        style={{
          maxWidth: '560px',
          margin: '32px auto',
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radii.lg,
          padding: 'clamp(22px, 4vw, 34px)',
          boxShadow: theme.shadows.subtle,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: theme.colors.statusWarningBg,
            color: theme.colors.statusWarning,
            border: '1px solid #F1D4B8',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            marginBottom: '14px',
          }}
        >
          🔒
        </div>
        <h2
          style={{
            margin: '0 0 8px 0',
            fontSize: '20px',
            fontWeight: 700,
            color: theme.colors.espresso,
          }}
        >
          Yetkisiz Erişim
        </h2>
        <p
          style={{
            margin: '0 0 18px 0',
            fontSize: '14px',
            color: theme.colors.taupe,
            lineHeight: 1.6,
          }}
        >
          Aktif rolünüz (<strong style={{ color: theme.colors.espresso }}>{activeRoleDisplay}</strong>) bu
          modüle erişim iznine sahip değil.
        </p>
        <div
          style={{
            display: 'inline-block',
            padding: '5px 12px',
            borderRadius: theme.radii.full,
            backgroundColor: theme.colors.bgSurface,
            border: `1px solid ${theme.colors.border}`,
            fontSize: '12px',
            fontFamily: 'monospace',
            color: theme.colors.cedar,
            marginBottom: '22px',
          }}
        >
          Gerekli İzin: {requiredPermission}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 18px',
              borderRadius: theme.radii.md,
              backgroundColor: theme.colors.primary,
              color: theme.colors.textInverse,
              textDecoration: 'none',
              fontSize: '13.5px',
              fontWeight: 600,
            }}
          >
            Gösterge Paneline Dön
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
