using Domain.Entities.Admin;
using Domain.Enums.Admin;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations.Admin;

public class AdminUserConfiguration : IEntityTypeConfiguration<AdminUser>
{
    public void Configure(EntityTypeBuilder<AdminUser> builder)
    {
        builder.ToTable("AdminUsers", AdminDbContext.DefaultSchema);

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(x => x.Email)
            .IsUnique();

        builder.Property(x => x.FullName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.PasswordHash)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.Role)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.CustomRoleName)
            .IsRequired(false)
            .HasMaxLength(100);

        builder.Property(x => x.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();

        builder.Property(x => x.LastLoginAtUtc)
            .IsRequired(false);

        // Seed Yönetici Hesapları (PBKDF2 SHA256 - 100.000 iterasyon)
        builder.HasData(
            new
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Email = "superadmin@ecommerce.local",
                FullName = "Super Administrator",
                PasswordHash = "dGVzdHNhbHQxMjM0NTY3OA==.2YVj2w+Y1924k87hF06gKjZJ8N9c1kL4A7VzE1s5D8Q=",
                Role = AdminRole.SuperAdmin,
                CustomRoleName = (string?)null,
                IsActive = true,
                CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                LastLoginAtUtc = (DateTime?)null
            },
            new
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111112"),
                Email = "superadmin@naturalfood.local",
                FullName = "Süper Yönetici",
                PasswordHash = "TmF0dXJhbEZvb2RTYWx0MQ==.+uX/EkfMITMSbJleGGUXLsXLb3dNarW44H5g4Xks7I0=",
                Role = AdminRole.SuperAdmin,
                CustomRoleName = (string?)null,
                IsActive = true,
                CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                LastLoginAtUtc = (DateTime?)null
            },
            new
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111113"),
                Email = "sube.muduru@naturalfood.local",
                FullName = "Ayşe Kaya (Şube Müdürü)",
                PasswordHash = "TmF0dXJhbEZvb2RTYWx0Mg==./aqDXCzLl7Y+D5ZPqpiCsM1Cc67ItgkQwU5oPR0hOzs=",
                Role = AdminRole.BranchManager,
                CustomRoleName = (string?)null,
                IsActive = true,
                CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                LastLoginAtUtc = (DateTime?)null
            },
            new
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111114"),
                Email = "depo@naturalfood.local",
                FullName = "Mehmet Yılmaz (Depo Personeli)",
                PasswordHash = "TmF0dXJhbEZvb2RTYWx0Mw==.K1NnRkI8m5l7MWfy8PiGbvkcKDmyuQIjoofEMCcrEPU=",
                Role = AdminRole.WarehouseStaff,
                CustomRoleName = (string?)null,
                IsActive = true,
                CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                LastLoginAtUtc = (DateTime?)null
            }
        );
    }
}
