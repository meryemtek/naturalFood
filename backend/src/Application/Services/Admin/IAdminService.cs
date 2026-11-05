using Application.DTOs.Admin;

namespace Application.Services.Admin;

public interface IAdminService
{
    Task<PaginatedList<AdminUserDto>> GetUsersAsync(int page = 1, int pageSize = 10, CancellationToken cancellationToken = default);
    Task<AdminUserDto?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AdminUserDto> CreateUserAsync(CreateAdminUserRequest req, CancellationToken cancellationToken = default);
    Task<AdminUserDto?> UpdateUserStatusAsync(Guid id, bool isActive, CancellationToken cancellationToken = default);
    Task<PaginatedList<AuditLogDto>> GetAuditLogsAsync(int page = 1, int pageSize = 10, CancellationToken cancellationToken = default);
}

