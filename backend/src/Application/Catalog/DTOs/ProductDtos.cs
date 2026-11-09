namespace Application.Catalog.DTOs;

public record ProductImageDto(
    Guid Id,
    string ImageUrl,
    string? AltText,
    int DisplayOrder,
    bool IsMain);

public record ProductVariantDto(
    Guid Id,
    Guid ProductId,
    string Name,
    string Sku,
    decimal Price,
    decimal? DiscountPrice,
    int StockQuantity,
    string UnitInfo,
    int DisplayOrder,
    bool IsActive);

public record ProductDto(
    Guid Id,
    string Name,
    string Slug,
    string ShortDescription,
    Guid CategoryId,
    string CategoryName,
    string CategorySlug,
    decimal BasePrice,
    decimal? DiscountPrice,
    int StockQuantity,
    string Sku,
    string UnitInfo,
    string? MainImageUrl,
    bool IsBestSeller,
    bool IsNew,
    bool IsFeatured,
    bool IsSeasonal,
    bool IsActive,
    int VariantCount);

public record ProductAttributeDto(string Name, string Value, int DisplayOrder);

public record ProductDetailDto(
    Guid Id,
    string Name,
    string Slug,
    string ShortDescription,
    string? Description,
    Guid CategoryId,
    string CategoryName,
    string CategorySlug,
    decimal BasePrice,
    decimal? DiscountPrice,
    int StockQuantity,
    string Sku,
    string UnitInfo,
    string? Ingredients,
    string? Allergens,
    string? Origin,
    string? StorageConditions,
    string? ShelfLife,
    bool IsBestSeller,
    bool IsNew,
    bool IsFeatured,
    bool IsSeasonal,
    bool IsActive,
    IReadOnlyList<ProductImageDto> Images,
    IReadOnlyList<ProductVariantDto> Variants,
    IReadOnlyList<ProductAttributeDto> Attributes);

public record ProductListFilter(
    string? Search = null,
    Guid? CategoryId = null,
    string? CategorySlug = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    bool? IsBestSeller = null,
    bool? IsNew = null,
    bool? IsFeatured = null,
    bool? IsSeasonal = null,
    bool? IsDiscounted = null,
    string? SortBy = null, // "price_asc", "price_desc", "newest", "bestselling"
    int PageIndex = 1,
    int PageSize = 12);

public record CreateProductRequest(
    string Name,
    string? Slug,
    string ShortDescription,
    string? Description,
    Guid CategoryId,
    decimal BasePrice,
    decimal? DiscountPrice,
    int StockQuantity,
    string Sku,
    string UnitInfo,
    string? Ingredients,
    string? Allergens,
    string? Origin,
    string? StorageConditions,
    string? ShelfLife,
    bool IsBestSeller = false,
    bool IsNew = true,
    bool IsFeatured = false,
    bool IsSeasonal = false,
    bool IsActive = true,
    List<string>? ImageUrls = null,
    List<CreateProductVariantRequest>? Variants = null);

public record UpdateProductRequest(
    string Name,
    string? Slug,
    string ShortDescription,
    string? Description,
    Guid CategoryId,
    decimal BasePrice,
    decimal? DiscountPrice,
    int StockQuantity,
    string Sku,
    string UnitInfo,
    string? Ingredients,
    string? Allergens,
    string? Origin,
    string? StorageConditions,
    string? ShelfLife,
    bool IsBestSeller,
    bool IsNew,
    bool IsFeatured,
    bool IsSeasonal,
    bool IsActive);

public record CreateProductVariantRequest(
    string Name,
    string Sku,
    decimal Price,
    decimal? DiscountPrice,
    int StockQuantity,
    string UnitInfo,
    int DisplayOrder = 0,
    bool IsActive = true);

public record UpdateProductVariantRequest(
    string Name,
    string Sku,
    decimal Price,
    decimal? DiscountPrice,
    int StockQuantity,
    string UnitInfo,
    int DisplayOrder,
    bool IsActive);
