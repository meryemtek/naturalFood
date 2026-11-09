using Application.Common.Interfaces;
using Domain.Entities.Admin;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class AdminDbContext : DbContext, IAdminDbContext
{
    public const string DefaultSchema = "admin";

    public AdminDbContext(DbContextOptions<AdminDbContext> options) : base(options)
    {
    }

    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Modül şeması izolasyonu
        modelBuilder.HasDefaultSchema(DefaultSchema);

        // Fluent API IEntityTypeConfiguration sınıflarını uygula
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AdminDbContext).Assembly);
    }
}
