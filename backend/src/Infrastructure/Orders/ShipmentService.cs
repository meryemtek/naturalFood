using Application.Orders;
using Domain.Entities.Orders;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Orders;

public class ShipmentService(OrdersDbContext db, IOrderService orders) : IShipmentService
{
    private static ShipmentView Map(Shipment x) => new(x.OrderId, x.Carrier, x.TrackingNumber, x.Status, x.EstimatedDeliveryUtc, x.UpdatedAtUtc);

    public async Task<ShipmentView?> GetAsync(Guid orderId, Guid? customerId, string? guestToken, CancellationToken ct)
    {
        if (await orders.GetAsync(orderId, customerId, guestToken, ct) == null) return null;
        var shipment = await db.Shipments.AsNoTracking().SingleOrDefaultAsync(x => x.OrderId == orderId, ct);
        return shipment == null ? null : Map(shipment);
    }

}
