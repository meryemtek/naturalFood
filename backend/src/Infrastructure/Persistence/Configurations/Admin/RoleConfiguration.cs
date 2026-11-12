using Domain.Entities.Admin;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations.Admin;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public static readonly Guid SuperAdminRoleId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1");
    public static readonly Guid BranchManagerRoleId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2");
    public static readonly Guid WarehouseStaffRoleId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3");

    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles", AdminDbContext.DefaultSchema);

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(x => x.Name)
            .IsUnique();

        builder.Property(x => x.Description)
            .IsRequired()
            .HasMaxLength(500);

        builder.HasData(
            new
            {
                Id = SuperAdminRoleId,
                Name = "SuperAdmin",
                Description = "Süper Yönetici — Tüm sistem modüllerine sınırsız erişim (Bypass)"
            },
            new
            {
                Id = BranchManagerRoleId,
                Name = "BranchManager",
                Description = "Şube Müdürü — Stok, ürün ve sipariş yönetimi yetkili; finans/ciro ve CRM izinleri dinamik yönetilir"
            },
            new
            {
                Id = WarehouseStaffRoleId,
                Name = "WarehouseStaff",
                Description = "Depo Personeli — Stok, envanter ve saklama koşulları modülleri"
            }
        );
    }
}
