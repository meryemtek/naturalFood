using Domain.Entities.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations.Catalog;

public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> builder)
    {
        builder.ToTable("ProductVariants");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(v => v.Sku)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(v => v.Sku)
            .IsUnique();

        builder.Property(v => v.Price)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(v => v.DiscountPrice)
            .HasPrecision(18, 2);

        builder.Property(v => v.StockQuantity)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(v => v.UnitInfo)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(v => v.DisplayOrder)
            .HasDefaultValue(0);

        builder.Property(v => v.IsActive)
            .HasDefaultValue(true);

        builder.HasIndex(v => v.ProductId);
    }
}
