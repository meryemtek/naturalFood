# Pluggable Shell ve Frontend Genişletilebilirlik Mimarisi

> **Durum:** Teknik Mimari Belgesi  
> **Hedef:** React 19 Monorepo yapısı, Pluggable Shell (Modüler Kabuk) prensibi ve yeni modül ekleme standartları.  
> **Son Güncelleme:** 5 Kasım 2026  
> **İlgili Ana Belge:** [docs/README.md](../README.md)  

---

## 🏛️ 1. Mimari Vizyon: "Boş Kabuk" (Pluggable Shell)

Klasik yönetim panellerinde menü linkleri (Sidebar) ve sayfalar (Routes) tek bir büyük Layout dosyası içine gömülür (hardcoded). Yeni bir modül veya sayfa eklendiğinde Layout bileşeni değiştirilmek zorunda kalınır. Bu durum zamanla spagetti kod üretir ve ekibin birbirinin kodunu ezmesine yol açar.

Bu projede **Pluggable Admin Shell** deseni uygulanmıştır:
1. **Kabuk Boştur (`AdminShell`):** `packages/admin-core` içindeki `AdminShell` bileşeni kendi başına hiçbir menü öğesi veya iş rotası barındırmaz.
2. **Modül Sözleşmesi (`AdminFeatureModule`):** Her iş alanı, sisteme hangi menü elemanlarını (`navItems`) ve hangi rotaları (`routes`) sağlayacağını bir sözleşme nesnesi olarak dışarı sunar.
3. **Çalışma Zamanı Montajı:** Ana uygulama (`apps/web-app/src/App.tsx`), kabuğa istediği modülleri bir dizi halinde iletir (`modules={[userManagementModule, inventoryModule]}`). Kabuk, menüyü ve React Router rotalarını dinamik olarak ayağa kaldırır.

---

## 📁 2. Monorepo Dizin Yapısı

```
frontend/
├── package.json                    --> Workspaces kökü
├── packages/
│   └── admin-core/                 --> Dışa aktarılabilir React 19 kütüphanesi
│       ├── src/
│       │   ├── api/                --> AdminApiClient ve TypeScript modelleri
│       │   ├── components/         --> AdminLayout, AdminTable, Modal, StatusBadge
│       │   ├── components/Shell/   --> AdminShell (Dinamik Kabuk)
│       │   ├── types/module.ts     --> AdminFeatureModule ve NavigationItem sözleşmesi
│       │   └── pages/              --> UsersPage, AuditLogsPage, InventoryPage
│       └── package.json
└── apps/
    └── web-app/                    --> Paketi tüketen ana React uygulaması
        ├── src/
        │   ├── modules/            --> Uygulamaya özel yeni iş modülleri
        │   ├── App.tsx             --> AdminShell'i ve modülleri bağlayan montaj noktası
        │   └── main.tsx
        └── vite.config.ts          --> Port 3000 -> 5000 Proxy yapılandırması
```

---

## 📑 3. Modül Sözleşmesi (`AdminFeatureModule`)

Her yeni özellik şu TypeScript arayüzünü uygulamalıdır (`packages/admin-core/src/types/module.ts`):

```typescript
import { ReactNode } from 'react';

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: string | number;
  requiredPermission?: string;
}

export interface AdminFeatureModule {
  id: string;
  title: string;
  navItems: NavigationItem[];
  routes: {
    path: string;
    element: ReactNode;
  }[];
}
```

---

## 🛠️ 4. Adım Adım Yeni Bir Modül Ekleme Rehberi

Varsayalım ki sisteme yeni bir **"Katalog & Kategori"** modülü eklemek istiyorsunuz:

### Adım 1: Yeni Modül Klasörü Açın
`apps/web-app/src/modules/catalog/` altında klasör açın:
```
apps/web-app/src/modules/catalog/
├── CatalogPage.tsx
└── index.ts
```

### Adım 2: Sayfa Bileşenini Yazın (`CatalogPage.tsx`)
```tsx
export function CatalogPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ürün Kataloğu</h1>
      <p className="text-slate-500">Katalog ürün listesi burada yer alacak.</p>
    </div>
  );
}
```

### Adım 3: Modül Sözleşmesini Dışa Aktarın (`index.ts`)
```typescript
import { AdminFeatureModule } from '@ecommerce/admin-core';
import { CatalogPage } from './CatalogPage';

export const catalogModule: AdminFeatureModule = {
  id: 'catalog',
  title: 'Katalog Yönetimi',
  navItems: [
    {
      id: 'catalog-products',
      label: 'Ürünler',
      path: '/admin/catalog',
      icon: '📦',
    },
  ],
  routes: [
    {
      path: '/admin/catalog',
      element: <CatalogPage />,
    },
  ],
};
```

### Adım 4: Kabuğa Parametre Olarak Ekleyin (`App.tsx`)
`apps/web-app/src/App.tsx` dosyasında modülü içe aktarıp `AdminShell`'in `modules` dizisine ekleyin:
```tsx
import { AdminShell, userManagementModule, inventoryModule } from '@ecommerce/admin-core';
import { catalogModule } from './modules/catalog';

export function App() {
  return (
    <AdminShell
      title="E-Ticaret Yönetim Portalı"
      modules={[userManagementModule, inventoryModule, catalogModule]}
    />
  );
}
```
**Sonuç:** Sol menüde otomatik olarak "Katalog Yönetimi" başlığı altında "Ürünler" linki belirir ve `/admin/catalog` rotası anında çalışır. **Kabuk dosyalarının tek bir satırına bile dokunulmamıştır.**

---

## ⚠️ 5. Çekirdek Kural Hatırlatması ([RULES.md](../../RULES.md))

> **ASLA YAPILMAMASI GEREKEN:**  
> `"packages/admin-core"` altındaki `AdminShell.tsx`, `AdminLayout.tsx` veya `Sidebar.tsx` dosyaları içerisine yeni menü elemanlarını veya sayfaları elle (hardcoded) eklemek kesinlikle yasaktır. Bu kural mimarinin bozulmasını ve gelecekteki modül çakışmalarını engeller.
