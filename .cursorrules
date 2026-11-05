# Geliştirici & AI Kuralları

- Bu projede **Modüler Kabuk (Pluggable Shell)** mimarisi kullanılır.
- **ÇEKİRDEK KURAL:** `"packages/admin-core"` altındaki `Layout`, `Shell` veya `Sidebar` dosyalarına dokunulamaz, içeriği elle değiştirilemez.
- Yeni bir özellik/sayfa ekleneceği zaman:
  1. `"src/modules/[ozellik-adi]/"` (veya tüketici uygulamada `apps/web-app/src/modules/[ozellik-adi]/`) altında yeni bir klasör açılır.
  2. Sayfa bileşeni yazılır ve `AdminFeatureModule` sözleşmesi (`id`, `title`, `navItems`, `routes`) ile `export` edilir.
  3. Oluşturulan modül, yalnızca `App.tsx` içindeki `AdminShell` bileşeninin `modules` dizisine parametre olarak eklenir.
