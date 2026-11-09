namespace Application.Catalog.DTOs;

public record CategoryDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? ImageUrl,
    Guid? ParentCategoryId,
    int DisplayOrder,
    bool IsActive,
    int ProductCount = 0);

public record CategoryTreeDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? ImageUrl,
    int DisplayOrder,
    bool IsActive,
    IReadOnlyList<CategoryTreeDto> SubCategories);

public record CreateCategoryRequest(
    string Name,
    string? Slug,
    string? Description,
    string? ImageUrl,
    Guid? ParentCategoryId,
    int DisplayOrder = 0,
    bool IsActive = true);

public record UpdateCategoryRequest(
    string Name,
    string? Slug,
    string? Description,
    string? ImageUrl,
    Guid? ParentCategoryId,
    int DisplayOrder,
    bool IsActive);
