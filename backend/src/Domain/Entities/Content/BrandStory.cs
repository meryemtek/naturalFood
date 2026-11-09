namespace Domain.Entities.Content;

public class BrandStory
{
    public Guid Id { get; private set; }
    public string Title { get; private set; } = default!;
    public string Summary { get; private set; } = default!;
    public string FullContent { get; private set; } = default!;
    public string? ImageUrl { get; private set; }
    public string? BadgeText { get; private set; }
    public bool IsActive { get; private set; }

    private BrandStory() { }

    public BrandStory(
        string title,
        string summary,
        string fullContent,
        string? imageUrl = null,
        string? badgeText = null,
        bool isActive = true,
        Guid? id = null)
    {
        Id = id ?? Guid.NewGuid();
        Title = title;
        Summary = summary;
        FullContent = fullContent;
        ImageUrl = imageUrl;
        BadgeText = badgeText;
        IsActive = isActive;
    }

    public void Update(string title, string summary, string fullContent, string? imageUrl, string? badgeText, bool isActive)
    {
        Title = title;
        Summary = summary;
        FullContent = fullContent;
        ImageUrl = imageUrl;
        BadgeText = badgeText;
        IsActive = isActive;
    }
}
