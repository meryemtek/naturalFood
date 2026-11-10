namespace Application.DTOs.Admin;

public record StorageConditionDto(
    Guid Id,
    string Name,
    decimal MinTemperature,
    decimal MaxTemperature,
    int? MaxHumidity,
    bool RequiresColdChain,
    string DefaultShelfZone,
    string? Description,
    int ProductCount,
    IReadOnlyList<string> SampleProducts
);

public record CreateStorageConditionRequest(
    string Name,
    decimal MinTemperature,
    decimal MaxTemperature,
    int? MaxHumidity,
    bool RequiresColdChain,
    string DefaultShelfZone,
    string? Description
);

public record UpdateProductStorageRequest(
    Guid? StorageConditionId,
    string? ShelfLocation
);

public record ProductStorageItemDto(
    Guid Id,
    string Name,
    string Sku,
    string Category,
    Guid? StorageConditionId,
    string? StorageConditionName,
    decimal? MinTemperature,
    decimal? MaxTemperature,
    bool RequiresColdChain,
    string? ShelfLocation,
    int StockQuantity
);
