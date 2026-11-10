namespace Domain.Entities.Catalog;

public class ProductLot
{
    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public string LotNumber { get; private set; } = default!;
    public DateTime ProductionDate { get; private set; }
    public DateTime ExpiryDate { get; private set; }
    public int Quantity { get; private set; }
    public string Status { get; private set; } = "Active"; // Active, NearExpiry, Expired, WrittenOff
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? UpdatedAtUtc { get; private set; }

    public Product? Product { get; private set; }

    private ProductLot() { }

    public ProductLot(
        Guid productId,
        string lotNumber,
        DateTime productionDate,
        DateTime expiryDate,
        int quantity,
        string status = "Active",
        Guid? id = null,
        DateTime? createdAtUtc = null)
    {
        if (quantity < 0)
            throw new ArgumentOutOfRangeException(nameof(quantity), "Parti miktarı negatif olamaz.");

        Id = id ?? Guid.NewGuid();
        ProductId = productId;
        LotNumber = lotNumber;
        ProductionDate = DateTime.SpecifyKind(productionDate, DateTimeKind.Utc);
        ExpiryDate = DateTime.SpecifyKind(expiryDate, DateTimeKind.Utc);
        Quantity = quantity;
        Status = string.IsNullOrWhiteSpace(status) ? "Active" : status;
        CreatedAtUtc = createdAtUtc ?? DateTime.UtcNow;
    }

    public void UpdateStatus(string newStatus)
    {
        Status = newStatus;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void AdjustQuantity(int delta)
    {
        var newQty = Quantity + delta;
        if (newQty < 0)
            throw new InvalidOperationException($"Yetersiz parti stoğu. Mevcut: {Quantity}, Talep: {Math.Abs(delta)}");

        Quantity = newQty;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
