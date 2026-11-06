namespace Application.Cart;

public record SetCartItemRequest(Guid ProductId, Guid? VariantId, int Quantity);
public record CartLine(Guid Id, Guid ProductId, Guid? VariantId, Guid CategoryId, string Name, string Sku, int Quantity, decimal UnitPrice, int AvailableStock, decimal LineTotal);
public record CartView(Guid Id, IReadOnlyList<CartLine> Items, decimal Subtotal, string? CouponCode = null, decimal Discount = 0, decimal Total = 0, string? CouponError = null);
public record ApplyCouponRequest(string Code);
public record GuestCartCreated(string Token, CartView Cart);

public interface ICartService
{
    Task<GuestCartCreated> CreateGuestAsync(CancellationToken ct);
    Task<CartView> GetAsync(Guid? customerId, string? guestToken, CancellationToken ct);
    Task<CartView> SetItemAsync(Guid? customerId, string? guestToken, SetCartItemRequest request, CancellationToken ct);
    Task<CartView> RemoveAsync(Guid? customerId, string? guestToken, Guid itemId, CancellationToken ct);
    Task<CartView> ClearAsync(Guid? customerId, string? guestToken, CancellationToken ct);
    Task<CartView> ApplyCouponAsync(Guid? customerId, string? guestToken, string code, CancellationToken ct);
    Task<CartView> RemoveCouponAsync(Guid? customerId, string? guestToken, CancellationToken ct);
    Task<CartView> MergeAsync(Guid customerId, string guestToken, CancellationToken ct);
}

