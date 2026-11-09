using Domain.Entities.Admin;
using Microsoft.EntityFrameworkCore;

namespace Application.Common.Interfaces;

public interface IAdminDbContext
{
    DbSet<AdminUser> AdminUsers { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<Product> Products { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
