namespace Application.Orders;
public record TrackGuestOrderRequest(string OrderNumber);
public record CreateOrderRequest(string Email, string Phone, string DeliveryAddress, string BillingAddress);
public record OrderLineView(string Name, string Sku, int Quantity, decimal UnitPrice);
public record AdminOrderView(OrderView Order, bool IsGuest, string Email, string Phone, string DeliveryAddress, string BillingAddress);
public record AdminOrderPage(IReadOnlyList<AdminOrderView> Items, int Total, int Page, int PageSize);
public record OrderSummaryView(int TotalOrders, int WaitingPreparation, int InTransit, int ReturnRequests);
public record OrderView(Guid Id, string Number, string Status, decimal Subtotal, decimal ShippingFee, decimal Total, DateTime CreatedAtUtc, DateTime ReservationExpiresAtUtc, IReadOnlyList<OrderLineView> Lines, string? CouponCode, decimal Discount);
public interface IOrderService
{
    Task<AdminOrderPage> ListAdminAsync(int page, int pageSize, string? filter, string? search = null, CancellationToken ct = default);
    Task<OrderSummaryView> SummaryAsync(CancellationToken ct = default);
    Task<OrderView> CreateAsync(Guid? customerId, string? guestToken, string idempotencyKey, CreateOrderRequest request, CancellationToken ct);
    Task<OrderView?> TrackGuestAsync(string orderNumber, string? guestToken, CancellationToken ct);
    Task<OrderView?> GetAsync(Guid id, Guid? customerId, string? guestToken, CancellationToken ct);
    Task<IReadOnlyList<OrderView>> ListAsync(Guid customerId, CancellationToken ct);
}
