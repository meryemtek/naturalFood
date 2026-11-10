using Application.DTOs.Admin;

namespace Application.Services.Admin;

public interface IInventoryService
{
    Task<PaginatedList<InventoryItemDto>> GetInventoryAsync(
        int page = 1,
        int pageSize = 50,
        string? search = null,
        string? category = null,
        bool? criticalOnly = null,
        CancellationToken cancellationToken = default);

    Task<InventoryItemDto?> UpdateStockAsync(
        Guid id,
        UpdateStockRequest req,
        CancellationToken cancellationToken = default);
}
