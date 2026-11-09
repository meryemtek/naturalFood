using Application.Promotions;
using Domain.Entities.Promotions;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Promotions;
public class CouponCreationService(PromotionsDbContext db, CatalogDbContext catalog) : ICouponCreationService
{
    public async Task<CouponCreated> CreateAsync(CreateCouponRequest request, CancellationToken ct)
    {
        var code = request.Code?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code) || code.Length > 64 || code.Any(c => !(c is >= 'A' and <= 'Z' or >= '0' and <= '9' or '-' or '_')) ||
            request.DiscountType is not ("Fixed" or "Percent") || request.DiscountValue <= 0 || (request.DiscountType == "Percent" && request.DiscountValue > 100) ||
            decimal.Round(request.DiscountValue, 2) != request.DiscountValue || request.MinimumSubtotal < 0 || decimal.Round(request.MinimumSubtotal, 2) != request.MinimumSubtotal ||
            request.UsageLimit is <= 0 || (request.ProductId.HasValue && request.CategoryId.HasValue) ||
            (request.StartsAtUtc.HasValue && request.StartsAtUtc.Value.Kind != DateTimeKind.Utc) || (request.EndsAtUtc.HasValue && request.EndsAtUtc.Value.Kind != DateTimeKind.Utc) ||
            (request.StartsAtUtc.HasValue && request.EndsAtUtc.HasValue && request.StartsAtUtc >= request.EndsAtUtc))
            throw new ArgumentException("Kupon bilgileri geçersiz.");
        if (request.ProductId.HasValue && !await catalog.Products.AnyAsync(x => x.Id == request.ProductId, ct)) throw new ArgumentException("Ürün bulunamadı.");
        if (request.CategoryId.HasValue && !await catalog.Categories.AnyAsync(x => x.Id == request.CategoryId, ct)) throw new ArgumentException("Kategori bulunamadı.");
        if (await db.Coupons.AnyAsync(x => x.Code == code, ct)) throw new InvalidOperationException("Kupon kodu zaten kullanılıyor.");
        var coupon = new Coupon { Code = code, DiscountType = request.DiscountType, DiscountValue = request.DiscountValue, MinimumSubtotal = request.MinimumSubtotal, StartsAtUtc = request.StartsAtUtc, EndsAtUtc = request.EndsAtUtc, UsageLimit = request.UsageLimit, ProductId = request.ProductId, CategoryId = request.CategoryId, IsActive = true };
        db.Coupons.Add(coupon);
        await db.SaveChangesAsync(ct);
        return new CouponCreated(coupon.Id, coupon.Code);
    }
}
