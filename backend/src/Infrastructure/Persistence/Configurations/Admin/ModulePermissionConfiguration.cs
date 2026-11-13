using Domain.Entities.Admin;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations.Admin;

public class ModulePermissionConfiguration : IEntityTypeConfiguration<ModulePermission>
{
    public void Configure(EntityTypeBuilder<ModulePermission> builder)
    {
        builder.ToTable("ModulePermissions", AdminDbContext.DefaultSchema);

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Key)
            .IsRequired()
            .HasMaxLength(120);

        builder.HasIndex(x => x.Key)
            .IsUnique();

        builder.HasAlternateKey(x => x.Key);

        builder.Property(x => x.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Category)
            .IsRequired()
            .HasMaxLength(120);

        builder.HasData(
            new { Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10"), Key = "orders.manage", Title = "Sipariş Durumu ve Talepleri Yönetme", Category = "Sipariş & Lojistik" },
            new
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1"),
                Key = "products.view",
                Title = "Ürün ve Menü Yönetimi",
                Category = "Katalog & Ürün"
            },
            new
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2"),
                Key = "inventory.view",
                Title = "Stok ve Envanter Yönetimi",
                Category = "Stok & Depo"
            },
            new
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3"),
                Key = "storage.view",
                Title = "Depo ve Saklama Koşulları",
                Category = "Stok & Depo"
            },
            new
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4"),
                Key = "crm.reviews",
                Title = "Müşteri Değerlendirmeleri (CRM)",
                Category = "Müşteri İlişkileri"
            },
            new
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5"),
                Key = "finance.reports",
                Title = "Finans / Ciro ve Satış Raporları",
                Category = "Analitik & Finans"
            },
            new
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6"),
                Key = "orders.view",
                Title = "Sipariş ve Sevkiyat İşlemleri",
                Category = "Sipariş & Lojistik"
            },
            new
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7"),
                Key = "users.manage",
                Title = "Kullanıcı, Rol ve Sistem Ayarları",
                Category = "Sistem & Güvenlik"
            },
            new
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8"),
                Key = "crm.manage",
                Title = "Müşteri Listesi, Segmentler ve Destek Biletleri",
                Category = "Müşteri İlişkileri"
            },
            new
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb9"),
                Key = "marketing.view",
                Title = "Pazarlama, Kampanya ve Sadakat Yönetimi",
                Category = "Pazarlama & Kampanya"
            }
        );
    }
}
