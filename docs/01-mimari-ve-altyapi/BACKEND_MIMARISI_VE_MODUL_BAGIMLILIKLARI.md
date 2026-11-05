# Backend Mimarisi, Modüler Monolit ve Şema İzolasyonu

> **Durum:** Teknik Mimari Belgesi  
> **Hedef:** .NET 10 Modüler Monolit omurgasının, katmanlarının ve şema izolasyonu kurallarının açıklanması.  
> **Son Güncelleme:** 5 Kasım 2026  
> **İlgili Ana Belge:** [docs/README.md](../README.md)  

---

## 🏛️ 1. Mimari Genel Bakış (Modüler Monolit)

Bu projede backend, mikroservislerin getirdiği ağ karmaşıklığı (network latency, distributed transaction) olmadan, mikroservislerin modülerlik ve ayrışma avantajlarını sağlayan **Modüler Monolit (Modular Monolith)** mimarisi üzerine inşa edilmiştir.

### Temel Prensipler:
1. **Tek Bir Host (ApiHost):** Tüm modüller tek bir ASP.NET Core 10 Web API uygulaması altında çalışır.
2. **Kendi Kendine Yeten Modüller:** Her modül kendi Domain, Application, Infrastructure ve Endpoints katmanlarına sahiptir.
3. **Katı Kapsülleme (Encapsulation):** Host projesi modüllerin iç sınıflarını (DbContext, Repository, Entity) bilmez. Yalnızca modülün sunduğu `AdminModuleExtensions` üzerinden DI kaydı (`AddAdminModule`) ve rota haritalaması (`MapAdminEndpoints`) yapar.
4. **Veritabanı Şema İzolasyonu:** Her modül PostgreSQL üzerinde kendi şemasına (`admin`, `inventory`, `catalog`) sahiptir.

```
backend/
├── ModularAdmin.slnx
└── src/
    ├── Host/
    │   └── ApiHost/                    --> ASP.NET Core 10 Minimal API Host
    │       ├── Program.cs
    │       └── appsettings.json
    └── Modules/
        └── Admin/
            ├── Admin.Domain/           --> Entity'ler, Enum'lar, Domain Exceptions
            ├── Admin.Application/      --> DTO'lar, Servisler, CQRS, Hashers, Validation
            ├── Admin.Infrastructure/   --> AdminDbContext, EF Core 10 Configurations, Migrations
            └── Admin.Endpoints/        --> Minimal API Rotaları, AdminModuleExtensions
```

---

## 🔒 2. PostgreSQL 18 Şema İzolasyonu ve Bağımsız Migration

Çoğu monolit projede tüm tablolar varsayılan `public` şemasına atılır ve tek bir `__EFMigrationsHistory` tablosu tutulur. Bu durum projeler büyüdüğünde migration çakışmalarına (merge conflicts) neden olur.

Bu sorunu çözmek için projemizde **Şema İzolasyonu** uygulanmıştır:

### A. Varsayılan Şema Tanımı
`AdminDbContext` içinde tüm tablolar otomatik olarak `"admin"` şemasına bağlanır:
```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    modelBuilder.HasDefaultSchema("admin");

    modelBuilder.ApplyConfiguration(new AdminUserConfiguration());
    modelBuilder.ApplyConfiguration(new AuditLogConfiguration());
}
```

### B. Bağımsız Migration Geçmişi
EF Core konfigürasyonunda migration tablosu şemaya özel izole edilir:
```csharp
services.AddDbContext<AdminDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory_Admin", "admin");
    }));
```
Bu sayede yarın `Inventory` veya `Catalog` modülü eklendiğinde `__EFMigrationsHistory_Inventory` tablosunu kullanacak ve `Admin` modülünün veritabanı yaşam döngüsünü kesinlikle etkilemeyecektir.

---

## 🔑 3. Güvenlik ve Şifreleme: PBKDF2 SHA-256

Yönetici şifreleri asla düz metin (plain text) olarak saklanamaz. `Admin.Application` katmanında endüstri standardı `IPasswordHasher` arayüzü ve PBKDF2 SHA-256 algoritması kullanılmıştır:

* **Tuzlama (Salting):** Her şifre için 128-bit (16 byte) kriptografik rastgele tuz üretilir.
* **İterasyon Sayısı:** 100.000 iterasyon ile brute-force ve rainbow table saldırılarına karşı korunur.
* **Format:** Hash çıktısı `PBKDF2${salt_base64}${subkey_base64}` formatında `admin.AdminUsers.PasswordHash` sütununda saklanır.

---

## 📜 4. Otomatik Denetim İzi (Audit Log Engine)

Herhangi bir yönetici kritik bir işlem gerçekleştirdiğinde (yeni yönetici oluşturma, yetki değiştirme, durum güncelleme), `AdminService` içerisinde işlemle atomik olarak bir `AuditLog` kaydı açılır:

```csharp
var auditLog = new AuditLog(
    adminUserId: user.Id,
    action: "CreateUser",
    resource: nameof(AdminUser),
    ipAddress: ipAddress,
    details: System.Text.Json.JsonSerializer.Serialize(new { user.Email, user.FullName, Role = user.Role.ToString() })
);
_dbContext.AuditLogs.Add(auditLog);
await _dbContext.SaveChangesAsync(cancellationToken);
```

Bu loglar API üzerinden `GET /api/admin/audit-logs` ucuyla sayfalanabilir (paginated) ve filtrelenebilir olarak sunulur.

---

## 🚀 5. Minimal API Uç Noktaları ve Modül Sözleşmesi

Modülün tüm dışa açılan kapısı `AdminModuleExtensions` üzerinden `IEndpointRouteBuilder`'a eklenir:

| Metot | Uç Nokta | Açıklama |
|---|---|---|
| `GET` | `/api/admin/health` | Modül canlılık kontrolü |
| `GET` | `/api/admin/users` | Sayfalanabilir admin kullanıcıları listesi (`page`, `pageSize`, `search`, `role`) |
| `GET` | `/api/admin/users/{id}` | Tekil admin kullanıcısı detayı |
| `POST` | `/api/admin/users` | Yeni admin oluşturma (Email, FullName, Password, Role) |
| `PATCH` | `/api/admin/users/{id}/status` | Kullanıcıyı aktif veya pasife alma |
| `GET` | `/api/admin/audit-logs` | Sayfalanabilir sistem denetim logları |

### Hata Yönetimi:
Tüm hatalar RFC 7807 standardında `ProblemDetails` formatında JSON olarak döndürülür:
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Validation Failed",
  "status": 400,
  "detail": "Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut."
}
```
