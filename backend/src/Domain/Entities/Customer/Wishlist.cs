namespace Domain.Entities.Customer;

/// <summary>
/// Müşterinin favori ürünleri.
/// </summary>
public class Wishlist
{
    public Guid Id { get; private set; }
    public Guid CustomerId { get; private set; }
    public Guid ProductId { get; private set; }
    public DateTime AddedAtUtc { get; private set; }

    // Navigation
    public Customer? Customer { get; private set; }

    private Wishlist() { }

    public Wishlist(Guid customerId, Guid productId, Guid? id = null)
    {
        Id = id ?? Guid.NewGuid();
        CustomerId = customerId;
        ProductId = productId;
        AddedAtUtc = DateTime.UtcNow;
    }
}
