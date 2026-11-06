using Domain.Entities.Orders;
using Domain.Entities.Payments;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Orders;
public class OrdersDbContext(DbContextOptions<OrdersDbContext> options) : DbContext(options)
{
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderLine> Lines => Set<OrderLine>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<SimulatedPayment> SimulatedPayments => Set<SimulatedPayment>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("orders");
        modelBuilder.Entity<Order>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.Number).IsUnique();
            b.HasIndex(x => new { x.CartId, x.IdempotencyKey }).IsUnique();
            b.Property(x => x.Number).HasMaxLength(32);
            b.Property(x => x.GuestTokenHash).HasMaxLength(64);
            b.Property(x => x.IdempotencyKey).HasMaxLength(128);
            b.Property(x => x.Email).HasMaxLength(256);
            b.Property(x => x.Phone).HasMaxLength(30);
            b.Property(x => x.DeliveryAddress).HasMaxLength(1000);
            b.Property(x => x.BillingAddress).HasMaxLength(1000);
            b.Property(x => x.Status).HasMaxLength(30);
            b.Property(x => x.CouponCode).HasMaxLength(64);
            b.Property(x => x.Discount).HasPrecision(18, 2);
            b.Property(x => x.Subtotal).HasPrecision(18, 2);
            b.Property(x => x.ShippingFee).HasPrecision(18, 2);
            b.Property(x => x.Total).HasPrecision(18, 2);
            b.HasMany(x => x.Lines).WithOne().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<SimulatedPayment>(b =>
        {
            b.ToTable("SimulatedPayments");
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.OrderId, x.IdempotencyKey }).IsUnique();
            b.Property(x => x.IdempotencyKey).HasMaxLength(128).IsRequired();
            b.Property(x => x.Result).HasMaxLength(20).IsRequired();
            b.Property(x => x.Amount).HasPrecision(18, 2);
            b.HasOne<Order>().WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<Shipment>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.OrderId).IsUnique();
            b.HasOne(x => x.Order).WithOne().HasForeignKey<Shipment>(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
            b.Property(x => x.Carrier).HasMaxLength(150).IsRequired();
            b.Property(x => x.TrackingNumber).HasMaxLength(150).IsRequired();
            b.Property(x => x.Status).HasMaxLength(30).IsRequired();
        });
        modelBuilder.Entity<OrderLine>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(250);
            b.Property(x => x.Sku).HasMaxLength(100);
            b.Property(x => x.UnitPrice).HasPrecision(18, 2);
        });
    }
}
