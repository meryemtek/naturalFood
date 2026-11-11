using Application.DTOs.Admin;

namespace Application.Services.Admin;

public interface IAdminReviewService
{
    Task<DashboardReviewsAttentionResponse> GetDashboardAttentionReviewsAsync(CancellationToken cancellationToken = default);
    Task<PaginatedAdminReviewsResponse> GetAllReviewsAsync(int? rating, string? status, bool? onlyNegative, string? search, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<AdminReviewItemDto?> QuickRespondAsync(Guid reviewId, QuickReviewResponseRequest req, CancellationToken cancellationToken = default);
    Task<AdminReviewItemDto?> UpdateReviewStatusAsync(Guid reviewId, string status, CancellationToken cancellationToken = default);
}
