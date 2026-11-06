using Application.Promotions;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Promotions;
public class CouponCalculator(PromotionsDbContext promotions, CatalogDbContext catalog) : ICouponCalculator
{
    public async Task<CouponQuote> QuoteAsync(string code, IReadOnlyList<CouponLine> lines, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(code) || code.Length > 64) throw new ArgumentException("Kupon kodu geçersiz.");
        var normalized = code.Trim().ToUpperInvariant();
        var coupon = await promotions.Coupons.AsNoTracking().SingleOrDefaultAsync(x => x.Code == normalized, ct);
        var now = DateTime.UtcNow;
        if (coupon == null || !coupon.IsActive || coupon.StartsAtUtc > now || coupon.EndsAtUtc <= now || (coupon.UsageLimit.HasValue && coupon.UsageCount >= coupon.UsageLimit))
            throw new InvalidOperationException("Kupon geçersiz veya kullanılamıyor.");
        if (lines.Sum(x => x.Amount) < coupon.MinimumSubtotal) throw new InvalidOperationException("Kupon için minimum sepet tutarına ulaşılmadı.");
        var eligible = lines.AsEnumerable();
        if (coupon.ProductId.HasValue) eligible = eligible.Where(x => x.ProductId == coupon.ProductId);
        if (coupon.CategoryId.HasValue)
        {
            var categories = await catalog.Categories.AsNoTracking().Where(x => x.IsActive).Select(x => new { x.Id, x.ParentCategoryId }).ToListAsync(ct);
            var allowed = new HashSet<Guid>();
            var queue = new Queue<Guid>();
            if (categories.Any(x => x.Id == coupon.CategoryId)) queue.Enqueue(coupon.CategoryId.Value);
            while (queue.TryDequeue(out var id))
            {
                if (!allowed.Add(id)) continue;
                foreach (var child in categories.Where(x => x.ParentCategoryId == id)) queue.Enqueue(child.Id);
            }
            eligible = eligible.Where(x => allowed.Contains(x.CategoryId));
        }
        var total = eligible.Sum(x => x.Amount);
        if (total <= 0) throw new InvalidOperationException("Kupon sepetteki ürünlere uygulanamıyor.");
        var amount = coupon.DiscountType == "Percent" ? decimal.Round(total * coupon.DiscountValue / 100, 2, MidpointRounding.AwayFromZero) : coupon.DiscountValue;
        return new CouponQuote(coupon.Code, Math.Min(total, amount));
    }
}
