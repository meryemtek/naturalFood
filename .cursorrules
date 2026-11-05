# Geliştirici & AI Kuralları

- **TEMİZ FRONTEND MİMARİSİ:** Frontend tek bir `frontend/src/` dizini altında standart React 19 + TypeScript + Vite mimarisine sahiptir (gereksiz monorepo ve çoklu src yapıları kaldırılmıştır).
- **DASHBOARD VE ADMİN AYRIMI:** Gösterge Paneli (`pages/dashboard/DashboardPage.tsx`) ile Sistem Yöneticisi sayfaları (`pages/admin/UsersPage.tsx`, `pages/admin/AuditLogsPage.tsx`) kesinlikle aynı yerde tutulamaz; bağımsız sayfa ve rotalar olarak yapılandırılır.
- **BİLEŞEN VE DÜZEN STANDARDI:**
  - Ortak navigasyon ve şablon `src/components/layout/` (`Sidebar`, `Header`, `MainLayout`) altındadır.
  - Tekrar kullanılabilir arayüz parçaları `src/components/common/` (`Modal`, `StatCard`, `StatusBadge` vb.) altındadır.
  - Yeni bir iş alanı veya sayfa ekleneceğinde `src/pages/[alan-adi]/` altında bağımsız sayfası oluşturulur ve `src/App.tsx` rotalarına eklenir.
