using Application.Catalog.DTOs;

namespace Application.Content.DTOs;

public record BannerDto(
    Guid Id,
    string Title,
    string? Subtitle,
    string ImageUrl,
    string? TargetUrl,
    string? ButtonText,
    int DisplayOrder,
    bool IsActive);

public record CreateBannerRequest(
    string Title,
    string? Subtitle,
    string ImageUrl,
    string? TargetUrl,
    string? ButtonText,
    int DisplayOrder = 0,
    bool IsActive = true);

public record UpdateBannerRequest(
    string Title,
    string? Subtitle,
    string ImageUrl,
    string? TargetUrl,
    string? ButtonText,
    int DisplayOrder,
    bool IsActive);

public record ShowcaseSectionDto(
    Guid Id,
    string Title,
    string? Subtitle,
    string SectionKey,
    int DisplayOrder,
    bool IsActive,
    IReadOnlyList<ProductDto> Products);

public record SiteFeatureDto(
    Guid Id,
    string Title,
    string Description,
    string Icon,
    int DisplayOrder,
    bool IsActive);

public record BrandStoryDto(
    Guid Id,
    string Title,
    string Summary,
    string FullContent,
    string? ImageUrl,
    string? BadgeText,
    bool IsActive);

public record UpdateBrandStoryRequest(
    string Title,
    string Summary,
    string FullContent,
    string? ImageUrl,
    string? BadgeText,
    bool IsActive);

public record FaqDto(
    Guid Id,
    string Question,
    string Answer,
    string? Category,
    int DisplayOrder,
    bool IsActive);

public record CreateFaqRequest(
    string Question,
    string Answer,
    string? Category,
    int DisplayOrder = 0,
    bool IsActive = true);

public record HomePageDataDto(
    IReadOnlyList<BannerDto> HeroBanners,
    IReadOnlyList<CategoryTreeDto> FeaturedCategories,
    IReadOnlyList<ProductDto> BestSellers,
    IReadOnlyList<ProductDto> NewArrivals,
    IReadOnlyList<ProductDto> DiscountedProducts,
    IReadOnlyList<ProductDto> SeasonalProducts,
    IReadOnlyList<SiteFeatureDto> Features,
    BrandStoryDto? BrandStory,
    IReadOnlyList<ProductDto> FeaturedProducts,
    IReadOnlyList<ShowcaseSectionDto> ShowcaseSections,
    IReadOnlyList<CampaignAnnouncementDto> CampaignAnnouncements);

public record CampaignAnnouncementDto(Guid Id, string Title, string? Description, string? TargetUrl, int DisplayOrder);
