using Microsoft.EntityFrameworkCore;
using CustomerEntity = Domain.Entities.Customer.Customer;
using Domain.Entities.Customer;

namespace Infrastructure.Persistence;

public class CustomerDbContext : DbContext
{
    public const string DefaultSchema = "customer";

    public CustomerDbContext(DbContextOptions<CustomerDbContext> options) : base(options)
    {
    }

    public DbSet<CustomerEntity> Customers => Set<CustomerEntity>();
    public DbSet<CustomerAddress> CustomerAddresses => Set<CustomerAddress>();
    public DbSet<Wishlist> Wishlists => Set<Wishlist>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Şema izolasyonu
        modelBuilder.HasDefaultSchema(DefaultSchema);

        // Yalnızca Customer modülüne ait konfigürasyonları uygula
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(CustomerDbContext).Assembly,
            t => t.Namespace?.Contains("Customer") == true);
    }
}
