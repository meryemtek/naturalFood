namespace Domain.Entities.Experience;
public class Policy
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
