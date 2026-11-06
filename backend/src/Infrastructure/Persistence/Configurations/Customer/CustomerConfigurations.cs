using Domain.Entities.Customer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations.Customer;

public class CustomerConfiguration : IEntityTypeConfiguration<Domain.Entities.Customer.Customer>
{
    public void Configure(EntityTypeBuilder<Domain.Entities.Customer.Customer> builder)
    {
        builder.ToTable("Customers");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(c => c.Email)
            .IsUnique();

        builder.Property(c => c.PasswordHash)
            .HasMaxLength(512);

        builder.Property(c => c.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Phone)
            .HasMaxLength(20);

        // Navigation'lar
        builder.HasMany(c => c.Addresses)
            .WithOne(a => a.Customer)
            .HasForeignKey(a => a.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.WishlistItems)
            .WithOne(w => w.Customer)
            .HasForeignKey(w => w.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.RefreshTokens)
            .WithOne(r => r.Customer)
            .HasForeignKey(r => r.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        // FullName computed property'si EF tarafından yok sayılsın
        builder.Ignore(c => c.FullName);
    }
}

public class CustomerAddressConfiguration : IEntityTypeConfiguration<CustomerAddress>
{
    public void Configure(EntityTypeBuilder<CustomerAddress> builder)
    {
        builder.ToTable("CustomerAddresses");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Title)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.RecipientName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.Phone)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(a => a.City)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.District)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.Neighborhood)
            .HasMaxLength(100);

        builder.Property(a => a.FullAddress)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(a => a.PostalCode)
            .HasMaxLength(10);

        builder.Property(a => a.CompanyName)
            .HasMaxLength(200);

        builder.Property(a => a.TaxOffice)
            .HasMaxLength(100);

        builder.Property(a => a.TaxNumber)
            .HasMaxLength(20);

        builder.HasIndex(a => a.CustomerId);
    }
}

public class WishlistConfiguration : IEntityTypeConfiguration<Wishlist>
{
    public void Configure(EntityTypeBuilder<Wishlist> builder)
    {
        builder.ToTable("Wishlists");

        builder.HasKey(w => w.Id);

        // Bir müşteri aynı ürünü sadece bir kez favoriye ekleyebilir
        builder.HasIndex(w => new { w.CustomerId, w.ProductId })
            .IsUnique();

        builder.HasIndex(w => w.ProductId);
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Token)
            .IsRequired()
            .HasMaxLength(512);

        builder.HasIndex(r => r.Token)
            .IsUnique();

        builder.Property(r => r.ReplacedByToken)
            .HasMaxLength(512);

        // Computed properties EF tarafından yok sayılsın
        builder.Ignore(r => r.IsExpired);
        builder.Ignore(r => r.IsRevoked);
        builder.Ignore(r => r.IsActive);

        builder.HasIndex(r => r.CustomerId);
    }
}
