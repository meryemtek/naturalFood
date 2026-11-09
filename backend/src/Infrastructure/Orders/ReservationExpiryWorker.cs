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
            var lines = await db.Lines.AsNoTracking().Where(x => x.OrderId == id).ToListAsync(ct);
            foreach (var line in lines)
            {
                var rows = line.VariantId.HasValue
                    ? await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE catalog.\"ProductVariants\" SET \"StockQuantity\" = \"StockQuantity\" + {line.Quantity} WHERE \"Id\" = {line.VariantId.Value} AND \"ProductId\" = {line.ProductId}", ct)
                    : await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE catalog.\"Products\" SET \"StockQuantity\" = \"StockQuantity\" + {line.Quantity} WHERE \"Id\" = {line.ProductId}", ct);
                if (rows != 1) throw new InvalidOperationException($"Sipariş {id} stok kaydı bulunamadı.");
            }
            var couponId = await db.Orders.AsNoTracking().Where(x => x.Id == id).Select(x => x.CouponId).SingleAsync(ct);
            if (couponId.HasValue)
            {
                var count = await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE promotions.\"Coupons\" SET \"UsageCount\" = \"UsageCount\" - 1 WHERE \"Id\" = {couponId.Value} AND \"UsageCount\" > 0", ct);
                if (count != 1) throw new InvalidOperationException($"Sipariş {id} kupon rezervasyonu geri bırakılamadı.");
            }
            await transaction.CommitAsync(ct);
        }
    }
}
