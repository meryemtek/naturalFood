using Admin.Application.Common.Interfaces;
using Admin.Application.Common.Security;
using Admin.Application.DTOs;
using Admin.Application.Services;
using Admin.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Admin.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly IAdminDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public AdminService(IAdminDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<PaginatedList<AdminUserDto>> GetUsersAsync(int page = 1, int pageSize = 10, CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.AdminUsers.AsNoTracking();
        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(u => u.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => MapToDto(u))
            .ToListAsync(cancellationToken);

        return PaginatedList<AdminUserDto>.Create(items, totalCount, page, pageSize);
    }

    public async Task<AdminUserDto?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _context.AdminUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        return user is null ? null : MapToDto(user);
    }

    public async Task<AdminUserDto> CreateUserAsync(CreateAdminUserRequest req, CancellationToken cancellationToken = default)
    {
        // 1. Şifreyi hash'le
        var passwordHash = _passwordHasher.HashPassword(req.Password);

        // 2. Entity oluştur
        var user = new AdminUser(
            email: req.Email.Trim().ToLowerInvariant(),
            fullName: req.FullName.Trim(),
            passwordHash: passwordHash,
            role: req.Role,
            isActive: true
        );

        await _context.AdminUsers.AddAsync(user, cancellationToken);

        // 3. AuditLog kaydı oluştur
        var auditLog = new AuditLog(
            action: "CreateAdminUser",
            resource: "AdminUser",
            adminUserId: user.Id,
            details: $"Yeni yönetici eklendi: {user.Email} ({user.Role})"
        );
        await _context.AuditLogs.AddAsync(auditLog, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(user);
    }

    public async Task<AdminUserDto?> UpdateUserStatusAsync(Guid id, bool isActive, CancellationToken cancellationToken = default)
    {
        var user = await _context.AdminUsers.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user is null) return null;

        user.ToggleStatus(isActive);

        var auditLog = new AuditLog(
            action: "UpdateUserStatus",
            resource: "AdminUser",
            adminUserId: user.Id,
            details: $"Kullanıcı durumu güncellendi: {user.Email} -> IsActive: {isActive}"
        );
        await _context.AuditLogs.AddAsync(auditLog, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(user);
    }

    public async Task<PaginatedList<AuditLogDto>> GetAuditLogsAsync(int page = 1, int pageSize = 10, CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.AuditLogs.AsNoTracking();
        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(a => a.TimestampUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto(
                a.Id,
                a.AdminUserId,
                a.Action,
                a.Resource,
                a.TimestampUtc,
                a.IpAddress,
                a.Details
            ))
            .ToListAsync(cancellationToken);

        return PaginatedList<AuditLogDto>.Create(items, totalCount, page, pageSize);
    }

    private static AdminUserDto MapToDto(AdminUser u) => new(
        u.Id,
        u.Email,
        u.FullName,
        u.Role,
        u.Role.ToString(),
        u.IsActive,
        u.CreatedAtUtc,
        u.LastLoginAtUtc
    );
}
