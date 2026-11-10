using Domain.Entities.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations.Catalog;

public class StorageConditionConfiguration : IEntityTypeConfiguration<StorageCondition>
{
    public void Configure(EntityTypeBuilder<StorageCondition> builder)
    {
        builder.ToTable("StorageConditions");

        builder.HasKey(sc => sc.Id);

        builder.Property(sc => sc.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(sc => sc.MinTemperature)
            .HasPrecision(5, 2)
            .IsRequired();

        builder.Property(sc => sc.MaxTemperature)
            .HasPrecision(5, 2)
            .IsRequired();

        builder.Property(sc => sc.MaxHumidity);

        builder.Property(sc => sc.RequiresColdChain)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(sc => sc.DefaultShelfZone)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(sc => sc.Description)
            .HasMaxLength(1000);

        builder.Property(sc => sc.CreatedAtUtc)
            .IsRequired();

        builder.HasMany(sc => sc.Products)
            .WithOne(p => p.StorageCondition)
            .HasForeignKey(p => p.StorageConditionId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
