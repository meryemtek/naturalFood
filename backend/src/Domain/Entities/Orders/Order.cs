namespace Domain.Entities.Orders;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Number { get; set; } = Guid.NewGuid().ToString("N").ToUpperInvariant();
    public Guid CartId { get; set; }
    public Guid? CustomerId { get; set; }
    public string? GuestTokenHash { get; set; }
    public string IdempotencyKey { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string DeliveryAddress { get; set; } = "";
    public string BillingAddress { get; set; } = "";
    public string Status { get; set; } = "PendingPayment";
    public Guid? CouponId { get; set; }
    public string? CouponCode { get; set; }
    public decimal? Discount { get; set; }
    public decimal Subtotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal Total { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime ReservationExpiresAtUtc { get; set; }
    public List<OrderLine> Lines { get; set; } = [];
}
