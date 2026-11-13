using Application.Orders;
using Domain.Entities.Orders;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Orders;

public class OrderWorkflowService(OrdersDbContext db) : IOrderWorkflowService
{
    private static readonly Dictionary<string, string[]> Transitions = new()
    {
        ["PendingPayment"] = ["Paid", "Cancelled"],
        ["Paid"] = ["Preparing", "Cancelled"],
        ["Preparing"] = ["Shipped", "Cancelled"],
        ["Processing"] = ["Shipped", "Cancelled"],
        ["Shipped"] = ["Delivered"]
    };
    private static readonly Dictionary<string, string> Labels = new()
    {
        ["PendingPayment"] = "Ödeme bekleniyor", ["Paid"] = "Ödeme doğrulandı", ["Preparing"] = "Hazırlanıyor",
        ["Processing"] = "Hazırlanıyor", ["Shipped"] = "Kargoya verildi", ["Delivered"] = "Teslim edildi", ["Cancelled"] = "İptal edildi"
    };

    internal static void Record(OrdersDbContext db, Order order, string note, Guid? actor = null)
    {
        var entry = new OrderStatusEvent { OrderId = order.Id, Status = order.Status, Note = note, ActorId = actor };
        db.StatusEvents.Add(entry);
        var text = $"Sipariş {order.Number}: {Labels.GetValueOrDefault(order.Status, order.Status)}. {note}";
        foreach (var channel in new[] { "Email", "SMS" })
            db.Notifications.Add(new OrderNotification { OrderId = order.Id, EventId = entry.Id, Channel = channel, Message = text });
    }

    private async Task<Order> LockOrder(Guid id, CancellationToken ct)
    {
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT 1 FROM orders.\"Orders\" WHERE \"Id\"={id} FOR UPDATE", ct);
        return await db.Orders.Include(x => x.Lines).SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new KeyNotFoundException();
    }

    public async Task<OrderWorkflowView> GetAsync(Guid orderId, CancellationToken ct)
    {
        if (!await db.Orders.AnyAsync(x => x.Id == orderId, ct)) throw new KeyNotFoundException();
        var history = await db.StatusEvents.AsNoTracking().Where(x => x.OrderId == orderId).OrderBy(x => x.CreatedAtUtc)
            .Select(x => new OrderEventView(x.Id, x.Status, x.Note, x.CreatedAtUtc)).ToListAsync(ct);
        var shipment = await db.Shipments.AsNoTracking().SingleOrDefaultAsync(x => x.OrderId == orderId, ct);
        var requests = await db.CustomerRequests.AsNoTracking().Where(x => x.OrderId == orderId).OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new OrderRequestView(x.Id, x.Kind, x.Reason, x.Status, x.Response, x.CreatedAtUtc, x.ResolvedAtUtc)).ToListAsync(ct);
        var notifications = await db.Notifications.AsNoTracking().Where(x => x.OrderId == orderId).OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new OrderNotificationView(x.Id, x.Channel, x.Message, "Demo", x.CreatedAtUtc)).ToListAsync(ct);
        var invoice = await db.Invoices.AsNoTracking().SingleOrDefaultAsync(x => x.OrderId == orderId, ct);
        return new(history, shipment is null ? null : new(shipment.OrderId, shipment.Carrier, shipment.TrackingNumber, shipment.Status, shipment.EstimatedDeliveryUtc, shipment.UpdatedAtUtc, shipment.TrackingUrl),
            requests, notifications, invoice is null ? null : new(invoice.Number, invoice.IssuedAtUtc, true));
    }

    public async Task ChangeStatusAsync(Guid orderId, UpdateOrderStatusRequest request, Guid actorId, CancellationToken ct)
    {
        if (request.Note?.Length > 800) throw new ArgumentException("Açıklama en fazla 800 karakter olabilir.");
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var order = await LockOrder(orderId, ct);
        if (order.Status != request.ExpectedStatus) throw new InvalidOperationException("Sipariş durumu değişti. Listeyi yenileyin.");
        if (!Transitions.TryGetValue(order.Status, out var allowed) || !allowed.Contains(request.Status))
            throw new InvalidOperationException("Bu durum geçişine izin verilmiyor.");
        if (request.Status != "Cancelled" && await db.CustomerRequests.AnyAsync(x => x.OrderId == orderId && x.Kind == "Cancellation" && x.Status == "Pending", ct))
            throw new InvalidOperationException("Önce açık iptal talebini değerlendirin.");
        if (request.Status == "Paid" && (order.ReservationExpiresAtUtc <= DateTime.UtcNow || string.IsNullOrWhiteSpace(request.Note)))
            throw new InvalidOperationException("Rezervasyon süresi dolmuş veya ödeme doğrulama açıklaması girilmemiş. Bu işlem ödeme tahsil etmez.");
        if (request.Status == "Cancelled" && string.IsNullOrWhiteSpace(request.Note)) throw new ArgumentException("İptal açıklaması zorunludur.");
        if (request.Status == "Shipped")
        {
            if (string.IsNullOrWhiteSpace(request.Carrier) || request.Carrier.Length > 150 || string.IsNullOrWhiteSpace(request.TrackingNumber) || request.TrackingNumber.Length > 150)
                throw new ArgumentException("Kargo firması ve takip numarası zorunludur (en fazla 150 karakter).");
            if (!string.IsNullOrWhiteSpace(request.TrackingUrl) && (request.TrackingUrl.Length > 1000 || !Uri.TryCreate(request.TrackingUrl, UriKind.Absolute, out var uri) || uri.Scheme != "https" || !string.IsNullOrEmpty(uri.UserInfo)))
                throw new ArgumentException("Kargo bağlantısı geçerli bir HTTPS adresi olmalıdır.");
            if (request.EstimatedDeliveryUtc.HasValue && request.EstimatedDeliveryUtc.Value < DateTime.UtcNow)
                throw new ArgumentException("Tahmini teslimat geçmişte olamaz.");
            var shipment = await db.Shipments.SingleOrDefaultAsync(x => x.OrderId == orderId, ct);
            if (shipment is null) { shipment = new Shipment { OrderId = orderId }; db.Shipments.Add(shipment); }
            shipment.Carrier = request.Carrier.Trim(); shipment.TrackingNumber = request.TrackingNumber.Trim();
            shipment.TrackingUrl = string.IsNullOrWhiteSpace(request.TrackingUrl) ? null : request.TrackingUrl.Trim();
            shipment.EstimatedDeliveryUtc = request.EstimatedDeliveryUtc?.ToUniversalTime(); shipment.Status = "Shipped"; shipment.UpdatedAtUtc = DateTime.UtcNow;
        }
        if (request.Status == "Delivered")
        {
            var shipment = await db.Shipments.SingleOrDefaultAsync(x => x.OrderId == orderId, ct);
            if (shipment is not null) { shipment.Status = "Delivered"; shipment.UpdatedAtUtc = DateTime.UtcNow; }
        }
        if (request.Status == "Cancelled") await RestoreStockAsync(db, order, ct);
        var wasPaid = order.Status != "PendingPayment";
        order.Status = request.Status;
        var note = request.Note?.Trim() ?? "Sipariş durumu güncellendi.";
        if (request.Status == "Cancelled" && wasPaid) note += " Ödeme iadesi bu işlemle yapılmaz; ayrıca takip edilmelidir.";
        Record(db, order, note, actorId);
        if (request.Status == "Cancelled")
        {
            var requests = await db.CustomerRequests.Where(x => x.OrderId == orderId && x.Kind == "Cancellation" && x.Status == "Pending").ToListAsync(ct);
            foreach (var item in requests) { item.Status = "Approved"; item.Response = note; item.ResolvedAtUtc = DateTime.UtcNow; item.ResolvedBy = actorId; }
        }
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
    }

    internal static async Task RestoreStockAsync(OrdersDbContext db, Order order, CancellationToken ct)
    {
        foreach (var line in order.Lines.OrderBy(x => x.ProductId).ThenBy(x => x.VariantId))
        {
            var count = line.VariantId.HasValue
                ? await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE catalog.\"ProductVariants\" SET \"StockQuantity\"=\"StockQuantity\"+{line.Quantity} WHERE \"Id\"={line.VariantId.Value} AND \"ProductId\"={line.ProductId}", ct)
                : await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE catalog.\"Products\" SET \"StockQuantity\"=\"StockQuantity\"+{line.Quantity} WHERE \"Id\"={line.ProductId}", ct);
            if (count != 1) throw new InvalidOperationException("Stok geri yüklenemedi.");
        }
        if (order.CouponId.HasValue)
        {
            var count = await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE promotions.\"Coupons\" SET \"UsageCount\"=\"UsageCount\"-1 WHERE \"Id\"={order.CouponId.Value} AND \"UsageCount\">0", ct);
            if (count != 1) throw new InvalidOperationException("Kupon rezervasyonu geri yüklenemedi.");
        }
    }

    private static bool CanRequest(string status, string kind) => kind switch
    {
        "Cancellation" => status is "PendingPayment" or "Paid" or "Preparing" or "Processing",
        "Return" => status is "Delivered" or "Completed",
        _ => false
    };
    public async Task CreateRequestAsync(Guid orderId, CreateOrderCustomerRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Length > 1000) throw new ArgumentException("Talep nedeni zorunludur (en fazla 1000 karakter).");
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var order = await LockOrder(orderId, ct);
        if (!CanRequest(order.Status, request.Kind)) throw new InvalidOperationException("Bu sipariş için seçilen talep oluşturulamaz.");
        if (await db.CustomerRequests.AnyAsync(x => x.OrderId == orderId && x.Kind == request.Kind && (x.Status == "Pending" || x.Status == "Approved"), ct))
            throw new InvalidOperationException("Bu sipariş için açık veya onaylanmış bir talep zaten var.");
        db.CustomerRequests.Add(new OrderCustomerRequest { OrderId = orderId, Kind = request.Kind, Reason = request.Reason.Trim() });
        Record(db, order, request.Kind == "Cancellation" ? "İptal talebiniz alındı; değerlendirme bekleniyor." : "İade talebiniz alındı; değerlendirme bekleniyor.");
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
    }
    public async Task ResolveRequestAsync(Guid orderId, Guid requestId, ResolveOrderCustomerRequest request, Guid actorId, CancellationToken ct)
    {
        if (request.Decision is not ("Approved" or "Rejected") || string.IsNullOrWhiteSpace(request.Response) || request.Response.Length > 800)
            throw new ArgumentException("Karar ve müşteriye açıklama zorunludur (en fazla 800 karakter).");
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var order = await LockOrder(orderId, ct);
        var item = await db.CustomerRequests.SingleOrDefaultAsync(x => x.Id == requestId && x.OrderId == orderId, ct) ?? throw new KeyNotFoundException();
        if (item.Status != "Pending") throw new InvalidOperationException("Bu talep daha önce sonuçlandırılmış.");
        if (request.Decision == "Approved" && !CanRequest(order.Status, item.Kind)) throw new InvalidOperationException("Siparişin güncel durumu bu talebin onaylanmasına uygun değil.");
        var response = request.Response.Trim();
        if (request.Decision == "Approved" && item.Kind == "Cancellation")
        {
            var wasPaid = order.Status != "PendingPayment";
            await RestoreStockAsync(db, order, ct); order.Status = "Cancelled";
            if (wasPaid) response += " Ödeme iadesi bu işlemle yapılmaz; ayrıca takip edilmelidir.";
        }
        if (request.Decision == "Approved" && item.Kind == "Return") response += " İade onayı ödeme iadesi yapmaz; gönderim ve ödeme iadesi ayrıca takip edilir.";
        item.Status = request.Decision; item.Response = response; item.ResolvedAtUtc = DateTime.UtcNow; item.ResolvedBy = actorId;
        Record(db, order, $"{(item.Kind == "Return" ? "İade" : "İptal")} talebi {(request.Decision == "Approved" ? "onaylandı" : "reddedildi")}. {response}", actorId);
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
    }
    public async Task IssueDemoInvoiceAsync(Guid orderId, Guid actorId, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var order = await LockOrder(orderId, ct);
        if (order.Status is not ("Paid" or "Preparing" or "Processing" or "Shipped" or "Delivered" or "Completed")) throw new InvalidOperationException("Ödemesi doğrulanmış siparişler için demo belge oluşturulabilir.");
        if (await db.Invoices.AnyAsync(x => x.OrderId == orderId, ct)) return;
        db.Invoices.Add(new OrderInvoice { OrderId = orderId, Number = $"DEMO-{order.Number}" });
        Record(db, order, "Demo fatura görüntülemeye hazır. Mali belge değildir.", actorId);
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
    }
    public async Task<InvoiceView?> InvoiceAsync(Guid orderId, CancellationToken ct)
    {
        var invoice = await db.Invoices.AsNoTracking().SingleOrDefaultAsync(x => x.OrderId == orderId, ct);
        if (invoice is null) return null;
        var order = await db.Orders.AsNoTracking().Include(x => x.Lines).SingleAsync(x => x.Id == orderId, ct);
        return new(new(invoice.Number, invoice.IssuedAtUtc, true), new(order.Id, order.Number, order.Status, order.Subtotal, order.ShippingFee, order.Total, order.CreatedAtUtc, order.ReservationExpiresAtUtc,
            order.Lines.Select(x => new OrderLineView(x.Name, x.Sku, x.Quantity, x.UnitPrice)).ToList(), order.CouponCode, order.Discount ?? 0), order.Email, order.BillingAddress);
    }
}
