using Application.Catalog.DTOs;
using Application.Catalog.Services;
using Application.Content.DTOs;
using Application.Content.Services;
using Domain.Entities.Content;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Content;

public class ContentService : IContentService
{
    private readonly ContentDbContext _contentDb;
    private readonly ICatalogService _catalogService;

    public ContentService(ContentDbContext contentDb, ICatalogService catalogService)
    {
        _contentDb = contentDb;
        _catalogService = catalogService;
    }

    public async Task<HomePageDataDto> GetHomePageDataAsync(CancellationToken cancellationToken = default)
    {
        // 1. Aktif Hero Banner'ları
        var banners = await GetActiveBannersAsync(cancellationToken);

        // 2. Kategori Ağacı (Öne çıkan kategoriler)
        var categoryTree = await _catalogService.GetCategoryTreeAsync(cancellationToken);
        var selectedCategories = await _contentDb.FeaturedCategories.AsNoTracking().Where(x => x.IsActive)
            .OrderBy(x => x.DisplayOrder).ThenBy(x => x.Id).Select(x => x.CategoryId).ToListAsync(cancellationToken);
        var categoriesById = new Dictionary<Guid, CategoryTreeDto>();
        var pendingCategories = new Stack<CategoryTreeDto>(categoryTree);
        while (pendingCategories.TryPop(out var category))
        {
            categoriesById[category.Id] = category;
            foreach (var child in category.SubCategories) pendingCategories.Push(child);
        }
        var featuredCategories = selectedCategories.Where(categoriesById.ContainsKey).Select(id => categoriesById[id]).ToList();

        // 3. Çok Satan Ürünler (İlk 8)
        var bestSellers = await _catalogService.GetProductsAsync(new ProductListFilter
        {
            IsBestSeller = true,
            PageSize = 8
        }, cancellationToken);

        // 4. Yeni Eklenen Ürünler (İlk 8)
        var newArrivals = await _catalogService.GetProductsAsync(new ProductListFilter
        {
            IsNew = true,
            SortBy = "newest",
            PageSize = 8
        }, cancellationToken);

        // 5. İndirimli Ürünler (İlk 8)
        var discounted = await _catalogService.GetProductsAsync(new ProductListFilter
        {
            IsDiscounted = true,
            PageSize = 8
        }, cancellationToken);

        // 6. Mevsimlik ve Özel Ürünler (İlk 8)
        var seasonal = await _catalogService.GetProductsAsync(new ProductListFilter
        {
            IsSeasonal = true,
            PageSize = 8
        }, cancellationToken);

        // 7. Site Özellikleri (Güvenli alışveriş, soğuk zincir vb.)
        var features = await GetFeaturesAsync(false, cancellationToken);

        // 8. Markanın Hikayesi
        var story = await GetBrandStoryAsync(cancellationToken);

        var featured = await _catalogService.GetProductsAsync(new ProductListFilter { IsFeatured = true, PageSize = 8 }, cancellationToken);
        var sectionSettings = await _contentDb.ShowcaseSections.AsNoTracking().Where(x => x.IsActive)
            .OrderBy(x => x.DisplayOrder).ThenBy(x => x.Id).ToListAsync(cancellationToken);
        var sectionProducts = new Dictionary<string, IReadOnlyList<ProductDto>>(StringComparer.OrdinalIgnoreCase)
        {
            ["bestsellers"] = bestSellers.Items, ["new_arrivals"] = newArrivals.Items,
            ["discounted"] = discounted.Items, ["seasonal"] = seasonal.Items, ["featured"] = featured.Items
        };
        var sections = sectionSettings.Where(x => sectionProducts.ContainsKey(x.SectionKey))
            .Select(x => new ShowcaseSectionDto(x.Id, x.Title, x.Subtitle, x.SectionKey, x.DisplayOrder, x.IsActive, sectionProducts[x.SectionKey])).ToList();
        var now = DateTime.UtcNow;
        var announcements = await _contentDb.CampaignAnnouncements.AsNoTracking()
            .Where(x => x.IsActive && (!x.StartsAtUtc.HasValue || x.StartsAtUtc <= now) && (!x.EndsAtUtc.HasValue || x.EndsAtUtc > now))
            .OrderBy(x => x.DisplayOrder).ThenBy(x => x.Id)
            .Select(x => new CampaignAnnouncementDto(x.Id, x.Title, x.Description, x.TargetUrl, x.DisplayOrder)).ToListAsync(cancellationToken);

        return new HomePageDataDto(
            HeroBanners: banners,
            FeaturedCategories: featuredCategories,
            BestSellers: bestSellers.Items,
            NewArrivals: newArrivals.Items,
            DiscountedProducts: discounted.Items,
            SeasonalProducts: seasonal.Items,
            Features: features,
            BrandStory: story,
            FeaturedProducts: featured.Items,
            ShowcaseSections: sections,
            CampaignAnnouncements: announcements);
    }

    public async Task<IReadOnlyList<BannerDto>> GetActiveBannersAsync(CancellationToken cancellationToken = default)
    {
        return await _contentDb.Banners
            .AsNoTracking()
            .Where(b => b.IsActive)
            .OrderBy(b => b.DisplayOrder)
            .Select(b => new BannerDto(
                b.Id,
                b.Title,
                b.Subtitle,
                b.ImageUrl,
                b.TargetUrl,
                b.ButtonText,
                b.DisplayOrder,
                b.IsActive,
                b.BadgeText,
                b.Features,
                b.SecondaryButtonText,
                b.SecondaryTargetUrl,
                b.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<BannerDto>> GetAllBannersAsync(CancellationToken cancellationToken = default)
    {
        return await _contentDb.Banners
            .AsNoTracking()
            .OrderBy(b => b.DisplayOrder)
            .Select(b => new BannerDto(
                b.Id,
                b.Title,
                b.Subtitle,
                b.ImageUrl,
                b.TargetUrl,
                b.ButtonText,
                b.DisplayOrder,
                b.IsActive,
                b.BadgeText,
                b.Features,
                b.SecondaryButtonText,
                b.SecondaryTargetUrl,
                b.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<BannerDto> CreateBannerAsync(CreateBannerRequest request, CancellationToken cancellationToken = default)
    {
        var banner = new Banner(
            title: request.Title,
            subtitle: request.Subtitle,
            imageUrl: request.ImageUrl,
            targetUrl: request.TargetUrl,
            buttonText: request.ButtonText,
            displayOrder: request.DisplayOrder,
            isActive: request.IsActive,
            badgeText: request.BadgeText,
            features: request.Features,
            secondaryButtonText: request.SecondaryButtonText,
            secondaryTargetUrl: request.SecondaryTargetUrl);

        _contentDb.Banners.Add(banner);
        await _contentDb.SaveChangesAsync(cancellationToken);

        return new BannerDto(
            banner.Id,
            banner.Title,
            banner.Subtitle,
            banner.ImageUrl,
            banner.TargetUrl,
            banner.ButtonText,
            banner.DisplayOrder,
            banner.IsActive,
            banner.BadgeText,
            banner.Features,
            banner.SecondaryButtonText,
            banner.SecondaryTargetUrl,
            banner.CreatedAtUtc);
    }

    public async Task<BannerDto?> UpdateBannerAsync(Guid id, UpdateBannerRequest request, CancellationToken cancellationToken = default)
    {
        var banner = await _contentDb.Banners.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (banner == null) return null;

        banner.Update(
            title: request.Title,
            subtitle: request.Subtitle,
            imageUrl: request.ImageUrl,
            targetUrl: request.TargetUrl,
            buttonText: request.ButtonText,
            displayOrder: request.DisplayOrder,
            isActive: request.IsActive,
            badgeText: request.BadgeText,
            features: request.Features,
            secondaryButtonText: request.SecondaryButtonText,
            secondaryTargetUrl: request.SecondaryTargetUrl);

        await _contentDb.SaveChangesAsync(cancellationToken);

        return new BannerDto(
            banner.Id,
            banner.Title,
            banner.Subtitle,
            banner.ImageUrl,
            banner.TargetUrl,
            banner.ButtonText,
            banner.DisplayOrder,
            banner.IsActive,
            banner.BadgeText,
            banner.Features,
            banner.SecondaryButtonText,
            banner.SecondaryTargetUrl,
            banner.CreatedAtUtc);
    }

    public async Task<bool> DeleteBannerAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var banner = await _contentDb.Banners.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (banner == null) return false;

        _contentDb.Banners.Remove(banner);
        await _contentDb.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<SiteFeatureDto>> GetFeaturesAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _contentDb.SiteFeatures.AsNoTracking();
        if (!includeInactive) query = query.Where(f => f.IsActive);

        return await query
            .OrderBy(f => f.DisplayOrder)
            .Select(f => new SiteFeatureDto(f.Id, f.Title, f.Description, f.Icon, f.DisplayOrder, f.IsActive))
            .ToListAsync(cancellationToken);
    }

    public async Task<BrandStoryDto?> GetBrandStoryAsync(CancellationToken cancellationToken = default)
    {
        return await _contentDb.BrandStories
            .AsNoTracking()
            .Where(s => s.IsActive)
            .Select(s => new BrandStoryDto(s.Id, s.Title, s.Summary, s.FullContent, s.ImageUrl, s.BadgeText, s.IsActive))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<BrandStoryDto> UpdateBrandStoryAsync(UpdateBrandStoryRequest request, CancellationToken cancellationToken = default)
    {
        var story = await _contentDb.BrandStories.FirstOrDefaultAsync(cancellationToken);
        if (story == null)
        {
            story = new BrandStory(request.Title, request.Summary, request.FullContent, request.ImageUrl, request.BadgeText, request.IsActive);
            _contentDb.BrandStories.Add(story);
        }
        else
        {
            story.Update(request.Title, request.Summary, request.FullContent, request.ImageUrl, request.BadgeText, request.IsActive);
        }

        await _contentDb.SaveChangesAsync(cancellationToken);

        return new BrandStoryDto(story.Id, story.Title, story.Summary, story.FullContent, story.ImageUrl, story.BadgeText, story.IsActive);
    }

    public async Task<IReadOnlyList<FaqDto>> GetFaqsAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _contentDb.Faqs.AsNoTracking();
        if (!includeInactive) query = query.Where(q => q.IsActive);

        return await query
            .OrderBy(q => q.DisplayOrder)
            .Select(q => new FaqDto(q.Id, q.Question, q.Answer, q.Category, q.DisplayOrder, q.IsActive))
            .ToListAsync(cancellationToken);
    }

    public async Task<FaqDto> CreateFaqAsync(CreateFaqRequest request, CancellationToken cancellationToken = default)
    {
        var faq = new Faq(request.Question, request.Answer, request.Category, request.DisplayOrder, request.IsActive);
        _contentDb.Faqs.Add(faq);
        await _contentDb.SaveChangesAsync(cancellationToken);

        return new FaqDto(faq.Id, faq.Question, faq.Answer, faq.Category, faq.DisplayOrder, faq.IsActive);
    }

    public async Task<bool> DeleteFaqAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var faq = await _contentDb.Faqs.FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
        if (faq == null) return false;

        _contentDb.Faqs.Remove(faq);
        await _contentDb.SaveChangesAsync(cancellationToken);
        return true;
    }
}
