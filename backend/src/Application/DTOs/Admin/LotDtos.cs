namespace Application.DTOs.Admin;

public record ProductLotDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string? ProductSku,
    string LotNumber,
    DateTime ProductionDate,
    DateTime ExpiryDate,
    int Quantity,
    int DaysLeft,
    string Status, // Active, NearExpiry, Expired, WrittenOff
    string? AutoDiscount,
    DateTime CreatedAtUtc
);

public record LotSummaryMetricsDto(
    int TotalLots,
    int ActiveLots,
    int NearExpiryCount,
    int CriticalCount,
    int ExpiredCount,
    int WrittenOffCount
);

public record PaginatedLotsResponse(
    IReadOnlyList<ProductLotDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages,
    LotSummaryMetricsDto Metrics
);

public record CreateLotRequest(
    Guid ProductId,
    string LotNumber,
    DateTime ProductionDate,
    DateTime ExpiryDate,
    int Quantity,
    string? Status
);

public record UpdateLotStatusRequest(
    string Status
);
