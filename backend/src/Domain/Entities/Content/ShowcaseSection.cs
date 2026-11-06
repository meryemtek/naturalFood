namespace Domain.Entities.Content;

public class ShowcaseSection
{
    public Guid Id { get; private set; }
    public string Title { get; private set; } = default!;
    public string? Subtitle { get; private set; }
    public string SectionKey { get; private set; } = default!; // bestsellers, new_arrivals, discounted, seasonal, featured
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; }

    private ShowcaseSection() { }

    public ShowcaseSection(
        string title,
        string? subtitle,
        string sectionKey,
        int displayOrder = 0,
        bool isActive = true,
        Guid? id = null)
    {
        Id = id ?? Guid.NewGuid();
        Title = title;
        Subtitle = subtitle;
        SectionKey = sectionKey;
        DisplayOrder = displayOrder;
        IsActive = isActive;
    }

    public void Update(string title, string? subtitle, string sectionKey, int displayOrder, bool isActive)
    {
        Title = title;
        Subtitle = subtitle;
        SectionKey = sectionKey;
        DisplayOrder = displayOrder;
        IsActive = isActive;
    }
}
