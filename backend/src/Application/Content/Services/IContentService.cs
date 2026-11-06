using Application.Content.DTOs;

namespace Application.Content.Services;

public interface IContentService
{
    // Ana Sayfa Müşteri Görünümü
    Task<HomePageDataDto> GetHomePageDataAsync(CancellationToken cancellationToken = default);

    // Bannerlar
    Task<IReadOnlyList<BannerDto>> GetActiveBannersAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BannerDto>> GetAllBannersAsync(CancellationToken cancellationToken = default);
    Task<BannerDto> CreateBannerAsync(CreateBannerRequest request, CancellationToken cancellationToken = default);
    Task<BannerDto?> UpdateBannerAsync(Guid id, UpdateBannerRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteBannerAsync(Guid id, CancellationToken cancellationToken = default);

    // Özellik Rozetleri (Güvenli alışveriş, hızlı kargo vb.)
    Task<IReadOnlyList<SiteFeatureDto>> GetFeaturesAsync(bool includeInactive = false, CancellationToken cancellationToken = default);

    // Marka Hikayesi
    Task<BrandStoryDto?> GetBrandStoryAsync(CancellationToken cancellationToken = default);
    Task<BrandStoryDto> UpdateBrandStoryAsync(UpdateBrandStoryRequest request, CancellationToken cancellationToken = default);

    // Sıkça Sorulan Sorular (SSS)
    Task<IReadOnlyList<FaqDto>> GetFaqsAsync(bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<FaqDto> CreateFaqAsync(CreateFaqRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteFaqAsync(Guid id, CancellationToken cancellationToken = default);
}
