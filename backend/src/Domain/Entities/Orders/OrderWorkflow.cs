namespace Domain.Entities.Orders;

public class OrderStatusEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public string Status { get; set; } = "";
    public string Note { get; set; } = "";
    public Guid? ActorId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public class OrderCustomerRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public string Kind { get; set; } = "";
    public string Reason { get; set; } = "";
    public string Status { get; set; } = "Pending";
    public string? Response { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAtUtc { get; set; }
    public Guid? ResolvedBy { get; set; }
}

// Demo records are never marked as sent to an external provider.
public class OrderNotification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid EventId { get; set; }
    public string Channel { get; set; } = "Email";
    public string Message { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public class OrderInvoice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public string Number { get; set; } = "";
    public DateTime IssuedAtUtc { get; set; } = DateTime.UtcNow;
}
