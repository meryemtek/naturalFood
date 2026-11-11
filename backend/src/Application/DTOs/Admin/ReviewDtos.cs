namespace Application.DTOs.Admin;

public record DashboardAttentionReviewDto(
    Guid Id,
    string CustomerName,
    string ProductName,
    int Rating,
    string CommentText,
    DateTime CreatedAtUtc,
    bool HasResponse,
    string? AdminResponse,
    string Status
);

public record DashboardReviewsAttentionResponse(
    decimal AverageStoreRating,
    int TotalReviewCount,
    int UnresolvedNegativeCount,
    IReadOnlyList<DashboardAttentionReviewDto> CriticalReviews
);

public record AdminReviewItemDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string? ProductSku,
    Guid CustomerId,
    string CustomerName,
    string CustomerEmail,
    int Rating,
    string CommentText,
    string Status,
    bool HasResponse,
    string? AdminResponse,
    DateTime? RespondedAtUtc,
    DateTime CreatedAtUtc
);

public record PaginatedAdminReviewsResponse(
    IReadOnlyList<AdminReviewItemDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages,
    decimal AverageRating,
    int PendingCount,
    int NegativeUnresolvedCount
);

public record QuickReviewResponseRequest(
    string? ResponseText,
    bool MarkAsReviewed = true
);

public record UpdateReviewStatusRequest(
    string Status
);
