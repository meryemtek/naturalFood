using Application.Orders;
using Application.Payments;
using Domain.Entities.Payments;
using Infrastructure.Orders;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Payments;
public class SimulatedPaymentService(OrdersDbContext db, IOrderService orders) : ISimulatedPaymentService
{
    private static SimulatedPaymentView Map(SimulatedPayment payment) => new(payment.Id, payment.OrderId, payment.Result, payment.Amount, "TRY", payment.CreatedAtUtc, true);
    public async Task<SimulatedPaymentView> SimulateAsync(Guid orderId, Guid? customerId, string? guestToken, string idempotencyKey, SimulatePaymentRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey) || idempotencyKey.Length > 128 || (request.Result != "Success" && request.Result != "Failure"))
            throw new ArgumentException("Geçerli işlem anahtarı ve Success veya Failure sonucu gereklidir.");
        if (await orders.GetAsync(orderId, customerId, guestToken, ct) == null) throw new KeyNotFoundException();
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        // Siparişi kilitlemek, tekrar istekleri ve rezervasyonun sona ermesini sıralar.
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT 1 FROM orders.\"Orders\" WHERE \"Id\" = {orderId} FOR UPDATE", ct);
        var existing = await db.SimulatedPayments.SingleOrDefaultAsync(x => x.OrderId == orderId && x.IdempotencyKey == idempotencyKey, ct);
        if (existing != null)
        {
            if (existing.Result != request.Result) throw new InvalidOperationException("Bu işlem anahtarı farklı bir sonuçla kullanılmış.");
            return Map(existing);
        }
        var order = await db.Orders.AsNoTracking().SingleAsync(x => x.Id == orderId, ct);
        if (order.Status != "PendingPayment" || order.ReservationExpiresAtUtc <= DateTime.UtcNow)
            throw new InvalidOperationException("Sipariş ödeme simülasyonu için uygun değil.");
        var payment = new SimulatedPayment { OrderId = orderId, IdempotencyKey = idempotencyKey, Result = request.Result, Amount = order.Total };
        db.SimulatedPayments.Add(payment);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Map(payment);
    }
    public async Task<SimulatedPaymentView?> GetAsync(Guid orderId, Guid paymentId, Guid? customerId, string? guestToken, CancellationToken ct)
    {
        if (await orders.GetAsync(orderId, customerId, guestToken, ct) == null) return null;
        var payment = await db.SimulatedPayments.AsNoTracking().SingleOrDefaultAsync(x => x.OrderId == orderId && x.Id == paymentId, ct);
        return payment == null ? null : Map(payment);
    }
}
