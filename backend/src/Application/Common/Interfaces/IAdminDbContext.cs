using Domain.Entities.Admin;
using Microsoft.EntityFrameworkCore;

namespace Application.Common.Interfaces;

public interface IAdminDbContext
{
    DbSet<AdminUser> AdminUsers { get; }
    DbSet<AuditLog> AuditLogs { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

