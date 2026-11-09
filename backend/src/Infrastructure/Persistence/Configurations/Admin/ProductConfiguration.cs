using Domain.Entities.Admin;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations.Admin;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products", AdminDbContext.DefaultSchema);

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(x => x.SKU)
            .HasMaxLength(100)
            .IsRequired(false);

        builder.HasIndex(x => x.SKU)
            .IsUnique()
            .HasFilter("\"SKU\" IS NOT NULL");

        builder.Property(x => x.Barcode)
            .HasMaxLength(100)
            .IsRequired(false);

        builder.HasIndex(x => x.Barcode)
            .IsUnique()
            .HasFilter("\"Barcode\" IS NOT NULL");

        builder.Property(x => x.Category)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(x => x.SaleUnit)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.BasePrice)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m);

        builder.Property(x => x.SellingPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(x => x.StockQuantity)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("Active");

        builder.Property(x => x.ImageUrl)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();

        builder.Property(x => x.UpdatedAtUtc)
            .IsRequired(false);

        // Doğal Gıda Başlangıç Tohum Verileri (Seed Data)
        builder.HasData(
            new
            {
                Id = Guid.Parse("a1111111-1111-1111-1111-111111111111"),
                Name = "Organik Soğuk Sıkım Sızma Zeytinyağı",
                Category = "Zeytinyağı & Şarküteri",
                SKU = "SKU-ORG-OIL-500",
                Barcode = "8690123456012",
                SaleUnit = "Litre",
                BasePrice = 320.00m,
                SellingPrice = 385.00m,
                StockQuantity = 142.00m,
                Status = "Active",
                ImageUrl = (string?)null,
                CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAtUtc = (DateTime?)null
            },
            new
            {
                Id = Guid.Parse("a2222222-2222-2222-2222-222222222222"),
                Name = "Taş Değirmen Organik Siyez Unu",
                Category = "Un & Tahıl Grubu",
                SKU = "SKU-ORG-FLR-1000",
                Barcode = "8690123456029",
                SaleUnit = "Kg",
                BasePrice = 65.00m,
                SellingPrice = 84.50m,
                StockQuantity = 320.00m,
                Status = "Active",
                ImageUrl = (string?)null,
                CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAtUtc = (DateTime?)null
            },
            new
            {
                Id = Guid.Parse("a3333333-3333-3333-3333-333333333333"),
                Name = "Şirden Mayalı Trakya Eski Kaşar Peyniri",
                Category = "Süt & Şarküteri",
                SKU = "SKU-CHZ-KAS-350",
                Barcode = "8690123456036",
                SaleUnit = "Gramaj",
                BasePrice = 175.00m,
                SellingPrice = 215.00m,
                StockQuantity = 4.00m,
                Status = "LowStock",
                ImageUrl = (string?)null,
                CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAtUtc = (DateTime?)null
            },
            new
            {
                Id = Guid.Parse("a4444444-4444-4444-4444-444444444444"),
                Name = "Gezen Tavuk Organik Köy Yumurtası (10'lu)",
                Category = "Kahvaltılık",
                SKU = "SKU-EGG-VIL-10",
                Barcode = "8690123456043",
                SaleUnit = "Adet",
                BasePrice = 85.00m,
                SellingPrice = 110.00m,
                StockQuantity = 2.00m,
                Status = "LowStock",
                ImageUrl = (string?)null,
                CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAtUtc = (DateTime?)null
            },
            new
            {
                Id = Guid.Parse("a5555555-5555-5555-5555-555555555555"),
                Name = "Ham Çiğ Fıstık & Badem Karışımı",
                Category = "Kuru Yemiş",
                SKU = "SKU-NUT-MIX-250",
                Barcode = "8690123456050",
                SaleUnit = "Gramaj",
                BasePrice = 130.00m,
                SellingPrice = 165.00m,
                StockQuantity = 0.00m,
                Status = "OutOfStock",
                ImageUrl = (string?)null,
                CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAtUtc = (DateTime?)null
            },
            new
            {
                Id = Guid.Parse("a6666666-6666-6666-6666-666666666666"),
                Name = "Doğal Yayık Köy Tereyağı",
                Category = "Süt & Şarküteri",
                SKU = "SKU-BTR-YAY-500",
                Barcode = "8690123456067",
                SaleUnit = "Kg",
                BasePrice = 240.00m,
                SellingPrice = 290.00m,
                StockQuantity = 42.00m,
                Status = "Active",
                ImageUrl = (string?)null,
                CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAtUtc = (DateTime?)null
            }
        );
    }
}
