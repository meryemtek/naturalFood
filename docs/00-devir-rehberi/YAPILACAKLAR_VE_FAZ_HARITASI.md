# Yol Haritası, Faz Planlaması ve Yapılacak İşler (YAPILACAKLAR)

> **Durum:** Aktif Faz Haritası & To-Do Listesi  
> **Son Güncelleme:** 12 Kasım 2026  
> **Tamamlanan İşler (Günlük):** [YAPILANLAR_VE_TAMAMLANANLAR.md](YAPILANLAR_VE_TAMAMLANANLAR.md)  
> **İlgili Ana Belge:** [docs/README.md](../README.md)  

---

## 🗺️ 1. Sistem Geneli Menü ve Dikey Bağlantı Matrisi

Aşağıdaki tablo, sol menüdeki tüm ekranların bugünkü gerçek bağlanma durumunu ve hangi faza ait olduğunu şeffaf biçimde özetler:

| Menü Grubu | Alt Menü & Rota | Mevcut Frontend Durumu | Backend / DB Durumu | Hedef Faz |
|---|---|---|---|---|
| **Dashboard** | `/dashboard` (Anasayfa) | 🚧 Kısmi (Müşteri Memnuniyeti & 1-3★ Yorumlar ✅ Canlı; Sipariş/Sensör kartları Mock) | `/api/admin/reviews/dashboard-attention` ✅ Canlı | **Faz 3** |
| **Ürün & Menü** | `/products/*` (4 Ekranın Tümü) | ✅ Canlı UI (`FoodProductPages.tsx`) | ✅ `catalog` şeması tam bağlı | *(Tamamlandı)* |
| **Stok & Depo** | `/inventory` (Stok Durumu) | ✅ Canlı UI (`InventoryPage.tsx`) | ✅ `catalog.Products` + `AuditLogs` | *(Tamamlandı)* |
| **Stok & Depo** | `/inventory/suppliers-procurement` | ⚠️ Statik / Mock UI (`SupplierProcurementPage.tsx`) | ❌ DB & API henüz yazılmadı | **Faz 2** |
| **Stok & Depo** | `/inventory/warehouses` (Depo Tanımları) | 🚧 `ModulePlaceholderPage` | ❌ `inventory` şeması bekleniyor | **Faz 2** |
| **Stok & Depo** | `/inventory/transactions` (Stok Hareketleri) | 🚧 `ModulePlaceholderPage` | ❌ `inventory` şeması bekleniyor | **Faz 2** |
| **Stok & Depo** | `/inventory/alerts` (Kritik Stok Uyarıları) | 🚧 `ModulePlaceholderPage` | ⚠️ Kısmen `/inventory` içinde var | **Faz 2** |
| **Sipariş & Sevkiyat** | `/orders/*` & `/shipping/*` (7 Ekran) | 🚧 `ModulePlaceholderPage` | ✅ `Orders`, `Shipment` backend hazır | **Faz 4** |
| **CRM & Destek** | `/crm/reviews` (Müşteri Değerlendirmeleri) | ✅ Canlı UI (`CustomerReviewsPage.tsx`) | ✅ `experience.Reviews` + `customer.Customers` tam bağlı | *(Tamamlandı)* |
| **CRM & Destek** | `/crm/customers`, `/segments`, `/tickets` | 🚧 `ModulePlaceholderPage` | ✅ `Customer` backend hazır | **Faz 5** |
| **Pazarlama** | `/marketing/*` (5 Ekran) | 🚧 `ModulePlaceholderPage` | ✅ `Promotions`, `Content` backend hazır | **Faz 5** |
| **Raporlama** | `/analytics/*` (4 Ekran) | 🚧 `ModulePlaceholderPage` | ❌ Rapor sorguları bekleniyor | **Faz 5** |
| **Yönetim & Güvenlik** | `/admin/login`, `/admin/users`, `/admin/roles`, `/admin/audit-logs` | ✅ Canlı UI (`AdminLoginPage`, `RolePermissionsPage`, `UsersPage`) | ✅ `admin` şeması (Dinamik RBAC + İzole Auth) tam bağlı | *(Tamamlandı)* |
| **Sistem Ayarları** | `/settings/*` (4 Ekran) | 🚧 `ModulePlaceholderPage` | ❌ 2FA / POS / Fatura ayarları | **Faz 3 & 5** |

---

## 📋 2. Faz Haritaları ve Yapılacaklar (Yol Haritası)

*(Not: **Faz 1** — Çekirdek Omurga, Admin & Audit, Doğal Gıda 5 Dikey Dilim ve Mobil Responsive Shell — tamamen bitirilmiş ve [YAPILANLAR_VE_TAMAMLANANLAR.md](YAPILANLAR_VE_TAMAMLANANLAR.md) belgesine taşınmıştır.)*

---

### 🚧 FAZ 2: Stok ve Depo Yönetimi — Kalan 4 Dikey Dilim (AKTİF ODAK)

Stok ve Depo Yönetimi bölümünün `/inventory` dışındaki kalan 4 ekranının `inventory` PostgreSQL şeması üzerinden dikey olarak bağlanması hedeflenir.

#### 2.1. Tedarikçi ve Alım Yönetimi (`/inventory/suppliers-procurement`)
- [ ] **Backend Domain & DB (`inventory` Şeması):** `Supplier` (Yerel Üretici / Kooperatif), `PurchaseOrder` (Satın Alma Siparişi - PO) ve `GoodsReceipt` (Mal Kabul Fişi) varlıklarının ve `InventoryDbContext` migration'ının oluşturulması.
- [ ] **Backend API:** `GET/POST /api/admin/suppliers`, `GET/POST /api/admin/purchase-orders`, `POST /api/admin/goods-receipts` (Mal kabul onaylandığında soğuk zincir kontrolü, otomatik yeni Parti/Lot oluşturma ve genel stok artışı).
- [ ] **Frontend Entegrasyonu:** Mevcut [`SupplierProcurementPage.tsx`](../../frontend/src/pages/inventory/SupplierProcurementPage.tsx) içindeki mock dizilerin kaldırılıp canlı API servisine bağlanması, "+ Yeni Alım Siparişi" ve "Mal Kabul Onayla" modallarının eklenmesi.

#### 2.2. Depo Tanımları (`/inventory/warehouses`)
- [ ] **Backend & DB:** `Warehouse` (Merkez Depo, +4°C Soğuk Hava Deposu, Derin Dondurucu Ünitesi, Mağaza/Şube) ve `WarehouseStock` varlıklarının kurulması.
- [ ] **Backend API & UI:** Depo ekleme, düzenleme, sıcaklık sensörü bilgisi ve depo bazlı stok dağılımı ekranının geliştirilmesi.

#### 2.3. Stok Hareketleri ve Fişler (`/inventory/transactions`)
- [ ] **Backend & DB:** `StockMovement` entity'si (`Inbound`, `Outbound`, `Transfer`, `Adjustment`, `WriteOff` hareket tipleri).
- [ ] **Otomasyon:** `/inventory` (+1/-1), `/products/lot-expiry` (Parti ekleme ve fire düşümü) ve mal kabul işlemlerinin her birinin bu tabloya hareket fişi kaydetmesi.
- [ ] **Frontend UI:** Tarih, ürün, depo ve hareket tipine göre filtrelenebilir hareket defteri ekranı.

#### 2.4. Kritik Stok Uyarıları (`/inventory/alerts`)
- [ ] **Backend & UI:** Ürün bazlı minimum emniyet stoğu (`SafetyStockThreshold`) tanımlama, eşik altına düşen ve tükenen ürünleri özel alarm merkezinde listeleme; tek tıkla "Tedarikçiden Sipariş Ver" yönlendirmesi.

---

### 🔐 FAZ 3: Ana Sayfa (Dashboard) Canlı Verileri & Admin JWT Güvenliği

#### 3.1. Dashboard Canlı Veri Entegrasyonu (`/dashboard`)
- [ ] **Backend Özeti API:** `GET /api/admin/dashboard/summary` ucunun oluşturulması (Toplam ürün, kritik stok, <7 gün kalan SKT partileri, günlük sipariş ve ciro özeti).
- [ ] **Frontend Bağlantısı:** [`DashboardPage.tsx`](../../frontend/src/pages/dashboard/DashboardPage.tsx) içindeki mock dizilerin (`shelfItems`, `orders` vb.) gerçek API verilerine bağlanması.

#### 3.2. Admin Oturum Yönetimi & Dinamik RBAC Yetkilendirme
- [x] **Backend Security & Dinamik RBAC:** `POST /api/admin/auth/login` ucu, `Role`/`ModulePermission`/`RolePermission` tabloları ve tüm admin uçlarında `.RequirePermission(...)` (`PermissionEndpointFilter`) ile `SuperAdmin` bypass / diğer roller için fail-closed yetki kontrolü bağlandı.
- [x] **Frontend İzole Login & Guard:** `/admin/login` (`AdminLoginPage.tsx`), `PermissionContext.tsx` (`nf_admin_session`), `AdminAuthGuard`, `PermissionGuard` ve tek adımda yeni rol + giriş hesabı oluşturma tamamlandı.
- [ ] **Profil & 2FA (`/settings/security`):** Yönetici şifre değiştirme modalı ve iki aşamalı doğrulama yapılandırması.

---

### 📦 FAZ 4: Sipariş ve Sevkiyat Yönetimi (Admin Operasyon Ekranları)

*(Not: Backend tarafında `OrdersDbContext`, `OrdersModuleExtensions` ve `ShipmentEndpoints` halihazırda mevcuttur. Bu fazda Admin yönetim uçları ve React arayüzleri bağlanacaktır.)*

#### 4.1. Sipariş Yaşam Döngüsü (`/orders/*`)
- [ ] **Backend Admin Uçları:** `GET /api/admin/orders` (filtreli/sayfalı), `PATCH /api/admin/orders/{id}/status` (`Sipariş Alındı` -> `Hazırlanıyor` -> `Kuryede` -> `Teslim Edildi` -> `İptal/İade`).
- [ ] **Frontend Ekranları:** Tüm Siparişler (`/orders`), Bekleyenler (`/orders/pending`), Tamamlananlar (`/orders/completed`), İptal & İade Talepleri (`/orders/returns`).

#### 4.2. Sevkiyat, Kargo ve Soğuk Zincir Lojistiği (`/shipping/*`)
- [ ] **Frontend & API:** Sevkiyat ve Kargo Takibi (`/shipping/shipments`), Kargo Entegrasyonları (`/shipping/carriers` - Termobox/Frigorifik kurye ve Yurtiçi/MNG), Teslimat Bölgeleri (`/shipping/zones` - İlçe bazlı soğuk teslimat saatleri).

---

### 📊 FAZ 5: CRM, Pazarlama, Analitik ve Sistem Ayarları

#### 5.1. Müşteri İlişkileri ve Destek (`/crm/*`)
- [ ] Backend'de hazır olan `CustomerDbContext` ve `ExperienceDbContext` üzerinden Admin ekranlarının açılması:
  - Müşteri Listesi (`/crm/customers`), Müşteri Segmentleri (`/crm/segments`).
  - Destek Biletleri (`/crm/tickets`) *(Not: `/crm/reviews` tamamlandı ✅)*.

#### 5.2. Pazarlama ve Kampanya Yönetimi (`/marketing/*`)
- [ ] Backend'deki `PromotionsDbContext` ve `ContentDbContext` verilerinin Admin arayüzüne bağlanması:
  - İndirim Kuponları (`/marketing/coupons`), Promosyon & Kampanyalar (`/marketing/campaigns`).
  - SKT yaklaşan ürünler için otomatik Flaş İndirimler (`/marketing/flash-sales`).
  - Sadakat Puan Programı (`/marketing/loyalty`) ve E-Bülten/SMS (`/marketing/newsletters`).

#### 5.3. Raporlama, Analitik & Ayarlar (`/analytics/*`, `/settings/*`)
- [ ] Satış (`/analytics/sales`), Gelir/Ciro (`/analytics/revenue`), Ürün Performansı (`/analytics/products`) ve Ziyaretçi/Sepet (`/analytics/traffic`) panoları.
- [ ] Ödeme Sistemleri (`/settings/payments`), E-Fatura (`/settings/invoicing`) ve Genel Mağaza Ayarları (`/settings/general`).

---

### 🌐 FAZ 6: Müşteri Web Vitrini (Storefront) & Üretim Dağıtımı (CI/CD)

- [ ] **Müşteri Vitrini Bağlantısı:** E-ticaret web arayüzünün mevcut `ApiHost` uçlarına (`/api/catalog/*`, `/api/content/home`, `/api/cart/*`, `/api/orders/*`, `/api/auth/*`) bağlanması.
- [ ] **Production Containerization:** Backend (.NET 10) ve Frontend (Nginx + React) için multi-stage `Dockerfile` hazırlığı.
- [ ] **Operasyonel Güvence:** Otomatik PostgreSQL yedekleme script'leri, Rate Limiting sıkılaştırması, HealthCheck & Prometheus/Grafana metrik entegrasyonu.

---

## 🧭 3. Sorumluluk ve Roller Matrisi

| Rol | Sorumlu Birim | İlgili Dizin |
|---|---|---|
| **Çekirdek Mimari & Shell** | Mimari Ekip | `frontend/src/components/layout/`, `docs/01-mimari-ve-altyapi/` |
| **Backend & Veritabanı** | Backend Ekibi | `backend/src/Domain/`, `Application/`, `Infrastructure/`, `Endpoints/` |
| **İş Modülleri UI** | Frontend Ekibi | `frontend/src/pages/`, `frontend/src/services/` |
| **Güvenlik & DevSecOps** | Güvenlik Sorumlusu | `docker/`, `docs/02-kasa-ve-operasyon/` |
| **QA & Otomasyon** | Test Ekibi | `docs/04-test-ve-rehberler/` |
