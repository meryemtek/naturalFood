namespace Application.DTOs.Admin;

public record ModulePermissionDto(
    Guid Id,
    string Key,
    string Title,
    string Category
);

public record RoleDto(
    Guid Id,
    string Name,
    string Description,
    IReadOnlyList<string> Permissions
);

public record CreateRoleRequest(
    string Name,
    string Description,
    IReadOnlyList<string>? PermissionKeys = null
);

public record UpdateRolePermissionsRequest(
    IReadOnlyList<string> PermissionKeys
);

public record AdminLoginRequest(
    string Email,
    string Password
);

public record AdminAuthenticatedUserDto(
    Guid Id,
    string FullName,
    string Email,
    string Role
);

public record AdminLoginResponse(
    AdminAuthenticatedUserDto User,
    string Role,
    IReadOnlyList<string> Permissions,
    string AdminToken,
    DateTime ExpiresAtUtc
);

public record AdminLoginResult(
    bool Succeeded,
    bool IsInactive,
    string? ErrorMessage,
    AdminLoginResponse? Response
);
