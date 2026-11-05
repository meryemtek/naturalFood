using Admin.Application.Common.Interfaces;
using Admin.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Admin.Infrastructure.Persistence;

public class AdminDbContext : DbContext, IAdminDbContext
{
    public const string DefaultSchema = "admin";

    public AdminDbContext(DbContextOptions<AdminDbContext> options) : base(options)
    {
    }

    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Modül şeması izolasyonu
        modelBuilder.HasDefaultSchema(DefaultSchema);

        // Fluent API IEntityTypeConfiguration sınıflarını uygula
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AdminDbContext).Assembly);
    }
}
