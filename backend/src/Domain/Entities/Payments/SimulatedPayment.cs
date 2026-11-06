namespace Domain.Entities.Payments;
public class SimulatedPayment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public string Result { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
