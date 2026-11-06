namespace Domain.Entities.Catalog;

public class ProductImage
{
    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public string ImageUrl { get; private set; } = default!;
    public string? AltText { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsMain { get; private set; }

    public Product? Product { get; private set; }

    private ProductImage() { }

    public ProductImage(
        Guid productId,
        string imageUrl,
        string? altText = null,
        int displayOrder = 0,
        bool isMain = false,
        Guid? id = null)
    {
        Id = id ?? Guid.NewGuid();
        ProductId = productId;
        ImageUrl = imageUrl;
        AltText = altText;
        DisplayOrder = displayOrder;
        IsMain = isMain;
    }

    public void SetMain(bool isMain)
    {
        IsMain = isMain;
    }

    public void Update(string imageUrl, string? altText, int displayOrder, bool isMain)
    {
        ImageUrl = imageUrl;
        AltText = altText;
        DisplayOrder = displayOrder;
        IsMain = isMain;
    }
}
