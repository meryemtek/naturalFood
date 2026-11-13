using Domain.Entities.Admin;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations.Admin;

public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("RolePermissions", AdminDbContext.DefaultSchema);

        builder.HasKey(x => new { x.RoleId, x.PermissionKey });

        builder.Property(x => x.PermissionKey)
            .IsRequired()
            .HasMaxLength(120);

        builder.HasOne(x => x.Role)
            .WithMany(r => r.RolePermissions)
            .HasForeignKey(x => x.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.ModulePermission)
            .WithMany(p => p.RolePermissions)
            .HasForeignKey(x => x.PermissionKey)
            .HasPrincipalKey(p => p.Key)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasData(
            // SuperAdmin
            new { RoleId = RoleConfiguration.SuperAdminRoleId, PermissionKey = "products.view" },
            new { RoleId = RoleConfiguration.SuperAdminRoleId, PermissionKey = "inventory.view" },
            new { RoleId = RoleConfiguration.SuperAdminRoleId, PermissionKey = "storage.view" },
            new { RoleId = RoleConfiguration.SuperAdminRoleId, PermissionKey = "crm.reviews" },
            new { RoleId = RoleConfiguration.SuperAdminRoleId, PermissionKey = "crm.manage" },
            new { RoleId = RoleConfiguration.SuperAdminRoleId, PermissionKey = "finance.reports" },
            new { RoleId = RoleConfiguration.SuperAdminRoleId, PermissionKey = "orders.view" },
            new { RoleId = RoleConfiguration.SuperAdminRoleId, PermissionKey = "orders.manage" },
            new { RoleId = RoleConfiguration.SuperAdminRoleId, PermissionKey = "marketing.view" },
            new { RoleId = RoleConfiguration.SuperAdminRoleId, PermissionKey = "users.manage" },

            // BranchManager (Şube Müdürü): Stok, Depo, Ürün ve Sipariş açık; Finans/Ciro, CRM, Pazarlama ve Yetki yönetimi kapalı
            new { RoleId = RoleConfiguration.BranchManagerRoleId, PermissionKey = "products.view" },
            new { RoleId = RoleConfiguration.BranchManagerRoleId, PermissionKey = "inventory.view" },
            new { RoleId = RoleConfiguration.BranchManagerRoleId, PermissionKey = "storage.view" },
            new { RoleId = RoleConfiguration.BranchManagerRoleId, PermissionKey = "orders.view" },
            new { RoleId = RoleConfiguration.BranchManagerRoleId, PermissionKey = "orders.manage" },

            // WarehouseStaff (Depo Personeli): Yalnızca Envanter ve Saklama Koşulları
            new { RoleId = RoleConfiguration.WarehouseStaffRoleId, PermissionKey = "inventory.view" },
            new { RoleId = RoleConfiguration.WarehouseStaffRoleId, PermissionKey = "storage.view" }
        );
    }
}
