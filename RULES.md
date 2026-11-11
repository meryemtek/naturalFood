# Geliştirici & AI Kuralları

- **TEMİZ FRONTEND MİMARİSİ:** Frontend tek bir `frontend/src/` dizini altında standart React 19 + TypeScript + Vite mimarisine sahiptir (gereksiz monorepo ve çoklu src yapıları kaldırılmıştır).
- **DASHBOARD VE ADMİN AYRIMI:** Gösterge Paneli (`pages/dashboard/DashboardPage.tsx`) ile Sistem Yöneticisi sayfaları (`pages/admin/UsersPage.tsx`, `pages/admin/AuditLogsPage.tsx`) kesinlikle aynı yerde tutulamaz; bağımsız sayfa ve rotalar olarak yapılandırılır.
- **BİLEŞEN VE DÜZEN STANDARDI:**
  - Ortak navigasyon ve şablon `src/components/layout/` (`Sidebar`, `Header`, `MainLayout`) altındadır.
  - Tekrar kullanılabilir arayüz parçaları `src/components/common/` (`Modal`, `StatCard`, `StatusBadge` vb.) altındadır.
  - Yeni bir iş alanı veya sayfa ekleneceğinde `src/pages/[alan-adi]/` altında bağımsız sayfası oluşturulur ve `src/App.tsx` rotalarına eklenir.
- **MOBİL VE RESPONSIVE TASARIM ZORUNLULUĞU:** Yapılan her yeni sayfa, kart, tablo, modal ve buton %100 mobil uyumlu (responsive) olmak zorundadır:
  - Grid yapılarda asla sabit `minmax(360px, 1fr)` kullanılmaz; mutlaka `minmax(min(100%, ...), 1fr)` kullanılır.
  - Uzun buton/etiketlerde `whiteSpace: 'nowrap'` yerine esnek sarmalama (`whiteSpace: 'normal'`, `maxWidth: '100%'`) ve esnek kapsayıcılar (`minWidth: 0`, `flexWrap: 'wrap'`) kullanılır.
  - Geniş tablolar her zaman `overflowX: 'auto'` ve `width: '100%'` kapsayıcıları içine alınır.
