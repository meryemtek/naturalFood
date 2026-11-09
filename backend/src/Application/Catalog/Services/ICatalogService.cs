using Application.Catalog.DTOs;
using Application.Common;

namespace Application.Catalog.Services;

public interface ICatalogService
{
    // Kategoriler
    Task<IReadOnlyList<CategoryTreeDto>> GetCategoryTreeAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CategoryDto>> GetAllCategoriesAsync(bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<CategoryDto?> GetCategoryBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<CategoryDto?> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken = default);

    // Ürünler
    Task<PagedResult<ProductDto>> GetProductsAsync(ProductListFilter filter, CancellationToken cancellationToken = default);
    Task<ProductDetailDto?> GetProductBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<ProductDetailDto?> GetProductByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProductDto>> GetRelatedProductsAsync(Guid productId, int count = 4, CancellationToken cancellationToken = default);

    // Yönetici / Admin İşlemleri
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default);
    Task<CategoryDto?> UpdateCategoryAsync(Guid id, UpdateCategoryRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteCategoryAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ProductDetailDto> CreateProductAsync(CreateProductRequest request, CancellationToken cancellationToken = default);
    Task<ProductDetailDto?> UpdateProductAsync(Guid id, UpdateProductRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteProductAsync(Guid id, CancellationToken cancellationToken = default);

    // Varyant ve Görsel Yönetimi
    Task<ProductVariantDto> AddVariantAsync(Guid productId, CreateProductVariantRequest request, CancellationToken cancellationToken = default);
    Task<ProductVariantDto?> UpdateVariantAsync(Guid variantId, UpdateProductVariantRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteVariantAsync(Guid variantId, CancellationToken cancellationToken = default);

    Task<ProductImageDto> AddImageAsync(Guid productId, string imageUrl, string? altText, int displayOrder, bool isMain, CancellationToken cancellationToken = default);
    Task<bool> DeleteImageAsync(Guid imageId, CancellationToken cancellationToken = default);
}
