using Application.Orders;
using Application.Payments;
using Domain.Entities.Orders;
using Domain.Entities.Payments;
using Infrastructure.Orders;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Payments;
public class SimulatedPaymentService(OrdersDbContext db, IOrderService orders) : ISimulatedPaymentService
{
    private static SimulatedPaymentView Map(SimulatedPayment payment, string orderStatus) =>
        new(payment.Id, payment.OrderId, payment.Result, payment.Amount, "TRY", payment.CreatedAtUtc, true, orderStatus, "PayTR-Sim");

    public async Task<SimulatedPaymentView> SimulateAsync(Guid orderId, Guid? customerId, string? guestToken, string idempotencyKey, SimulatePaymentRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey) || idempotencyKey.Length > 128 || (request.Result != "Success" && request.Result != "Failure"))
            throw new ArgumentException("Geçerli işlem anahtarı ve Success veya Failure sonucu gereklidir.");
        if (await orders.GetAsync(orderId, customerId, guestToken, ct) == null) throw new KeyNotFoundException();
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        // Siparişi kilitlemek, tekrar istekleri ve rezervasyonun sona ermesini sıralar.
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT 1 FROM orders.\"Orders\" WHERE \"Id\" = {orderId} FOR UPDATE", ct);
        var order = await db.Orders.SingleAsync(x => x.Id == orderId, ct);
        var existing = await db.SimulatedPayments.SingleOrDefaultAsync(x => x.OrderId == orderId && x.IdempotencyKey == idempotencyKey, ct);
        if (existing != null)
        {
            if (existing.Result != request.Result) throw new InvalidOperationException("Bu işlem anahtarı farklı bir sonuçla kullanılmış.");
            return Map(existing, order.Status);
        }
        if (order.Status != "PendingPayment" || order.ReservationExpiresAtUtc <= DateTime.UtcNow)
            throw new InvalidOperationException("Sipariş ödeme simülasyonu için uygun değil.");
        var payment = new SimulatedPayment { OrderId = orderId, IdempotencyKey = idempotencyKey, Result = request.Result, Amount = order.Total };
        db.SimulatedPayments.Add(payment);

        if (request.Result == "Success")
        {
            order.Status = "Paid";
            db.StatusEvents.Add(new OrderStatusEvent
            {
                OrderId = order.Id,
                Status = "Paid",
                Note = "PayTR (Simüle) ödeme doğrulandı.",
                ActorId = customerId,
            });
        }
        else
        {
            db.StatusEvents.Add(new OrderStatusEvent
            {
                OrderId = order.Id,
                Status = "PendingPayment",
                Note = "PayTR (Simüle) ödeme denemesi başarısız oldu; ödeme bekleniyor.",
                ActorId = customerId,
            });
        }

        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Map(payment, order.Status);
    }
    public async Task<SimulatedPaymentView?> GetAsync(Guid orderId, Guid paymentId, Guid? customerId, string? guestToken, CancellationToken ct)
    {
        var order = await orders.GetAsync(orderId, customerId, guestToken, ct);
        if (order == null) return null;
        var payment = await db.SimulatedPayments.AsNoTracking().SingleOrDefaultAsync(x => x.OrderId == orderId && x.Id == paymentId, ct);
        return payment == null ? null : Map(payment, order.Status);
    }
}
