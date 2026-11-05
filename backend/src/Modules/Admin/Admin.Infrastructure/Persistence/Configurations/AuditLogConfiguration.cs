using Admin.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Admin.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs", AdminDbContext.DefaultSchema);

        builder.HasKey(x => x.Id);

        builder.Property(x => x.AdminUserId)
            .IsRequired(false);

        builder.Property(x => x.Action)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Resource)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.TimestampUtc)
            .IsRequired();

        builder.Property(x => x.IpAddress)
            .HasMaxLength(45)
            .IsRequired(false);

        builder.Property(x => x.Details)
            .HasMaxLength(4000)
            .IsRequired(false);

        builder.HasIndex(x => x.AdminUserId);
        builder.HasIndex(x => x.TimestampUtc);

        // Seed AuditLog
        builder.HasData(new
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            AdminUserId = (Guid?)Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Action = "SystemInitialize",
            Resource = "Database",
            TimestampUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            IpAddress = "127.0.0.1",
            Details = "İlk sistem başlangıcı ve SuperAdmin kullanıcısı oluşturuldu."
        });
    }
}
