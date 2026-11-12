using Domain.Enums.Admin;

namespace Application.DTOs.Admin;

public record PaginatedList<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
)
{
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;

    public static PaginatedList<T> Create(IReadOnlyList<T> items, int totalCount, int page, int pageSize)
    {
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return new PaginatedList<T>(items, totalCount, page, pageSize, totalPages);
    }
}

public record AdminUserDto(
    Guid Id,
    string Email,
    string FullName,
    AdminRole Role,
    string RoleName,
    bool IsActive,
    DateTime CreatedAtUtc,
    DateTime? LastLoginAtUtc
);

public record CreateAdminUserRequest(
    string Email,
    string FullName,
    string Password,
    AdminRole Role,
    string? CustomRoleName = null
);

public record UpdateAdminUserRequest(
    string Email,
    string FullName,
    AdminRole Role,
    bool IsActive
);

public record UpdateUserStatusRequest(
    bool IsActive
);

public record AuditLogDto(
    Guid Id,
    Guid? AdminUserId,
    string Action,
    string Resource,
    DateTime TimestampUtc,
    string? IpAddress,
    string? Details
);

