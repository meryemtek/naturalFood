namespace Application.Orders;

public record OrderEventView(Guid Id, string Status, string Note, DateTime CreatedAtUtc);
public record OrderRequestView(Guid Id, string Kind, string Reason, string Status, string? Response, DateTime CreatedAtUtc, DateTime? ResolvedAtUtc);
public record OrderNotificationView(Guid Id, string Channel, string Message, string DeliveryStatus, DateTime CreatedAtUtc);
public record InvoiceInfo(string Number, DateTime IssuedAtUtc, bool IsDemo);
public record OrderWorkflowView(IReadOnlyList<OrderEventView> History, ShipmentView? Shipment, IReadOnlyList<OrderRequestView> Requests, IReadOnlyList<OrderNotificationView> Notifications, InvoiceInfo? Invoice);
public record UpdateOrderStatusRequest(string ExpectedStatus, string Status, string? Note, string? Carrier, string? TrackingNumber, string? TrackingUrl, DateTime? EstimatedDeliveryUtc);
public record CreateOrderCustomerRequest(string Kind, string Reason);
public record ResolveOrderCustomerRequest(string Decision, string Response);
public record InvoiceView(InvoiceInfo Invoice, OrderView Order, string Email, string BillingAddress);

public interface IOrderWorkflowService
{
    Task<OrderWorkflowView> GetAsync(Guid orderId, CancellationToken ct);
    Task ChangeStatusAsync(Guid orderId, UpdateOrderStatusRequest request, Guid actorId, CancellationToken ct);
    Task CreateRequestAsync(Guid orderId, CreateOrderCustomerRequest request, CancellationToken ct);
    Task ResolveRequestAsync(Guid orderId, Guid requestId, ResolveOrderCustomerRequest request, Guid actorId, CancellationToken ct);
    Task IssueDemoInvoiceAsync(Guid orderId, Guid actorId, CancellationToken ct);
    Task<InvoiceView?> InvoiceAsync(Guid orderId, CancellationToken ct);
}
