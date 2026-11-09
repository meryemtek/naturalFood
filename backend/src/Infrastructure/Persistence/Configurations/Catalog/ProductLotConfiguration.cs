using Domain.Entities.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations.Catalog;

public class ProductLotConfiguration : IEntityTypeConfiguration<ProductLot>
{
    public void Configure(EntityTypeBuilder<ProductLot> builder)
    {
        builder.ToTable("ProductLots");

        builder.HasKey(pl => pl.Id);

        builder.Property(pl => pl.LotNumber)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(pl => pl.LotNumber);

        builder.Property(pl => pl.ProductionDate)
            .IsRequired();

        builder.Property(pl => pl.ExpiryDate)
            .IsRequired();

        builder.Property(pl => pl.Quantity)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(pl => pl.Status)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("Active");

        builder.Property(pl => pl.CreatedAtUtc)
            .IsRequired();

        builder.HasOne(pl => pl.Product)
            .WithMany(p => p.Lots)
            .HasForeignKey(pl => pl.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(pl => pl.ProductId);
        builder.HasIndex(pl => pl.ExpiryDate);
        builder.HasIndex(pl => pl.Status);
    }
}
