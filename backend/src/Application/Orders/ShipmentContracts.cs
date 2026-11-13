namespace Application.Orders;

public record ShipmentView(Guid OrderId, string Carrier, string TrackingNumber, string Status, DateTime? EstimatedDeliveryUtc, DateTime UpdatedAtUtc, string? TrackingUrl);

public interface IShipmentService
{
    Task<ShipmentView?> GetAsync(Guid orderId, Guid? customerId, string? guestToken, CancellationToken ct);
}
