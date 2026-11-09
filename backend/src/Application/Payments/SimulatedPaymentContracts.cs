namespace Application.Payments;
public record SimulatePaymentRequest(string Result);
public record SimulatedPaymentView(Guid Id, Guid OrderId, string Result, decimal Amount, string Currency, DateTime CreatedAtUtc, bool IsSimulation);
public interface ISimulatedPaymentService
{
    Task<SimulatedPaymentView> SimulateAsync(Guid orderId, Guid? customerId, string? guestToken, string idempotencyKey, SimulatePaymentRequest request, CancellationToken ct);
    Task<SimulatedPaymentView?> GetAsync(Guid orderId, Guid paymentId, Guid? customerId, string? guestToken, CancellationToken ct);
}
