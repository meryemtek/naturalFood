using Domain.Entities.Content;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations.Content;
public class FeaturedCategoryConfiguration : IEntityTypeConfiguration<FeaturedCategory>
{
    public void Configure(EntityTypeBuilder<FeaturedCategory> builder)
    {
        builder.ToTable("FeaturedCategories");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.CategoryId).IsUnique();
    }
}
