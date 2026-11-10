using Application.DTOs.Admin;

namespace Application.Services.Admin;

public interface IStorageService
{
    Task<IReadOnlyList<StorageConditionDto>> GetStorageConditionsAsync(CancellationToken cancellationToken = default);

    Task<StorageConditionDto> CreateStorageConditionAsync(CreateStorageConditionRequest req, CancellationToken cancellationToken = default);

    Task<ProductStorageItemDto?> UpdateProductStorageAsync(Guid productId, UpdateProductStorageRequest req, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProductStorageItemDto>> GetProductsStorageAsync(Guid? conditionId = null, string? search = null, CancellationToken cancellationToken = default);
}
