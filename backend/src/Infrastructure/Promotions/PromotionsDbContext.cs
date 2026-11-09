using Domain.Entities.Promotions;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Promotions;
public class PromotionsDbContext(DbContextOptions<PromotionsDbContext> options) : DbContext(options)
{
    public DbSet<Coupon> Coupons => Set<Coupon>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("promotions");
        modelBuilder.Entity<Coupon>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Code).HasMaxLength(64).IsRequired();
            b.HasIndex(x => x.Code).IsUnique();
            b.Property(x => x.DiscountType).HasMaxLength(12).IsRequired();
            b.Property(x => x.DiscountValue).HasPrecision(18, 2);
            b.Property(x => x.MinimumSubtotal).HasPrecision(18, 2);
            b.ToTable(t =>
            {
                t.HasCheckConstraint("CK_coupon_code", "\"Code\" = upper(\"Code\") AND length(\"Code\") BETWEEN 1 AND 64");
                t.HasCheckConstraint("CK_coupon_discount", "(\"DiscountType\" = 'Percent' AND \"DiscountValue\" > 0 AND \"DiscountValue\" <= 100) OR (\"DiscountType\" = 'Fixed' AND \"DiscountValue\" > 0)");
                t.HasCheckConstraint("CK_coupon_limits", "\"MinimumSubtotal\" >= 0 AND \"UsageCount\" >= 0 AND (\"UsageLimit\" IS NULL OR (\"UsageLimit\" > 0 AND \"UsageCount\" <= \"UsageLimit\"))");
                t.HasCheckConstraint("CK_coupon_scope", "NOT (\"ProductId\" IS NOT NULL AND \"CategoryId\" IS NOT NULL)");
                t.HasCheckConstraint("CK_coupon_dates", "\"EndsAtUtc\" IS NULL OR \"StartsAtUtc\" IS NULL OR \"EndsAtUtc\" > \"StartsAtUtc\"");
            });
        });
    }
}
