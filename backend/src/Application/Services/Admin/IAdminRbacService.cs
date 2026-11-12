using Application.DTOs.Admin;

namespace Application.Services.Admin;

public interface IAdminRbacService
{
    Task<IReadOnlyList<RoleDto>> GetRolesAsync(CancellationToken ct = default);
    Task<IReadOnlyList<ModulePermissionDto>> GetPermissionsAsync(CancellationToken ct = default);
    Task<RoleDto> CreateRoleAsync(CreateRoleRequest request, CancellationToken ct = default);
    Task<RoleDto?> UpdateRolePermissionsAsync(Guid roleId, UpdateRolePermissionsRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<string>> GetPermissionsForRoleAsync(string roleName, CancellationToken ct = default);
    Task<bool> HasPermissionAsync(string roleName, string permissionKey, CancellationToken ct = default);
    Task<AdminLoginResult> LoginAsync(AdminLoginRequest request, string? ipAddress, CancellationToken ct = default);
}
