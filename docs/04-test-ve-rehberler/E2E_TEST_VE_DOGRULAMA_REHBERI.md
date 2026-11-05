# Uçtan Uca (E2E) Test ve Doğrulama Kılavuzu

> **Durum:** Test ve Kalite Rehberi  
> **Hedef:** Sistem bileşenlerinin, API uçlarının ve kullanıcı arayüzünün otomatik ve manuel doğrulama senaryoları.  
> **Son Güncelleme:** 5 Kasım 2026  
> **İlgili Ana Belge:** [docs/README.md](../README.md)  

---

## 🧪 1. Backend REST API Doğrulama Senaryoları (cURL / PowerShell)

Backend API `http://localhost:5000` portunda çalışırken aşağıdaki komutlarla test edilebilir:

### Test 1: Sistem Sağlık Kontrolü (Health Check)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/health" -Method Get
```
* **Beklenen Yanıt:**
  ```json
  { "status": "Healthy", "module": "AdminModule" }
  ```

---

### Test 2: Seed Yöneticisinin Doğrulanması (Get Users)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/users?page=1&pageSize=10" -Method Get
```
* **Beklenen Yanıt:**
  `items` dizisinde `superadmin@ecommerce.local` kullanıcısının bulunduğu ve rolünün `SuperAdmin` olduğu doğrulanır.

---

### Test 3: Yeni Admin Kullanıcısı Oluşturma (Create User)
```powershell
$body = @{
    email = "testyeniadmin@ecommerce.local"
    fullName = "Test Yeni Admin"
    password = "TestPassword123!"
    role = "Admin"
} | ConvertTo-Json

$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/users" -Method Post -Body $bytes -ContentType "application/json; charset=utf-8"
```
* **Beklenen Yanıt:** HTTP 201 Created ve oluşturulan kullanıcının `AdminUserDto` nesnesi (ID, Email, Rol).

---

### Test 4: Kullanıcı Durumunu Pasife Alma (Update Status)
```powershell
# Oluşturulan kullanıcının ID'si ile:
$patchBody = @{ isActive = $false } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/users/{userId}/status" -Method Patch -Body $patchBody -ContentType "application/json"
```
* **Beklenen Yanıt:** HTTP 204 No Content. Tekrar listelendiğinde `isActive` alanının `false` olduğu görülür.

---

### Test 5: Otomatik Audit Log Doğrulaması
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/audit-logs?page=1&pageSize=10" -Method Get
```
* **Beklenen Yanıt:** Yapılan kullanıcı oluşturma (`CreateUser`) ve durum güncelleme (`UpdateUserStatus`) işlemlerinin IP adresi ve JSON detaylarıyla en üstte listelendiği doğrulanır.

---

## 🌐 2. Frontend ve Vite Proxy Doğrulaması

Frontend `apps/web-app` uygulaması `http://localhost:3000` portunda çalışırken:

1. **Proxy Testi:** Tarayıcı geliştirici konsolunda Network (Ağ) sekmesini açın.
2. `/api/admin/users` isteğinin `http://localhost:3000/api/admin/users` adresine gittiğini ve Vite reverse proxy'si sayesinde CORS hatası almadan HTTP 200 ile döndüğünü gözlemleyin.
3. **Kullanıcı Ekleme Modalı Testi:**
   - Sağ üstteki `[+ Yeni Yönetici]` butonuna tıklayın.
   - Formu doldurun ve "Kaydet"e basın.
   - Tablonun anında güncellendiğini ve yeni kullanıcının satırda belirdiğini teyit edin.
4. **Aktif/Pasif Buton Testi:**
   - Satırdaki `Aktif Yap` veya `Pasif Yap` butonuna tıklayın.
   - Status rozetinin yeşil `Aktif` veya kırmızı `Pasif` durumuna anlık olarak dönüştüğünü gözlemleyin.
5. **Sol Menü (Sidebar) Dinamik Kabuk Testi:**
   - Sol menüde "Yönetici & Denetim" sekmesine tıklandığında `/admin/users` ve `/admin/audit-logs` sayfalarına gidildiğini;
   - "Stok Yönetimi" sekmesine tıklandığında kabuğa bağımsız olarak eklenmiş `/admin/inventory` sayfasına geçildiğini doğrulayın.
