namespace Application.DTOs.Admin;

public record InventoryItemDto(
    Guid Id,
    string Name,
    string Sku,
    string Category,
    decimal UnitPrice,
    int StockQuantity,
    string UnitInfo,
    string Status,
    string? ImageUrl,
    DateTime? LastUpdatedUtc
);

public record UpdateStockRequest(
    int? Delta,
    int? NewQuantity,
    string? Reason
);
