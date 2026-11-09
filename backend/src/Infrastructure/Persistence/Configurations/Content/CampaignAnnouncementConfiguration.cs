using Domain.Entities.Content;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations.Content;
public class CampaignAnnouncementConfiguration : IEntityTypeConfiguration<CampaignAnnouncement>
{
    public void Configure(EntityTypeBuilder<CampaignAnnouncement> builder)
    {
        builder.ToTable("CampaignAnnouncements");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.Property(x => x.TargetUrl).HasMaxLength(500);
        builder.HasIndex(x => new { x.IsActive, x.DisplayOrder });
    }
}
