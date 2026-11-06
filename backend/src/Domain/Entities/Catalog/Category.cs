namespace Domain.Entities.Catalog;

public class Category
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = default!;
    public string Slug { get; private set; } = default!;
    public string? Description { get; private set; }
    public string? ImageUrl { get; private set; }
    public Guid? ParentCategoryId { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public Category? ParentCategory { get; private set; }
    public ICollection<Category> SubCategories { get; private set; } = new List<Category>();
    public ICollection<Product> Products { get; private set; } = new List<Product>();

    private Category() { }

    public Category(
        string name,
        string slug,
        string? description = null,
        string? imageUrl = null,
        Guid? parentCategoryId = null,
        int displayOrder = 0,
        bool isActive = true,
        Guid? id = null,
        DateTime? createdAtUtc = null)
    {
        Id = id ?? Guid.NewGuid();
        Name = name;
        Slug = slug;
        Description = description;
        ImageUrl = imageUrl;
        ParentCategoryId = parentCategoryId;
        DisplayOrder = displayOrder;
        IsActive = isActive;
        CreatedAtUtc = createdAtUtc ?? DateTime.UtcNow;
    }

    public void Update(
        string name,
        string slug,
        string? description,
        string? imageUrl,
        Guid? parentCategoryId,
        int displayOrder,
        bool isActive)
    {
        Name = name;
        Slug = slug;
        Description = description;
        ImageUrl = imageUrl;
        ParentCategoryId = parentCategoryId;
        DisplayOrder = displayOrder;
        IsActive = isActive;
    }
}
