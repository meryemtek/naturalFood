using Application.DTOs.Admin;

namespace Application.Services.Admin;

public interface ILotService
{
    Task<PaginatedLotsResponse> GetLotsAsync(
        Guid? productId = null,
        int? expiringWithinDays = null,
        string? status = null,
        string? search = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    Task<ProductLotDto> CreateLotAsync(CreateLotRequest req, CancellationToken cancellationToken = default);

    Task<ProductLotDto?> UpdateLotStatusAsync(Guid id, string status, CancellationToken cancellationToken = default);
}
