namespace Domain.Entities.Experience;
public class NewsletterSubscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public DateTime RequestedAtUtc { get; set; } = DateTime.UtcNow;
}
