namespace Domain.Entities.Cart;

public class ShoppingCart
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? CustomerId { get; set; }
    public string? GuestTokenHash { get; set; }
    public string? CouponCode { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public List<CartItem> Items { get; set; } = [];
}
