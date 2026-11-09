using Domain.Entities.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations.Catalog;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(p => p.Slug)
            .IsRequired()
            .HasMaxLength(270);

        builder.HasIndex(p => p.Slug)
            .IsUnique();

        builder.Property(p => p.ShortDescription)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(p => p.Description)
            .HasMaxLength(5000);

        builder.Property(p => p.BasePrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(p => p.DiscountPrice)
            .HasPrecision(18, 2);

        builder.Property(p => p.StockQuantity)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(p => p.Sku)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(p => p.Sku)
            .IsUnique();

        builder.Property(p => p.UnitInfo)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(p => p.Ingredients)
            .HasMaxLength(2000);

        builder.Property(p => p.Allergens);

        builder.Property(p => p.Certifications);

        builder.OwnsOne(p => p.NutritionalValues, b =>
        {
            b.ToJson();
        });

        builder.Property(p => p.Origin)
            .HasMaxLength(200);

        builder.Property(p => p.StorageConditions)
            .HasMaxLength(1000);

        builder.Property(p => p.ShelfLife)
            .HasMaxLength(200);

        builder.Property(p => p.IsBestSeller)
            .HasDefaultValue(false);

        builder.Property(p => p.IsNew)
            .HasDefaultValue(true);

        builder.Property(p => p.IsFeatured)
            .HasDefaultValue(false);

        builder.Property(p => p.IsSeasonal)
            .HasDefaultValue(false);

        builder.Property(p => p.IsActive)
            .HasDefaultValue(true);

        builder.Property(p => p.CreatedAtUtc)
            .IsRequired();

        // Performans ve filtreleme indexleri
        builder.HasIndex(p => p.CategoryId);
        builder.HasIndex(p => p.IsActive);
        builder.HasIndex(p => new { p.IsActive, p.IsBestSeller });
        builder.HasIndex(p => new { p.IsActive, p.IsFeatured });
        builder.HasIndex(p => new { p.IsActive, p.IsSeasonal });
        builder.HasIndex(p => new { p.IsActive, p.BasePrice });

        // Varyantlar (Cascade delete)
        builder.HasMany(p => p.Variants)
            .WithOne(v => v.Product)
            .HasForeignKey(v => v.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Görseller (Cascade delete)
        builder.HasMany(p => p.Images)
            .WithOne(i => i.Product)
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
