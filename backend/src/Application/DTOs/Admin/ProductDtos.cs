namespace Application.DTOs.Admin;

public record ProductDto(
    Guid Id,
    string Name,
    string? Sku,
    string? Barcode,
    string Category,
    string SaleUnit,
    decimal BasePrice,
    decimal SellingPrice,
    decimal StockQuantity,
    string Status,
    string? ImageUrl,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc
);

public record CreateProductRequest(
    string Name,
    string? Sku,
    string? Barcode,
    string Category,
    string SaleUnit,
    decimal BasePrice,
    decimal SellingPrice,
    decimal StockQuantity,
    string? Status,
    string? ImageUrl
);

public record UpdateProductRequest(
    string Name,
    string? Sku,
    string? Barcode,
    string Category,
    string SaleUnit,
    decimal BasePrice,
    decimal SellingPrice,
    decimal StockQuantity,
    string Status,
    string? ImageUrl
);

public record NutritionalValuesDto(
    decimal EnergyKcal,
    decimal Fat,
    decimal SaturatedFat,
    decimal Carbohydrates,
    decimal Sugar,
    decimal Protein,
    decimal Salt
);

public record ProductDetailsDto(
    Guid Id,
    string Name,
    string Sku,
    string Category,
    string? Ingredients,
    List<string> Allergens,
    List<string> Certifications,
    NutritionalValuesDto? NutritionalValues
);

public record UpdateProductDetailsRequest(
    string? Ingredients,
    List<string>? Allergens,
    List<string>? Certifications,
    NutritionalValuesDto? NutritionalValues
);
