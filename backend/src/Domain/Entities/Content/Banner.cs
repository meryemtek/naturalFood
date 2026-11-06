namespace Domain.Entities.Content;

public class Banner
{
    public Guid Id { get; private set; }
    public string Title { get; private set; } = default!;
    public string? Subtitle { get; private set; }
    public string ImageUrl { get; private set; } = default!;
    public string? TargetUrl { get; private set; }
    public string? ButtonText { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private Banner() { }

    public Banner(
        string title,
        string? subtitle,
        string imageUrl,
        string? targetUrl = null,
        string? buttonText = null,
        int displayOrder = 0,
        bool isActive = true,
        Guid? id = null,
        DateTime? createdAtUtc = null)
    {
        Id = id ?? Guid.NewGuid();
        Title = title;
        Subtitle = subtitle;
        ImageUrl = imageUrl;
        TargetUrl = targetUrl;
        ButtonText = buttonText;
        DisplayOrder = displayOrder;
        IsActive = isActive;
        CreatedAtUtc = createdAtUtc ?? DateTime.UtcNow;
    }

    public void Update(
        string title,
        string? subtitle,
        string imageUrl,
        string? targetUrl,
        string? buttonText,
        int displayOrder,
        bool isActive)
    {
        Title = title;
        Subtitle = subtitle;
        ImageUrl = imageUrl;
        TargetUrl = targetUrl;
        ButtonText = buttonText;
        DisplayOrder = displayOrder;
        IsActive = isActive;
    }
}
