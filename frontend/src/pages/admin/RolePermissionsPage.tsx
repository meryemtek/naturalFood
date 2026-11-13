import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { rbacService, RoleDto, ModulePermissionDto } from '../../services/rbacService';
import { adminApi } from '../../api/adminApi';
import { usePermissions, getRoleDisplayLabel } from '../../context/PermissionContext';
import { theme } from '../../theme/tokens';
import { Modal } from '../../components/common/Modal';

export const RolePermissionsPanel: React.FC = () => {
  const { refreshPermissions } = usePermissions();

  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState<ModulePermissionDto[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [draftKeys, setDraftKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState<boolean>(false);
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [newRoleDesc, setNewRoleDesc] = useState<string>('');
  const [newRoleKeys, setNewRoleKeys] = useState<string[]>(['products.view']);
  const [createInitialUser, setCreateInitialUser] = useState<boolean>(false);
  const [initialUserFullName, setInitialUserFullName] = useState<string>('');
  const [initialUserEmail, setInitialUserEmail] = useState<string>('');
  const [initialUserPassword, setInitialUserPassword] = useState<string>('');
  const [showInitialPassword, setShowInitialPassword] = useState<boolean>(false);
  const [pendingUserRole, setPendingUserRole] = useState<RoleDto | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState<boolean>(false);
  const [createRoleError, setCreateRoleError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        rbacService.getRoles(),
        rbacService.getPermissions(),
      ]);
      setRoles(rolesRes);
      setPermissionsCatalog(permsRes);

      if (rolesRes.length > 0) {
        setSelectedRoleId((prevId) => {
          const exists = rolesRes.find((r) => r.id === prevId);
          if (exists) {
            setDraftKeys(exists.permissions);
            return prevId;
          }
          // İlk açılışta BranchManager varsa senaryoyu göstermek için kolayca erişilebilir olsun, yoksa ilk rol
          const preferred = rolesRes.find((r) => r.name === 'BranchManager') ?? rolesRes[0];
          setDraftKeys(preferred.permissions);
          return preferred.id;
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Rol ve modül izinleri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  const isSelectedSuperAdmin = useMemo(() => {
    if (!selectedRole) return false;
    const n = selectedRole.name.trim().toLowerCase();
    return n === 'superadmin' || n === 'root';
  }, [selectedRole]);

  const handleSelectRole = (roleId: string) => {
    setSelectedRoleId(roleId);
    const target = roles.find((r) => r.id === roleId);
    setDraftKeys(target ? [...target.permissions] : []);
    setSuccessMessage(null);
    setError(null);
  };

  const handleToggleKey = (key: string) => {
    if (isSelectedSuperAdmin) return;
    setSuccessMessage(null);
    setDraftKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const hasChanges = useMemo(() => {
    if (!selectedRole) return false;
    const a = [...selectedRole.permissions].sort().join('|');
    const b = [...draftKeys].sort().join('|');
    return a !== b;
  }, [selectedRole, draftKeys]);

  const handleReset = () => {
    if (!selectedRole) return;
    setDraftKeys([...selectedRole.permissions]);
    setSuccessMessage(null);
  };

  const resetCreateRoleForm = () => {
    setNewRoleName('');
    setNewRoleDesc('');
    setNewRoleKeys(['products.view']);
    setCreateInitialUser(false);
    setInitialUserFullName('');
    setInitialUserEmail('');
    setInitialUserPassword('');
    setShowInitialPassword(false);
    setPendingUserRole(null);
    setCreateRoleError(null);
  };

  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateRoleError(null);
    if (!newRoleName.trim()) {
      setCreateRoleError('Rol adı/kodu zorunludur.');
      return;
    }
    if (createInitialUser) {
      if (!initialUserEmail.trim() || !initialUserEmail.includes('@')) {
        setCreateRoleError('İlk yönetici hesabı için geçerli bir e-posta adresi girin.');
        return;
      }
      if (initialUserPassword.length < 6) {
        setCreateRoleError('İlk yönetici şifresi en az 6 karakter olmalıdır.');
        return;
      }
    }

    setIsCreatingRole(true);
    let targetRole: RoleDto | null = pendingUserRole;
    try {
      if (!targetRole) {
        targetRole = await rbacService.createRole({
          name: newRoleName.trim(),
          description: newRoleDesc.trim(),
          permissionKeys: newRoleKeys,
        });
        setRoles((prev) => [...prev, targetRole!]);
        setSelectedRoleId(targetRole.id);
        setDraftKeys([...targetRole.permissions]);
        await refreshPermissions();
      }

      if (createInitialUser) {
        try {
          await adminApi.createUser({
            fullName:
              initialUserFullName.trim() || newRoleDesc.trim() || targetRole.name,
            email: initialUserEmail.trim(),
            password: initialUserPassword,
            role: 3,
            customRoleName: targetRole.name,
          });
        } catch (userErr: any) {
          setPendingUserRole(targetRole);
          setCreateRoleError(
            `'${targetRole.name}' rolü oluşturuldu ancak kullanıcı eklenemedi: ${userErr?.message || 'Bilinmeyen hata'}. E-posta/şifreyi düzenleyip tekrar deneyebilirsiniz.`
          );
          return;
        }
      }

      const createdName = targetRole.name;
      const withUserEmail = createInitialUser ? initialUserEmail.trim() : null;
      setIsCreateRoleOpen(false);
      resetCreateRoleForm();
      setSuccessMessage(
        withUserEmail
          ? `'${createdName}' rolü ve '${withUserEmail}' giriş hesabı oluşturuldu. Personel /giris üzerinden giriş yapabilir.`
          : `'${createdName}' rolü oluşturuldu ve seçildi. Modül yetkilerini düzenleyebilirsiniz.`
      );
    } catch (err: any) {
      setCreateRoleError(err?.message || 'Rol oluşturulamadı.');
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleSave = async () => {
    if (!selectedRole || isSelectedSuperAdmin) return;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await rbacService.updateRolePermissions(selectedRole.id, draftKeys);
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setDraftKeys([...updated.permissions]);
      await refreshPermissions();
      setSuccessMessage(
        `${getRoleDisplayLabel(updated.name)} rolünün modül yetkileri kaydedildi ve denetim günlüğüne (RolePermissionsUpdated) işlendi.`
      );
    } catch (err: any) {
      setError(err?.message || 'Yetkiler kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, ModulePermissionDto[]> = {};
    for (const perm of permissionsCatalog) {
      if (!groups[perm.category]) groups[perm.category] = [];
      groups[perm.category].push(perm);
    }
    return Object.entries(groups);
  }, [permissionsCatalog]);

  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radii.md,
          border: `1px solid ${theme.colors.border}`,
          padding: '36px 24px',
          textAlign: 'center',
          color: theme.colors.taupe,
          fontSize: '14px',
        }}
      >
        Dinamik rol ve modül yetkileri yükleniyor...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
      {/* Alerts */}
      {error && (
        <div
          style={{
            padding: '13px 16px',
            backgroundColor: theme.colors.statusDangerBg,
            border: `1px solid ${theme.colors.statusDanger}`,
            borderRadius: theme.radii.md,
            color: theme.colors.statusDanger,
            fontSize: '13.5px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <span>⚠️ {error}</span>
          <button
            type="button"
            onClick={loadData}
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.statusDanger}`,
              color: theme.colors.statusDanger,
              padding: '5px 12px',
              borderRadius: theme.radii.xs,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Yeniden Dene
          </button>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: '13px 16px',
            backgroundColor: theme.colors.statusSuccessBg,
            border: '1px solid #C5DFC7',
            borderRadius: theme.radii.md,
            color: theme.colors.statusSuccess,
            fontSize: '13.5px',
            fontWeight: 500,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <span>✓ {successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.statusSuccess,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Role Selector Card */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radii.md,
          border: `1px solid ${theme.colors.border}`,
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: theme.colors.espresso }}>
              Yönetilecek Rolü Seçin
            </div>
            <div style={{ fontSize: '12.5px', color: theme.colors.taupe, marginTop: '2px' }}>
              Seçili rol için admin paneli menüleri ve API erişim izinleri aşağıdan açılıp kapatılabilir.
            </div>
          </div>

          {/* Synced Dropdown + New Role Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 'min(100%, 240px)' }}>
            <select
              aria-label="Rol seçin"
              value={selectedRoleId}
              onChange={(e) => handleSelectRole(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.bgSurface,
                color: theme.colors.espresso,
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {getRoleDisplayLabel(r.name)}
                </option>
              ))}
            </select>
            </div>
            <button
              type="button"
              onClick={() => {
                resetCreateRoleForm();
                setIsCreateRoleOpen(true);
              }}
              style={{
                padding: '9px 15px',
                borderRadius: theme.radii.md,
                border: 'none',
                backgroundColor: theme.colors.primary,
                color: theme.colors.textInverse,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              + Yeni Rol Ekle
            </button>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {roles.map((role) => {
            const active = role.id === selectedRoleId;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleSelectRole(role.id)}
                style={{
                  padding: '9px 14px',
                  borderRadius: theme.radii.md,
                  border: active
                    ? `1.5px solid ${theme.colors.primary}`
                    : `1px solid ${theme.colors.border}`,
                  backgroundColor: active ? theme.colors.primarySubtle : theme.colors.bgSurface,
                  color: active ? theme.colors.primary : theme.colors.espresso,
                  fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{getRoleDisplayLabel(role.name)}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 7px',
                    borderRadius: theme.radii.full,
                    backgroundColor: active ? theme.colors.primary : theme.colors.border,
                    color: active ? theme.colors.textInverse : theme.colors.taupe,
                    fontWeight: 700,
                  }}
                >
                  {role.permissions.length}/{permissionsCatalog.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Role Info Bar */}
        {selectedRole && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: theme.radii.sm,
              backgroundColor: isSelectedSuperAdmin ? theme.colors.primarySubtle : theme.colors.bgSurface,
              border: `1px solid ${isSelectedSuperAdmin ? '#D2E4D0' : theme.colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: '13px', color: theme.colors.espresso, minWidth: 0 }}>
              <strong>{selectedRole.name}:</strong>{' '}
              <span style={{ color: theme.colors.taupe }}>{selectedRole.description}</span>
            </div>
            {isSelectedSuperAdmin && (
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: theme.colors.primary,
                  backgroundColor: theme.colors.bgCard,
                  border: '1px solid #C5DFC3',
                  padding: '3px 10px',
                  borderRadius: theme.radii.full,
                  whiteSpace: 'nowrap',
                }}
              >
                Bypass Aktif — Tüm Yetkiler Açık
              </span>
            )}
          </div>
        )}
      </div>

      {/* Categorized Module Permission Toggles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: '16px',
        }}
      >
        {groupedPermissions.map(([category, items]) => (
          <div
            key={category}
            style={{
              backgroundColor: theme.colors.bgCard,
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                color: theme.colors.cedar,
                borderBottom: `1px solid ${theme.colors.border}`,
                paddingBottom: '8px',
              }}
            >
              {category}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((perm) => {
                const enabled = isSelectedSuperAdmin || draftKeys.includes(perm.key);
                return (
                  <div
                    key={perm.key}
                    onClick={() => handleToggleKey(perm.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px',
                      padding: '10px 12px',
                      borderRadius: theme.radii.sm,
                      backgroundColor: enabled ? '#F6FAF5' : theme.colors.bgSurface,
                      border: `1px solid ${enabled ? '#CBE0C9' : theme.colors.border}`,
                      cursor: isSelectedSuperAdmin ? 'default' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: theme.colors.espresso,
                        }}
                      >
                        {perm.title}
                      </div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          fontFamily: 'monospace',
                          color: theme.colors.taupe,
                          marginTop: '2px',
                        }}
                      >
                        {perm.key}
                      </div>
                    </div>

                    {/* Natural Sage Green Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`${perm.title} iznini aç veya kapat`}
                      disabled={isSelectedSuperAdmin}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleKey(perm.key);
                      }}
                      style={{
                        position: 'relative',
                        width: '46px',
                        height: '26px',
                        flexShrink: 0,
                        borderRadius: '9999px',
                        border: 'none',
                        padding: 0,
                        cursor: isSelectedSuperAdmin ? 'not-allowed' : 'pointer',
                        backgroundColor: enabled ? theme.colors.primary : '#D5D0C8',
                        opacity: isSelectedSuperAdmin ? 0.78 : 1,
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: '3px',
                          left: enabled ? '23px' : '3px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#FFFFFF',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                          transition: 'left 0.2s ease',
                        }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Save Footer Bar */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radii.md,
          border: `1px solid ${theme.colors.border}`,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: '13px', color: theme.colors.taupe }}>
          {isSelectedSuperAdmin ? (
            <span>SuperAdmin izinleri güvenlik gereği kilitlidir (her zaman tam erişim).</span>
          ) : hasChanges ? (
            <strong style={{ color: theme.colors.statusWarning }}>
              Kaydedilmemiş değişiklikler var ({draftKeys.length} modül seçili).
            </strong>
          ) : (
            <span>
              <strong>{selectedRole ? getRoleDisplayLabel(selectedRole.name) : ''}</strong> için aktif modül sayısı:{' '}
              <strong>{draftKeys.length}</strong> / {permissionsCatalog.length}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={!hasChanges || isSaving || isSelectedSuperAdmin}
            onClick={handleReset}
            style={{
              padding: '9px 16px',
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.bgSurface,
              color: theme.colors.espresso,
              fontSize: '13px',
              fontWeight: 600,
              cursor: !hasChanges || isSaving || isSelectedSuperAdmin ? 'not-allowed' : 'pointer',
              opacity: !hasChanges || isSaving || isSelectedSuperAdmin ? 0.55 : 1,
            }}
          >
            Vazgeç
          </button>

          <button
            type="button"
            disabled={!hasChanges || isSaving || isSelectedSuperAdmin}
            onClick={handleSave}
            style={{
              padding: '9px 22px',
              borderRadius: theme.radii.md,
              border: 'none',
              backgroundColor: theme.colors.primary,
              color: theme.colors.textInverse,
              fontSize: '13px',
              fontWeight: 600,
              cursor: !hasChanges || isSaving || isSelectedSuperAdmin ? 'not-allowed' : 'pointer',
              opacity: !hasChanges || isSaving || isSelectedSuperAdmin ? 0.55 : 1,
            }}
          >
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Yeni Rol Oluşturma Modalı */}
      <Modal
        isOpen={isCreateRoleOpen}
        onClose={() => {
          setIsCreateRoleOpen(false);
          resetCreateRoleForm();
        }}
        title="Yeni Yönetici Rolü Oluştur"
        maxWidth="540px"
      >
        <form onSubmit={handleCreateRoleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {createRoleError && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: theme.radii.sm,
                backgroundColor: theme.colors.statusDangerBg,
                border: `1px solid ${theme.colors.statusDanger}`,
                color: theme.colors.statusDanger,
                fontSize: '13px',
              }}
            >
              {createRoleError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '5px' }}>
              Rol Kodu / Adı (ör. SocialMediaManager)
            </label>
            <input
              type="text"
              required
              disabled={Boolean(pendingUserRole)}
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="SocialMediaManager"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                fontSize: '13.5px',
                boxSizing: 'border-box',
                backgroundColor: pendingUserRole ? theme.colors.bgHover : theme.colors.bgSurface,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '5px' }}>
              Açıklama (ör. Sosyal Medya Yöneticisi)
            </label>
            <input
              type="text"
              disabled={Boolean(pendingUserRole)}
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
              placeholder="Sosyal Medya Yöneticisi — Müşteri değerlendirmeleri ve ürün içerik takibi"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                fontSize: '13.5px',
                boxSizing: 'border-box',
                backgroundColor: pendingUserRole ? theme.colors.bgHover : theme.colors.bgSurface,
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '6px' }}>
              Başlangıç Modül İzinleri
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '8px' }}>
              {permissionsCatalog.map((perm) => {
                const checked = newRoleKeys.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: theme.radii.sm,
                      border: `1px solid ${checked ? '#CBE0C9' : theme.colors.border}`,
                      backgroundColor: checked ? '#F6FAF5' : theme.colors.bgSurface,
                      fontSize: '12.5px',
                      cursor: pendingUserRole ? 'not-allowed' : 'pointer',
                      opacity: pendingUserRole ? 0.7 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      disabled={Boolean(pendingUserRole)}
                      checked={checked}
                      onChange={() =>
                        setNewRoleKeys((prev) =>
                          prev.includes(perm.key) ? prev.filter((k) => k !== perm.key) : [...prev, perm.key]
                        )
                      }
                      style={{ accentColor: theme.colors.primary }}
                    />
                    <span style={{ color: theme.colors.espresso, fontWeight: 500 }}>{perm.title}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Opsiyonel: İlk Yönetici Hesabı Oluşturma */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: theme.radii.md,
              border: `1px solid ${createInitialUser ? '#CBE0C9' : theme.colors.border}`,
              backgroundColor: createInitialUser ? '#F7FAF6' : theme.colors.bgSurface,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: theme.colors.espresso,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={createInitialUser}
                onChange={(e) => setCreateInitialUser(e.target.checked)}
                style={{ accentColor: theme.colors.primary }}
              />
              <span>Bu rol için ilk kullanıcıyı da oluştur (e-posta ve şifre tanımla)</span>
            </label>

            {createInitialUser && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                    Ad Soyad (opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={initialUserFullName}
                    onChange={(e) => setInitialUserFullName(e.target.value)}
                    placeholder="Boş bırakılırsa rol adı kullanılır"
                    style={{
                      width: '100%',
                      padding: '8px 11px',
                      borderRadius: theme.radii.sm,
                      border: `1px solid ${theme.colors.border}`,
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      backgroundColor: theme.colors.bgCard,
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                      Giriş E-Posta Adresi *
                    </label>
                    <input
                      type="email"
                      required={createInitialUser}
                      value={initialUserEmail}
                      onChange={(e) => setInitialUserEmail(e.target.value)}
                      placeholder="sosyalmedya@naturalfood.local"
                      style={{
                        width: '100%',
                        padding: '8px 11px',
                        borderRadius: theme.radii.sm,
                        border: `1px solid ${theme.colors.border}`,
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        backgroundColor: theme.colors.bgCard,
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                      Giriş Şifresi (min. 6 karakter) *
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showInitialPassword ? 'text' : 'password'}
                        required={createInitialUser}
                        minLength={6}
                        value={initialUserPassword}
                        onChange={(e) => setInitialUserPassword(e.target.value)}
                        placeholder="••••••"
                        style={{
                          width: '100%',
                          padding: '8px 36px 8px 11px',
                          borderRadius: theme.radii.sm,
                          border: `1px solid ${theme.colors.border}`,
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          backgroundColor: theme.colors.bgCard,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowInitialPassword((v) => !v)}
                        aria-label={showInitialPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: theme.colors.taupe,
                          fontSize: '13px',
                          padding: '2px 4px',
                        }}
                      >
                        {showInitialPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setIsCreateRoleOpen(false);
                resetCreateRoleForm();
              }}
              style={{
                padding: '9px 16px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.bgSurface,
                color: theme.colors.espresso,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isCreatingRole}
              style={{
                padding: '9px 18px',
                borderRadius: theme.radii.sm,
                border: 'none',
                backgroundColor: theme.colors.primary,
                color: theme.colors.textInverse,
                fontSize: '13px',
                fontWeight: 600,
                cursor: isCreatingRole ? 'not-allowed' : 'pointer',
                opacity: isCreatingRole ? 0.7 : 1,
              }}
            >
              {isCreatingRole
                ? 'Oluşturuluyor...'
                : pendingUserRole
                ? 'Kullanıcı Hesabını Oluştur'
                : createInitialUser
                ? 'Rolü ve Hesabı Oluştur'
                : 'Rolü Oluştur'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export const RolePermissionsPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: theme.colors.espresso,
            letterSpacing: '-0.3px',
            margin: 0,
          }}
        >
          Rol & Modül Yetkilendirme Matrisi (Dynamic RBAC)
        </h1>
        <p style={{ fontSize: '13.5px', color: theme.colors.taupe, marginTop: '4px', marginBottom: 0 }}>
          Rollerin modül erişim yetkilerini dinamik aç-kapa anahtarlarıyla yönetin; değişiklikler anlık olarak{' '}
          <code style={{ color: theme.colors.primary, fontWeight: 600 }}>"admin.AuditLogs"</code> kaydına yazılır.
        </p>
      </div>

      <RolePermissionsPanel />
    </div>
  );
};
