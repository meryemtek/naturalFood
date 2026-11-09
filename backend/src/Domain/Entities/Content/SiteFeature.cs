namespace Domain.Entities.Content;

public class SiteFeature
{
    public Guid Id { get; private set; }
    public string Title { get; private set; } = default!;
    public string Description { get; private set; } = default!;
    public string Icon { get; private set; } = default!; // feather/lucide icon name or svg
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; }

    private SiteFeature() { }

    public SiteFeature(
        string title,
        string description,
        string icon,
        int displayOrder = 0,
        bool isActive = true,
        Guid? id = null)
    {
        Id = id ?? Guid.NewGuid();
        Title = title;
        Description = description;
        Icon = icon;
        DisplayOrder = displayOrder;
        IsActive = isActive;
    }

    public void Update(string title, string description, string icon, int displayOrder, bool isActive)
    {
        Title = title;
        Description = description;
        Icon = icon;
        DisplayOrder = displayOrder;
        IsActive = isActive;
    }
}
