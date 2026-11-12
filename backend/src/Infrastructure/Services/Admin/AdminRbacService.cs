using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Security;
using Application.DTOs.Admin;
using Application.Services.Admin;
using Domain.Entities.Admin;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Services.Admin;

public class AdminRbacService : IAdminRbacService
{
    private readonly IAdminDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly JwtSettings _jwtSettings;

    public AdminRbacService(
        IAdminDbContext context,
        IPasswordHasher passwordHasher,
        IOptions<JwtSettings> jwtSettings)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtSettings = jwtSettings.Value;
    }

    private static bool IsSuperAdminRole(string? roleName)
    {
        if (string.IsNullOrWhiteSpace(roleName))
            return false;

        var normalized = roleName.Trim();
        return string.Equals(normalized, "SuperAdmin", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "Root", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<IReadOnlyList<RoleDto>> GetRolesAsync(CancellationToken ct = default)
    {
        var roles = await _context.Roles
            .AsNoTracking()
            .Include(r => r.RolePermissions)
            .OrderBy(r => r.Id)
            .ToListAsync(ct);

        return roles
            .Select(r => new RoleDto(
                r.Id,
                r.Name,
                r.Description,
                r.RolePermissions.Select(rp => rp.PermissionKey).OrderBy(k => k).ToList()
            ))
            .ToList();
    }

    public async Task<IReadOnlyList<ModulePermissionDto>> GetPermissionsAsync(CancellationToken ct = default)
    {
        return await _context.ModulePermissions
            .AsNoTracking()
            .OrderBy(p => p.Category)
            .ThenBy(p => p.Title)
            .Select(p => new ModulePermissionDto(p.Id, p.Key, p.Title, p.Category))
            .ToListAsync(ct);
    }

    public async Task<RoleDto> CreateRoleAsync(CreateRoleRequest request, CancellationToken ct = default)
    {
        var normalizedName = (request.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalizedName))
            throw new InvalidOperationException("Rol adı zorunludur.");

        var exists = await _context.Roles
            .AsNoTracking()
            .AnyAsync(r => r.Name.ToLower() == normalizedName.ToLower(), ct);

        if (exists)
            throw new InvalidOperationException($"'{normalizedName}' adında bir rol zaten tanımlı.");

        var description = string.IsNullOrWhiteSpace(request.Description)
            ? $"{normalizedName} özel yönetici rolü"
            : request.Description.Trim();

        var role = new Role(normalizedName, description);
        await _context.Roles.AddAsync(role, ct);

        var requestedKeys = (request.PermissionKeys ?? Array.Empty<string>())
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .Select(k => k.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var validKeyLookup = await _context.ModulePermissions
            .AsNoTracking()
            .Select(p => p.Key)
            .ToListAsync(ct);

        var matchedKeys = validKeyLookup
            .Where(existing => requestedKeys.Contains(existing, StringComparer.OrdinalIgnoreCase))
            .OrderBy(k => k)
            .ToList();

        foreach (var key in matchedKeys)
        {
            await _context.RolePermissions.AddAsync(new RolePermission(role.Id, key), ct);
        }

        await _context.AuditLogs.AddAsync(
            new AuditLog(
                action: "RoleCreated",
                resource: $"Role:{role.Name}",
                adminUserId: null,
                details: $"Yeni rol oluşturuldu: {role.Name} ({matchedKeys.Count} başlangıç izni)"
            ),
            ct);

        await _context.SaveChangesAsync(ct);

        return new RoleDto(role.Id, role.Name, role.Description, matchedKeys);
    }

    public async Task<RoleDto?> UpdateRolePermissionsAsync(
        Guid roleId,
        UpdateRolePermissionsRequest request,
        CancellationToken ct = default)
    {
        var role = await _context.Roles
            .FirstOrDefaultAsync(r => r.Id == roleId, ct);

        if (role is null)
            return null;

        var requestedKeys = (request.PermissionKeys ?? Array.Empty<string>())
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .Select(k => k.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var validKeyLookup = await _context.ModulePermissions
            .AsNoTracking()
            .Select(p => p.Key)
            .ToListAsync(ct);

        var matchedKeys = validKeyLookup
            .Where(existing => requestedKeys.Contains(existing, StringComparer.OrdinalIgnoreCase))
            .OrderBy(k => k)
            .ToList();

        var existingPermissions = await _context.RolePermissions
            .Where(rp => rp.RoleId == roleId)
            .ToListAsync(ct);

        if (existingPermissions.Count > 0)
        {
            _context.RolePermissions.RemoveRange(existingPermissions);
        }

        foreach (var key in matchedKeys)
        {
            await _context.RolePermissions.AddAsync(new RolePermission(roleId, key), ct);
        }

        var details = matchedKeys.Count > 0
            ? $"Rol '{role.Name}' yetkileri güncellendi. Aktif modüller: {string.Join(", ", matchedKeys)}"
            : $"Rol '{role.Name}' için tüm modül izinleri kapatıldı.";

        var auditLog = new AuditLog(
            action: "RolePermissionsUpdated",
            resource: $"Role:{role.Name}",
            adminUserId: null,
            details: details
        );

        await _context.AuditLogs.AddAsync(auditLog, ct);
        await _context.SaveChangesAsync(ct);

        return new RoleDto(role.Id, role.Name, role.Description, matchedKeys);
    }

    public async Task<IReadOnlyList<string>> GetPermissionsForRoleAsync(string roleName, CancellationToken ct = default)
    {
        if (string.Equals(roleName?.Trim(), "Customer", StringComparison.OrdinalIgnoreCase))
            return Array.Empty<string>();

        if (IsSuperAdminRole(roleName))
        {
            return await _context.ModulePermissions
                .AsNoTracking()
                .Select(p => p.Key)
                .OrderBy(k => k)
                .ToListAsync(ct);
        }

        var normalizedRole = (roleName ?? string.Empty).Trim();
        var role = await _context.Roles
            .AsNoTracking()
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Name.ToLower() == normalizedRole.ToLower(), ct);

        if (role is null)
        {
            return Array.Empty<string>();
        }

        return role.RolePermissions
            .Select(rp => rp.PermissionKey)
            .OrderBy(k => k)
            .ToList();
    }

    public async Task<bool> HasPermissionAsync(string roleName, string permissionKey, CancellationToken ct = default)
    {
        if (string.Equals(roleName?.Trim(), "Customer", StringComparison.OrdinalIgnoreCase))
            return false;

        if (string.IsNullOrWhiteSpace(permissionKey) || IsSuperAdminRole(roleName))
            return true;

        var keyExists = await _context.ModulePermissions
            .AsNoTracking()
            .AnyAsync(p => p.Key == permissionKey, ct);

        if (!keyExists)
            return true;

        var normalizedRole = (roleName ?? string.Empty).Trim();
        var role = await _context.Roles
            .AsNoTracking()
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Name.ToLower() == normalizedRole.ToLower(), ct);

        if (role is null)
            return false;

        return role.RolePermissions.Any(rp =>
            string.Equals(rp.PermissionKey, permissionKey, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<AdminLoginResult> LoginAsync(
        AdminLoginRequest request,
        string? ipAddress,
        CancellationToken ct = default)
    {
        var normalizedEmail = (request.Email ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalizedEmail) || string.IsNullOrWhiteSpace(request.Password))
        {
            await _context.AuditLogs.AddAsync(
                new AuditLog(
                    action: "AdminLoginFailed",
                    resource: "AdminAuth",
                    adminUserId: null,
                    details: $"Eksik bilgi ile giriş denemesi: {normalizedEmail}",
                    ipAddress: ipAddress),
                ct);
            await _context.SaveChangesAsync(ct);
            return new AdminLoginResult(false, false, "E-posta adresi ve şifre zorunludur.", null);
        }

        var user = await _context.AdminUsers
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, ct);

        if (user is null)
        {
            await _context.AuditLogs.AddAsync(
                new AuditLog(
                    action: "AdminLoginFailed",
                    resource: "AdminAuth",
                    adminUserId: null,
                    details: $"Tanımsız yönetici e-postası ile giriş denemesi: {normalizedEmail}",
                    ipAddress: ipAddress),
                ct);
            await _context.SaveChangesAsync(ct);
            return new AdminLoginResult(false, false, "E-posta adresi veya şifre hatalı.", null);
        }

        if (!user.IsActive)
        {
            await _context.AuditLogs.AddAsync(
                new AuditLog(
                    action: "AdminLoginFailed",
                    resource: "AdminAuth",
                    adminUserId: user.Id,
                    details: $"Pasif yönetici hesabı ile giriş denemesi engellendi: {user.Email}",
                    ipAddress: ipAddress),
                ct);
            await _context.SaveChangesAsync(ct);
            return new AdminLoginResult(false, true, "Yönetici hesabınız pasif durumda. Lütfen Süper Yönetici ile iletişime geçin.", null);
        }

        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            await _context.AuditLogs.AddAsync(
                new AuditLog(
                    action: "AdminLoginFailed",
                    resource: "AdminAuth",
                    adminUserId: user.Id,
                    details: $"Hatalı şifre denemesi: {user.Email}",
                    ipAddress: ipAddress),
                ct);
            await _context.SaveChangesAsync(ct);
            return new AdminLoginResult(false, false, "E-posta adresi veya şifre hatalı.", null);
        }

        user.RecordLogin();
        var effectiveRole = user.EffectiveRoleName;
        var permissions = await GetPermissionsForRoleAsync(effectiveRole, ct);

        var expiresAtUtc = DateTime.UtcNow.AddHours(12);
        var adminToken = GenerateAdminToken(user, effectiveRole, expiresAtUtc);

        await _context.AuditLogs.AddAsync(
            new AuditLog(
                action: "AdminLoginSuccess",
                resource: "AdminAuth",
                adminUserId: user.Id,
                details: $"Yönetici oturum açtı: {user.Email} (Rol: {effectiveRole})",
                ipAddress: ipAddress),
            ct);

        await _context.SaveChangesAsync(ct);

        var response = new AdminLoginResponse(
            User: new AdminAuthenticatedUserDto(user.Id, user.FullName, user.Email, effectiveRole),
            Role: effectiveRole,
            Permissions: permissions,
            AdminToken: adminToken,
            ExpiresAtUtc: expiresAtUtc
        );

        return new AdminLoginResult(true, false, null, response);
    }

    private string GenerateAdminToken(AdminUser user, string effectiveRole, DateTime expiresAtUtc)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, effectiveRole),
            new("token_type", "admin_panel")
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
