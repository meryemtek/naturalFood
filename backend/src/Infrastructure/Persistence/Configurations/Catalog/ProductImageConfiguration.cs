using Domain.Entities.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations.Catalog;

public class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> builder)
    {
        builder.ToTable("ProductImages");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.ImageUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(i => i.AltText)
            .HasMaxLength(250);

        builder.Property(i => i.DisplayOrder)
            .HasDefaultValue(0);

        builder.Property(i => i.IsMain)
            .HasDefaultValue(false);

        builder.HasIndex(i => i.ProductId);
    }
}
