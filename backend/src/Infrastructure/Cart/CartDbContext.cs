using Domain.Entities.Cart;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Cart;

public class CartDbContext(DbContextOptions<CartDbContext> options) : DbContext(options)
{
    public DbSet<ShoppingCart> Carts => Set<ShoppingCart>();
    public DbSet<CartItem> Items => Set<CartItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("cart");
        modelBuilder.Entity<ShoppingCart>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.CustomerId).IsUnique();
            b.HasIndex(x => x.GuestTokenHash).IsUnique();
            b.Property(x => x.GuestTokenHash).HasMaxLength(64);
            b.Property(x => x.CouponCode).HasMaxLength(64);
            b.ToTable(t => t.HasCheckConstraint("CK_cart_owner", "(\"CustomerId\" IS NULL) <> (\"GuestTokenHash\" IS NULL)"));
            b.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.CartId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<CartItem>(b =>
        {
            b.HasKey(x => x.Id);
            b.ToTable(t => t.HasCheckConstraint("CK_cart_quantity", "\"Quantity\" > 0 AND \"Quantity\" <= 100"));
            b.HasIndex(x => new { x.CartId, x.ProductId, x.VariantId }).IsUnique().AreNullsDistinct(false);
        });
    }
}
