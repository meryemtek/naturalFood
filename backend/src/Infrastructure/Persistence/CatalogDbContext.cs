using Domain.Entities.Catalog;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class CatalogDbContext : DbContext
{
    public const string DefaultSchema = "catalog";

    public CatalogDbContext(DbContextOptions<CatalogDbContext> options) : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductLot> ProductLots => Set<ProductLot>();
    public DbSet<StorageCondition> StorageConditions => Set<StorageCondition>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Şema izolasyonu
        modelBuilder.HasDefaultSchema(DefaultSchema);

        // Yalnızca Catalog modülüne ait konfigürasyonları uygula
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CatalogDbContext).Assembly, t => t.Namespace?.Contains("Catalog") == true);
    }
}
