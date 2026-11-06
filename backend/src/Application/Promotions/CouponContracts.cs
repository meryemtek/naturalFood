namespace Application.Promotions;
public record CouponLine(Guid ProductId, Guid CategoryId, decimal Amount);
public record CouponQuote(string Code, decimal Discount);
public interface ICouponCalculator
{
    Task<CouponQuote> QuoteAsync(string code, IReadOnlyList<CouponLine> lines, CancellationToken ct);
}
