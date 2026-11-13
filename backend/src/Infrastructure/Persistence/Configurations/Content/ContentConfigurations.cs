using Domain.Entities.Content;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations.Content;

public class BannerConfiguration : IEntityTypeConfiguration<Banner>
{
    public void Configure(EntityTypeBuilder<Banner> builder)
    {
        builder.ToTable("Banners");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Title).IsRequired().HasMaxLength(200);
        builder.Property(b => b.Subtitle).HasMaxLength(1000);
        builder.Property(b => b.BadgeText).HasMaxLength(150);
        builder.Property(b => b.Features).HasMaxLength(500);
        builder.Property(b => b.ImageUrl).IsRequired().HasMaxLength(500);
        builder.Property(b => b.TargetUrl).HasMaxLength(500);
        builder.Property(b => b.ButtonText).HasMaxLength(100);
        builder.Property(b => b.SecondaryButtonText).HasMaxLength(100);
        builder.Property(b => b.SecondaryTargetUrl).HasMaxLength(500);
        builder.Property(b => b.DisplayOrder).HasDefaultValue(0);
        builder.Property(b => b.IsActive).HasDefaultValue(true);
    }
}

public class ShowcaseSectionConfiguration : IEntityTypeConfiguration<ShowcaseSection>
{
    public void Configure(EntityTypeBuilder<ShowcaseSection> builder)
    {
        builder.ToTable("ShowcaseSections");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Title).IsRequired().HasMaxLength(200);
        builder.Property(s => s.Subtitle).HasMaxLength(300);
        builder.Property(s => s.SectionKey).IsRequired().HasMaxLength(100);
        builder.HasIndex(s => s.SectionKey).IsUnique();
        builder.Property(s => s.DisplayOrder).HasDefaultValue(0);
        builder.Property(s => s.IsActive).HasDefaultValue(true);
    }
}

public class SiteFeatureConfiguration : IEntityTypeConfiguration<SiteFeature>
{
    public void Configure(EntityTypeBuilder<SiteFeature> builder)
    {
        builder.ToTable("SiteFeatures");
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Title).IsRequired().HasMaxLength(150);
        builder.Property(f => f.Description).IsRequired().HasMaxLength(300);
        builder.Property(f => f.Icon).IsRequired().HasMaxLength(100);
        builder.Property(f => f.DisplayOrder).HasDefaultValue(0);
        builder.Property(f => f.IsActive).HasDefaultValue(true);
    }
}

public class BrandStoryConfiguration : IEntityTypeConfiguration<BrandStory>
{
    public void Configure(EntityTypeBuilder<BrandStory> builder)
    {
        builder.ToTable("BrandStories");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Title).IsRequired().HasMaxLength(250);
        builder.Property(s => s.Summary).IsRequired().HasMaxLength(1000);
        builder.Property(s => s.FullContent).IsRequired().HasMaxLength(10000);
        builder.Property(s => s.ImageUrl).HasMaxLength(500);
        builder.Property(s => s.BadgeText).HasMaxLength(100);
        builder.Property(s => s.IsActive).HasDefaultValue(true);
    }
}

public class FaqConfiguration : IEntityTypeConfiguration<Faq>
{
    public void Configure(EntityTypeBuilder<Faq> builder)
    {
        builder.ToTable("Faqs");
        builder.HasKey(q => q.Id);
        builder.Property(q => q.Question).IsRequired().HasMaxLength(400);
        builder.Property(q => q.Answer).IsRequired().HasMaxLength(5000);
        builder.Property(q => q.Category).HasMaxLength(100);
        builder.Property(q => q.DisplayOrder).HasDefaultValue(0);
        builder.Property(q => q.IsActive).HasDefaultValue(true);
    }
}
