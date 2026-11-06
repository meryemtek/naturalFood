namespace Domain.Entities.Catalog;

public class ProductVariant
{
    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public string Name { get; private set; } = default!; // Örn: "500 gr Kavanoz", "1 kg Vakumlu Paket", "5 Litre Teneke"
    public string Sku { get; private set; } = default!;
    public decimal Price { get; private set; }
    public decimal? DiscountPrice { get; private set; }
    public int StockQuantity { get; private set; }
    public string UnitInfo { get; private set; } = default!; // Örn: "500 gr", "1 kg", "5 lt"
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; }

    public Product? Product { get; private set; }

    private ProductVariant() { }

    public ProductVariant(
        Guid productId,
        string name,
        string sku,
        decimal price,
        decimal? discountPrice,
        int stockQuantity,
        string unitInfo,
        int displayOrder = 0,
        bool isActive = true,
        Guid? id = null)
    {
        Id = id ?? Guid.NewGuid();
        ProductId = productId;
        Name = name;
        Sku = sku;
        Price = price;
        DiscountPrice = discountPrice;
        StockQuantity = stockQuantity;
        UnitInfo = unitInfo;
        DisplayOrder = displayOrder;
        IsActive = isActive;
    }

    public void Update(
        string name,
        string sku,
        decimal price,
        decimal? discountPrice,
        int stockQuantity,
        string unitInfo,
        int displayOrder,
        bool isActive)
    {
        Name = name;
        Sku = sku;
        Price = price;
        DiscountPrice = discountPrice;
        StockQuantity = stockQuantity;
        UnitInfo = unitInfo;
        DisplayOrder = displayOrder;
        IsActive = isActive;
    }

    public void AdjustStock(int delta)
    {
        var newStock = StockQuantity + delta;
        if (newStock < 0)
            throw new InvalidOperationException($"Varyant için yetersiz stok. Mevcut: {StockQuantity}, Talep: {Math.Abs(delta)}");

        StockQuantity = newStock;
    }
}
