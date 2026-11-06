using Domain.Entities.Content;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class ContentDbContext : DbContext
{
    public const string DefaultSchema = "content";

    public ContentDbContext(DbContextOptions<ContentDbContext> options) : base(options)
    {
    }

    public DbSet<Banner> Banners => Set<Banner>();
    public DbSet<ShowcaseSection> ShowcaseSections => Set<ShowcaseSection>();
    public DbSet<SiteFeature> SiteFeatures => Set<SiteFeature>();
    public DbSet<BrandStory> BrandStories => Set<BrandStory>();
    public DbSet<Faq> Faqs => Set<Faq>();
    public DbSet<CampaignAnnouncement> CampaignAnnouncements => Set<CampaignAnnouncement>();
    public DbSet<FeaturedCategory> FeaturedCategories => Set<FeaturedCategory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Şema izolasyonu
        modelBuilder.HasDefaultSchema(DefaultSchema);

        // Yalnızca Content modülüne ait konfigürasyonları uygula
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ContentDbContext).Assembly, t => t.Namespace?.Contains("Content") == true);
    }
}
