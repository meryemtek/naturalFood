using Admin.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Admin.Application.Common.Interfaces;

public interface IAdminDbContext
{
    DbSet<AdminUser> AdminUsers { get; }
    DbSet<AuditLog> AuditLogs { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
