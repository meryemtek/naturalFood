using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Orders;

public class ReservationExpiryWorker(IServiceScopeFactory scopes, ILogger<ReservationExpiryWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try { await ReleaseExpiredAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogError(ex, "Süresi dolan siparişler serbest bırakılamadı; yeniden denenecek."); }
        }
    }
    private async Task ReleaseExpiredAsync(CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OrdersDbContext>();
        var now = DateTime.UtcNow;
        var ids = await db.Orders.AsNoTracking().Where(x => x.Status == "PendingPayment" && x.ReservationExpiresAtUtc <= now).OrderBy(x => x.ReservationExpiresAtUtc).Select(x => x.Id).Take(50).ToListAsync(ct);
        foreach (var id in ids)
        {
            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            var updated = await db.Orders.Where(x => x.Id == id && x.Status == "PendingPayment" && x.ReservationExpiresAtUtc <= now).ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, "Cancelled"), ct);
            if (updated == 0) continue;
            var order = await db.Orders.Include(x => x.Lines).SingleAsync(x => x.Id == id, ct);
            await OrderWorkflowService.RestoreStockAsync(db, order, ct);
            OrderWorkflowService.Record(db, order, "Ödeme süresi dolduğu için sipariş iptal edildi.");
            var requests = await db.CustomerRequests.Where(x => x.OrderId == id && x.Status == "Pending").ToListAsync(ct);
            foreach (var request in requests) { request.Status = "Approved"; request.Response = "Sipariş ödeme süresi dolduğu için otomatik iptal edildi."; request.ResolvedAtUtc = DateTime.UtcNow; }
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        }
    }
}
