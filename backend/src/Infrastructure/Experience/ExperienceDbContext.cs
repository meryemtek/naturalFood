using Domain.Entities.Experience;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Experience;
public class ExperienceDbContext(DbContextOptions<ExperienceDbContext> options) : DbContext(options)
{
    public DbSet<ProductReview> Reviews => Set<ProductReview>();
    public DbSet<ContactMessage> Messages => Set<ContactMessage>();
    public DbSet<Policy> Policies => Set<Policy>();
    public DbSet<NewsletterSubscription> Subscriptions => Set<NewsletterSubscription>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("experience");
        modelBuilder.Entity<ProductReview>(b => { b.HasKey(x => x.Id); b.HasIndex(x => new {x.ProductId,x.CustomerId}).IsUnique(); b.HasIndex(x => new {x.ProductId,x.Status}); b.Property(x => x.Text).HasMaxLength(2000).IsRequired(); b.Property(x => x.AdminResponse).HasMaxLength(2000); b.Property(x => x.Status).HasMaxLength(20); b.ToTable(t => t.HasCheckConstraint("CK_review_rating", "\"Rating\" BETWEEN 1 AND 5")); });
        modelBuilder.Entity<ContactMessage>(b => { b.HasKey(x => x.Id); b.Property(x => x.Name).HasMaxLength(100); b.Property(x => x.Email).HasMaxLength(256); b.Property(x => x.Subject).HasMaxLength(200); b.Property(x => x.Message).HasMaxLength(5000); });
        modelBuilder.Entity<Policy>(b => { b.HasKey(x => x.Id); b.HasIndex(x => x.Slug).IsUnique(); b.Property(x => x.Slug).HasMaxLength(100); b.Property(x => x.Title).HasMaxLength(200); b.Property(x => x.Content).HasMaxLength(30000); });
        modelBuilder.Entity<NewsletterSubscription>(b => { b.HasKey(x => x.Id); b.HasIndex(x => x.Email).IsUnique(); b.Property(x => x.Email).HasMaxLength(256); b.Property(x => x.Status).HasMaxLength(20); });
    }
}
