namespace Domain.Entities.Catalog;

public class Product
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = default!;
    public string Slug { get; private set; } = default!;
    public string ShortDescription { get; private set; } = default!;
    public string? Description { get; private set; }
    public Guid CategoryId { get; private set; }
    public decimal BasePrice { get; private set; }
    public decimal? DiscountPrice { get; private set; }
    public int StockQuantity { get; private set; }
    public string Sku { get; private set; } = default!;
    public string UnitInfo { get; private set; } = default!;
    public string? Ingredients { get; private set; }
    public List<string> Allergens { get; private set; } = new();
    public List<string> Certifications { get; private set; } = new();
    public NutritionalValues? NutritionalValues { get; private set; }
    public string? Origin { get; private set; }
    public string? StorageConditions { get; private set; }
    public string? ShelfLife { get; private set; }
    public bool IsBestSeller { get; private set; }
    public bool IsNew { get; private set; }
    public bool IsFeatured { get; private set; }
    public bool IsSeasonal { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? UpdatedAtUtc { get; private set; }

    public Category? Category { get; private set; }
    public ICollection<ProductImage> Images { get; private set; } = new List<ProductImage>();
    public ICollection<ProductVariant> Variants { get; private set; } = new List<ProductVariant>();
    public ICollection<ProductAttribute> Attributes { get; private set; } = new List<ProductAttribute>();
    public ICollection<ProductLot> Lots { get; private set; } = new List<ProductLot>();
    public Guid? StorageConditionId { get; private set; }
    public string? ShelfLocation { get; private set; }
    public StorageCondition? StorageCondition { get; private set; }

    private Product() { }

    public Product(
        string name,
        string slug,
        string shortDescription,
        string? description,
        Guid categoryId,
        decimal basePrice,
        decimal? discountPrice,
        int stockQuantity,
        string sku,
        string unitInfo,
        string? ingredients = null,
        List<string>? allergens = null,
        string? origin = null,
        string? storageConditions = null,
        string? shelfLife = null,
        bool isBestSeller = false,
        bool isNew = true,
        bool isFeatured = false,
        bool isSeasonal = false,
        bool isActive = true,
        Guid? id = null,
        DateTime? createdAtUtc = null,
        List<string>? certifications = null,
        NutritionalValues? nutritionalValues = null)
    {
        Id = id ?? Guid.NewGuid();
        Name = name;
        Slug = slug;
        ShortDescription = shortDescription;
        Description = description;
        CategoryId = categoryId;
        BasePrice = basePrice;
        DiscountPrice = discountPrice;
        StockQuantity = stockQuantity;
        Sku = sku;
        UnitInfo = unitInfo;
        Ingredients = ingredients;
        Allergens = allergens ?? new List<string>();
        Certifications = certifications ?? new List<string>();
        NutritionalValues = nutritionalValues;
        Origin = origin;
        StorageConditions = storageConditions;
        ShelfLife = shelfLife;
        IsBestSeller = isBestSeller;
        IsNew = isNew;
        IsFeatured = isFeatured;
        IsSeasonal = isSeasonal;
        IsActive = isActive;
        CreatedAtUtc = createdAtUtc ?? DateTime.UtcNow;
    }

    public void Update(
        string name,
        string slug,
        string shortDescription,
        string? description,
        Guid categoryId,
        decimal basePrice,
        decimal? discountPrice,
        int stockQuantity,
        string sku,
        string unitInfo,
        string? ingredients,
        List<string>? allergens,
        string? origin,
        string? storageConditions,
        string? shelfLife,
        bool isBestSeller,
        bool isNew,
        bool isFeatured,
        bool isSeasonal,
        bool isActive,
        List<string>? certifications = null,
        NutritionalValues? nutritionalValues = null)
    {
        Name = name;
        Slug = slug;
        ShortDescription = shortDescription;
        Description = description;
        CategoryId = categoryId;
        BasePrice = basePrice;
        DiscountPrice = discountPrice;
        StockQuantity = stockQuantity;
        Sku = sku;
        UnitInfo = unitInfo;
        Ingredients = ingredients;
        if (allergens != null) Allergens = allergens;
        if (certifications != null) Certifications = certifications;
        if (nutritionalValues != null) NutritionalValues = nutritionalValues;
        Origin = origin;
        StorageConditions = storageConditions;
        ShelfLife = shelfLife;
        IsBestSeller = isBestSeller;
        IsNew = isNew;
        IsFeatured = isFeatured;
        IsSeasonal = isSeasonal;
        IsActive = isActive;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void UpdateDetails(
        string? ingredients,
        List<string>? allergens,
        List<string>? certifications,
        NutritionalValues? nutritionalValues)
    {
        Ingredients = ingredients;
        Allergens = allergens ?? new List<string>();
        Certifications = certifications ?? new List<string>();
        NutritionalValues = nutritionalValues;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void AdjustStock(int delta)
    {
        var newStock = StockQuantity + delta;
        if (newStock < 0)
            throw new InvalidOperationException($"Yetersiz stok. Mevcut: {StockQuantity}, Talep: {Math.Abs(delta)}");

        StockQuantity = newStock;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetStock(int quantity)
    {
        if (quantity < 0)
            throw new ArgumentOutOfRangeException(nameof(quantity), "Stok negatif olamaz.");

        StockQuantity = quantity;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void UpdateStorage(Guid? storageConditionId, string? shelfLocation)
    {
        StorageConditionId = storageConditionId;
        ShelfLocation = shelfLocation;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
