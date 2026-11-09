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
