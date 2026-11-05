import { BrowserRouter } from 'react-router-dom';
import {
  AdminShell,
  userManagementModule,
  inventoryModule,
  adminApi,
} from '@modular-admin/admin-core';

// Vite reverse proxy (/api) üzerinden backend API'ye bağlan
adminApi.setBaseUrl('/api/admin');

export default function App() {
  return (
    <BrowserRouter>
      <AdminShell
        title="E-Ticaret Modüler Kabuk"
        modules={[
          userManagementModule, // 1. Modül: Yönetici & Denetim (UsersPage, AuditLogsPage)
          inventoryModule,      // 2. Modül: Stok Yönetimi (InventoryPage)
        ]}
        currentUser={{
          name: 'Super Administrator',
          email: 'superadmin@ecommerce.local',
          role: 'SuperAdmin',
        }}
        userMenuSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid #a7f3d0',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                }}
              />
              Pluggable Shell Aktif (2 Modül)
            </span>
          </div>
        }
      />
    </BrowserRouter>
  );
}
