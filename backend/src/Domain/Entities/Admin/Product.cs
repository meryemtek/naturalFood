namespace Domain.Entities.Admin;

public class Product
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = default!;
    public string? SKU { get; private set; }
    public string? Barcode { get; private set; }
    public string Category { get; private set; } = default!;
    public string SaleUnit { get; private set; } = default!;
    public decimal BasePrice { get; private set; }
    public decimal SellingPrice { get; private set; }
    public decimal StockQuantity { get; private set; }
    public string Status { get; private set; } = "Active"; // Active, LowStock, OutOfStock, Draft
    public string? ImageUrl { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? UpdatedAtUtc { get; private set; }

    // EF Core için private parameterless constructor
    private Product() { }

    public Product(
        string name,
        string category,
        string saleUnit,
        decimal sellingPrice,
        decimal basePrice = 0m,
        decimal stockQuantity = 0m,
        string? sku = null,
        string? barcode = null,
        string status = "Active",
        string? imageUrl = null,
        Guid? id = null,
        DateTime? createdAtUtc = null)
    {
        Id = id ?? Guid.NewGuid();
        Name = name;
        Category = category;
        SaleUnit = saleUnit;
        SellingPrice = sellingPrice;
        BasePrice = basePrice;
        StockQuantity = stockQuantity;
        SKU = sku;
        Barcode = barcode;
        Status = status;
        ImageUrl = imageUrl;
        CreatedAtUtc = createdAtUtc ?? DateTime.UtcNow;
        UpdatedAtUtc = null;
    }

    public void Update(
        string name,
        string category,
        string saleUnit,
        decimal sellingPrice,
        decimal basePrice,
        decimal stockQuantity,
        string? sku,
        string? barcode,
        string status,
        string? imageUrl)
    {
        Name = name;
        Category = category;
        SaleUnit = saleUnit;
        SellingPrice = sellingPrice;
        BasePrice = basePrice;
        StockQuantity = stockQuantity;
        SKU = sku;
        Barcode = barcode;
        Status = status;
        ImageUrl = imageUrl;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void UpdateStock(decimal newQuantity)
    {
        StockQuantity = newQuantity;
        if (StockQuantity <= 0)
        {
            Status = "OutOfStock";
        }
        else if (StockQuantity <= 5)
        {
            Status = "LowStock";
        }
        else if (Status != "Draft")
        {
            Status = "Active";
        }
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
