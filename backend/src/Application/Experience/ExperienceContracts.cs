namespace Application.Experience;
public record CreateReviewRequest(int Rating, string Text);
public record ReviewView(Guid Id, int Rating, string Text, DateTime CreatedAtUtc);
public record CustomerReviewView(Guid Id, Guid ProductId, string? ProductName, string? ProductSlug, int Rating, string Text, string Status, DateTime CreatedAtUtc);
public record CanReviewView(bool CanReview, string? Reason = null);
public record ContactRequest(string Name, string Email, string Subject, string Message);
public record NewsletterRequest(string Email, bool Consent);
public record PolicyView(string Slug, string Title, string Content, DateTime UpdatedAtUtc);
public interface IExperienceService
{
    Task<IReadOnlyList<ReviewView>> ReviewsAsync(Guid productId, int page, CancellationToken ct);
    Task<IReadOnlyList<CustomerReviewView>> CustomerReviewsAsync(Guid customerId, CancellationToken ct);
    Task<CanReviewView> CanReviewAsync(Guid productId, Guid customerId, CancellationToken ct);
    Task AddReviewAsync(Guid productId, Guid customerId, CreateReviewRequest request, CancellationToken ct);
    Task ContactAsync(ContactRequest request, CancellationToken ct);
    Task SubscribeAsync(NewsletterRequest request, CancellationToken ct);
    Task<PolicyView?> PolicyAsync(string slug, CancellationToken ct);
}
