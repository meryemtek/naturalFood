namespace Application.Promotions;
public record CreateCouponRequest(string Code, string DiscountType, decimal DiscountValue, decimal MinimumSubtotal, DateTime? StartsAtUtc, DateTime? EndsAtUtc, int? UsageLimit, Guid? ProductId, Guid? CategoryId);
public record CouponCreated(Guid Id, string Code);
public interface ICouponCreationService
{
    Task<CouponCreated> CreateAsync(CreateCouponRequest request, CancellationToken ct);
}
