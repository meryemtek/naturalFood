using Application.Experience;
using Domain.Entities.Experience;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Experience;
public class ExperienceService(ExperienceDbContext db, CatalogDbContext catalog, CustomerDbContext customers) : IExperienceService
{
    private static string Email(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Length > 256 || !System.Net.Mail.MailAddress.TryCreate(email, out var parsed) || parsed.Address != email.Trim()) throw new ArgumentException("E-posta adresi geçersiz.");
        return email.Trim().ToLowerInvariant();
    }
    public async Task<IReadOnlyList<ReviewView>> ReviewsAsync(Guid productId, int page, CancellationToken ct)
    {
        page = Math.Clamp(page, 1, 10000);
        return await db.Reviews.AsNoTracking().Where(x => x.ProductId == productId && x.Status == "Approved")
            .OrderByDescending(x => x.CreatedAtUtc).ThenBy(x => x.Id).Skip((page - 1) * 20).Take(20)
            .Select(x => new ReviewView(x.Id, x.Rating, x.Text, x.CreatedAtUtc)).ToListAsync(ct);
    }
    public async Task<IReadOnlyList<CustomerReviewView>> CustomerReviewsAsync(Guid customerId, CancellationToken ct)
    {
        var reviews = await db.Reviews.AsNoTracking().Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.CreatedAtUtc).Take(100).ToListAsync(ct);
        var ids = reviews.Select(x => x.ProductId).Distinct().ToArray();
        var products = await catalog.Products.AsNoTracking().Where(x => ids.Contains(x.Id))
            .Select(x => new { x.Id, x.Name, x.Slug }).ToDictionaryAsync(x => x.Id, ct);
        return reviews.Select(x => {
            products.TryGetValue(x.ProductId, out var product);
            return new CustomerReviewView(x.Id, x.ProductId, product?.Name, product?.Slug, x.Rating, x.Text, x.Status, x.CreatedAtUtc);
        }).ToList();
    }
    public async Task AddReviewAsync(Guid productId, Guid customerId, CreateReviewRequest request, CancellationToken ct)
    {
        if (request.Rating is < 1 or > 5 || string.IsNullOrWhiteSpace(request.Text) || request.Text.Length > 2000) throw new ArgumentException("Yorum veya puan geçersiz.");
        if (!await customers.Customers.AnyAsync(x => x.Id == customerId && x.IsActive && !x.IsGuest, ct)) throw new UnauthorizedAccessException();
        if (!await catalog.Products.AnyAsync(x => x.Id == productId && x.IsActive, ct)) throw new KeyNotFoundException();
        if (await db.Reviews.AnyAsync(x => x.ProductId == productId && x.CustomerId == customerId, ct)) throw new InvalidOperationException("Bu ürün için yorumunuz zaten mevcut.");
        db.Reviews.Add(new ProductReview { ProductId = productId, CustomerId = customerId, Rating = request.Rating, Text = request.Text.Trim() });
        await db.SaveChangesAsync(ct);
    }
    public async Task ContactAsync(ContactRequest request, CancellationToken ct)
    {
        var email = Email(request.Email);
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 100 || string.IsNullOrWhiteSpace(request.Subject) || request.Subject.Length > 200 || string.IsNullOrWhiteSpace(request.Message) || request.Message.Length > 5000) throw new ArgumentException("İletişim bilgileri geçersiz.");
        db.Messages.Add(new ContactMessage { Name = request.Name.Trim(), Email = email, Subject = request.Subject.Trim(), Message = request.Message.Trim() });
        await db.SaveChangesAsync(ct);
    }
    public async Task SubscribeAsync(NewsletterRequest request, CancellationToken ct)
    {
        var email = Email(request.Email);
        if (!request.Consent) throw new ArgumentException("Bülten onayı gereklidir.");
        var id = Guid.NewGuid(); var now = DateTime.UtcNow;
        await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO experience.\"Subscriptions\" (\"Id\",\"Email\",\"Status\",\"RequestedAtUtc\") VALUES ({id},{email},{"Pending"},{now}) ON CONFLICT (\"Email\") DO NOTHING", ct);
    }
    public async Task<PolicyView?> PolicyAsync(string slug, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(slug) || slug.Length > 100) return null;
        return await db.Policies.AsNoTracking().Where(x => x.IsPublished && x.Slug == slug).Select(x => new PolicyView(x.Slug,x.Title,x.Content,x.UpdatedAtUtc)).FirstOrDefaultAsync(ct);
    }
}
