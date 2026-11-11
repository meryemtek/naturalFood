using Application.DTOs.Admin;
using Application.Services.Admin;
using Domain.Entities.Admin;
using Infrastructure.Experience;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Admin;

public class AdminReviewService : IAdminReviewService
{
    private readonly ExperienceDbContext _experienceDb;
    private readonly CatalogDbContext _catalogDb;
    private readonly CustomerDbContext _customerDb;
    private readonly AdminDbContext _adminDb;

    public AdminReviewService(
        ExperienceDbContext experienceDb,
        CatalogDbContext catalogDb,
        CustomerDbContext customerDb,
        AdminDbContext adminDb)
    {
        _experienceDb = experienceDb;
        _catalogDb = catalogDb;
        _customerDb = customerDb;
        _adminDb = adminDb;
    }

    private static bool IsResolved(string? adminResponse, string status) =>
        !string.IsNullOrWhiteSpace(adminResponse)
        || string.Equals(status, "Reviewed", StringComparison.OrdinalIgnoreCase)
        || string.Equals(status, "Resolved", StringComparison.OrdinalIgnoreCase);

    public async Task<DashboardReviewsAttentionResponse> GetDashboardAttentionReviewsAsync(CancellationToken cancellationToken = default)
    {
        var allReviews = await _experienceDb.Reviews
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var totalReviewCount = allReviews.Count;
        var avgRating = totalReviewCount > 0
            ? Math.Round((decimal)allReviews.Average(r => r.Rating), 1)
            : 0.0m;

        var negativeReviews = allReviews
            .Where(r => r.Rating <= 3)
            .OrderBy(r => IsResolved(r.AdminResponse, r.Status)) // Öncelikle incelenmemiş / yanıtlanmamışlar
            .ThenByDescending(r => r.CreatedAtUtc)
            .ToList();

        var unresolvedNegativeCount = negativeReviews.Count(r => !IsResolved(r.AdminResponse, r.Status));

        // Ana sayfa için son 5 müdahale bekleyen (Rating <= 3) yorum
        var topCritical = negativeReviews.Take(5).ToList();

        var productIds = topCritical.Select(r => r.ProductId).Distinct().ToList();
        var customerIds = topCritical.Select(r => r.CustomerId).Distinct().ToList();

        var productNames = await _catalogDb.Products
            .AsNoTracking()
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken);

        var customerNames = await _customerDb.Customers
            .AsNoTracking()
            .Where(c => customerIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, c => $"{c.FirstName} {c.LastName}".Trim(), cancellationToken);

        var criticalDtos = topCritical.Select(r => new DashboardAttentionReviewDto(
            Id: r.Id,
            CustomerName: customerNames.TryGetValue(r.CustomerId, out var cName) && !string.IsNullOrWhiteSpace(cName)
                ? cName
                : "Kayıtlı Müşteri",
            ProductName: productNames.TryGetValue(r.ProductId, out var pName)
                ? pName
                : "Doğal Gıda Ürünü",
            Rating: r.Rating,
            CommentText: r.Text,
            CreatedAtUtc: r.CreatedAtUtc,
            HasResponse: IsResolved(r.AdminResponse, r.Status),
            AdminResponse: r.AdminResponse,
            Status: r.Status
        )).ToList();

        return new DashboardReviewsAttentionResponse(
            AverageStoreRating: avgRating,
            TotalReviewCount: totalReviewCount,
            UnresolvedNegativeCount: unresolvedNegativeCount,
            CriticalReviews: criticalDtos
        );
    }

    public async Task<PaginatedAdminReviewsResponse> GetAllReviewsAsync(
        int? rating,
        string? status,
        bool? onlyNegative,
        string? search,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var allReviews = await _experienceDb.Reviews
            .AsNoTracking()
            .OrderByDescending(r => r.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var avgRating = allReviews.Count > 0
            ? Math.Round((decimal)allReviews.Average(r => r.Rating), 1)
            : 0.0m;

        var pendingCount = allReviews.Count(r => string.Equals(r.Status, "Pending", StringComparison.OrdinalIgnoreCase));
        var negativeUnresolvedCount = allReviews.Count(r => r.Rating <= 3 && !IsResolved(r.AdminResponse, r.Status));

        // Load related products & customers
        var productIds = allReviews.Select(r => r.ProductId).Distinct().ToList();
        var customerIds = allReviews.Select(r => r.CustomerId).Distinct().ToList();

        var products = await _catalogDb.Products
            .AsNoTracking()
            .Where(p => productIds.Contains(p.Id))
            .Select(p => new { p.Id, p.Name, p.Sku })
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        var customers = await _customerDb.Customers
            .AsNoTracking()
            .Where(c => customerIds.Contains(c.Id))
            .Select(c => new { c.Id, FullName = (c.FirstName + " " + c.LastName).Trim(), c.Email })
            .ToDictionaryAsync(c => c.Id, cancellationToken);

        IEnumerable<AdminReviewItemDto> mapped = allReviews.Select(r =>
        {
            products.TryGetValue(r.ProductId, out var p);
            customers.TryGetValue(r.CustomerId, out var c);
            return new AdminReviewItemDto(
                Id: r.Id,
                ProductId: r.ProductId,
                ProductName: p?.Name ?? "Doğal Gıda Ürünü",
                ProductSku: p?.Sku,
                CustomerId: r.CustomerId,
                CustomerName: !string.IsNullOrWhiteSpace(c?.FullName) ? c.FullName : "Kayıtlı Müşteri",
                CustomerEmail: c?.Email ?? "-",
                Rating: r.Rating,
                CommentText: r.Text,
                Status: r.Status,
                HasResponse: IsResolved(r.AdminResponse, r.Status),
                AdminResponse: r.AdminResponse,
                RespondedAtUtc: r.RespondedAtUtc,
                CreatedAtUtc: r.CreatedAtUtc
            );
        });

        // Apply filters
        if (rating.HasValue && rating.Value is >= 1 and <= 5)
        {
            mapped = mapped.Where(r => r.Rating == rating.Value);
        }

        if (onlyNegative == true)
        {
            mapped = mapped.Where(r => r.Rating <= 3);
        }

        if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status, "all", StringComparison.OrdinalIgnoreCase))
        {
            mapped = mapped.Where(r => string.Equals(r.Status, status.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLowerInvariant();
            mapped = mapped.Where(r =>
                r.CommentText.ToLowerInvariant().Contains(q) ||
                r.ProductName.ToLowerInvariant().Contains(q) ||
                r.CustomerName.ToLowerInvariant().Contains(q) ||
                (r.ProductSku != null && r.ProductSku.ToLowerInvariant().Contains(q)));
        }

        var filteredList = mapped.ToList();
        var totalCount = filteredList.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        var pagedItems = filteredList
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new PaginatedAdminReviewsResponse(
            Items: pagedItems,
            TotalCount: totalCount,
            Page: page,
            PageSize: pageSize,
            TotalPages: totalPages,
            AverageRating: avgRating,
            PendingCount: pendingCount,
            NegativeUnresolvedCount: negativeUnresolvedCount
        );
    }

    public async Task<AdminReviewItemDto?> QuickRespondAsync(
        Guid reviewId,
        QuickReviewResponseRequest req,
        CancellationToken cancellationToken = default)
    {
        var review = await _experienceDb.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);
        if (review == null)
            return null;

        var hasText = !string.IsNullOrWhiteSpace(req.ResponseText);
        if (hasText)
        {
            review.AdminResponse = req.ResponseText!.Trim();
            review.RespondedAtUtc = DateTime.UtcNow;
        }

        if (req.MarkAsReviewed || hasText)
        {
            review.Status = "Reviewed";
            review.RespondedAtUtc ??= DateTime.UtcNow;
        }

        await _experienceDb.SaveChangesAsync(cancellationToken);

        var product = await _catalogDb.Products.AsNoTracking()
            .Where(p => p.Id == review.ProductId)
            .Select(p => new { p.Name, p.Sku })
            .FirstOrDefaultAsync(cancellationToken);

        var customer = await _customerDb.Customers.AsNoTracking()
            .Where(c => c.Id == review.CustomerId)
            .Select(c => new { FullName = (c.FirstName + " " + c.LastName).Trim(), c.Email })
            .FirstOrDefaultAsync(cancellationToken);

        var audit = new AuditLog(
            action: hasText ? "ReviewResponded" : "ReviewMarkedAsReviewed",
            resource: "Experience.ProductReview",
            adminUserId: null,
            details: $"Yorum yanıtlandı/incelendi (Puan: {review.Rating}/5, Ürün: {product?.Name ?? review.ProductId.ToString()}, Müşteri: {customer?.FullName ?? "Kayıtlı Müşteri"}). Yanıt: {review.AdminResponse ?? "[İncelendi olarak işaretlendi]"}"
        );
        _adminDb.AuditLogs.Add(audit);
        await _adminDb.SaveChangesAsync(cancellationToken);

        return new AdminReviewItemDto(
            Id: review.Id,
            ProductId: review.ProductId,
            ProductName: product?.Name ?? "Doğal Gıda Ürünü",
            ProductSku: product?.Sku,
            CustomerId: review.CustomerId,
            CustomerName: !string.IsNullOrWhiteSpace(customer?.FullName) ? customer.FullName : "Kayıtlı Müşteri",
            CustomerEmail: customer?.Email ?? "-",
            Rating: review.Rating,
            CommentText: review.Text,
            Status: review.Status,
            HasResponse: IsResolved(review.AdminResponse, review.Status),
            AdminResponse: review.AdminResponse,
            RespondedAtUtc: review.RespondedAtUtc,
            CreatedAtUtc: review.CreatedAtUtc
        );
    }

    public async Task<AdminReviewItemDto?> UpdateReviewStatusAsync(
        Guid reviewId,
        string status,
        CancellationToken cancellationToken = default)
    {
        var review = await _experienceDb.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);
        if (review == null)
            return null;

        var oldStatus = review.Status;
        review.Status = status.Trim();
        await _experienceDb.SaveChangesAsync(cancellationToken);

        var product = await _catalogDb.Products.AsNoTracking()
            .Where(p => p.Id == review.ProductId)
            .Select(p => new { p.Name, p.Sku })
            .FirstOrDefaultAsync(cancellationToken);

        var customer = await _customerDb.Customers.AsNoTracking()
            .Where(c => c.Id == review.CustomerId)
            .Select(c => new { FullName = (c.FirstName + " " + c.LastName).Trim(), c.Email })
            .FirstOrDefaultAsync(cancellationToken);

        var audit = new AuditLog(
            action: "ReviewStatusUpdated",
            resource: "Experience.ProductReview",
            adminUserId: null,
            details: $"Yorum durumu değiştirildi ({oldStatus} -> {review.Status}, Ürün: {product?.Name ?? review.ProductId.ToString()})"
        );
        _adminDb.AuditLogs.Add(audit);
        await _adminDb.SaveChangesAsync(cancellationToken);

        return new AdminReviewItemDto(
            Id: review.Id,
            ProductId: review.ProductId,
            ProductName: product?.Name ?? "Doğal Gıda Ürünü",
            ProductSku: product?.Sku,
            CustomerId: review.CustomerId,
            CustomerName: !string.IsNullOrWhiteSpace(customer?.FullName) ? customer.FullName : "Kayıtlı Müşteri",
            CustomerEmail: customer?.Email ?? "-",
            Rating: review.Rating,
            CommentText: review.Text,
            Status: review.Status,
            HasResponse: IsResolved(review.AdminResponse, review.Status),
            AdminResponse: review.AdminResponse,
            RespondedAtUtc: review.RespondedAtUtc,
            CreatedAtUtc: review.CreatedAtUtc
        );
    }
}
