using System.Data;
using System.Security.Cryptography;
using System.Text;
using Application.Orders;
using Application.Promotions;
using Infrastructure.Promotions;
using Infrastructure.Persistence;
using Domain.Entities.Orders;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Infrastructure.Orders;

public class OrderService(OrdersDbContext db, IConfiguration config) : IOrderService
{
    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
    private static OrderView View(Order x) => new(x.Id, x.Number, x.Status, x.Subtotal, x.ShippingFee, x.Total, x.CreatedAtUtc, x.ReservationExpiresAtUtc, x.Lines.Select(l => new OrderLineView(l.Name, l.Sku, l.Quantity, l.UnitPrice)).ToList(), x.CouponCode, x.Discount ?? 0);
    private static string? TokenHash(Guid? customer, string? token)
    {
        if (customer.HasValue) return null;
        if (string.IsNullOrWhiteSpace(token) || token.Length != 64) throw new UnauthorizedAccessException();
        return Hash(token);
    }
    public async Task<OrderView?> TrackGuestAsync(string orderNumber, string? guestToken, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(orderNumber) || orderNumber.Length != 32 || !Guid.TryParseExact(orderNumber, "N", out _)) return null;
        if (string.IsNullOrWhiteSpace(guestToken) || guestToken.Length != 64) return null;
        var hash = Hash(guestToken);
        var number = orderNumber.ToUpperInvariant();
        var order = await db.Orders.AsNoTracking().Include(x => x.Lines)
            .FirstOrDefaultAsync(x => x.Number == number && x.CustomerId == null && x.GuestTokenHash == hash, ct);
        return order == null ? null : View(order);
    }
    public async Task<OrderView?> GetAsync(Guid id, Guid? customerId, string? guestToken, CancellationToken ct)
    {
        var hash = TokenHash(customerId, guestToken);
        var order = await db.Orders.AsNoTracking().Include(x => x.Lines).FirstOrDefaultAsync(x => x.Id == id && (customerId.HasValue ? x.CustomerId == customerId : x.GuestTokenHash == hash), ct);
        return order == null ? null : View(order);
    }
    public async Task<IReadOnlyList<OrderView>> ListAsync(Guid customerId, CancellationToken ct)
    {
        var orders = await db.Orders.AsNoTracking().Include(x => x.Lines).Where(x => x.CustomerId == customerId).OrderByDescending(x => x.CreatedAtUtc).Take(100).ToListAsync(ct);
        return orders.Select(View).ToList();
    }
    public async Task<OrderView> CreateAsync(Guid? customerId, string? guestToken, string idempotencyKey, CreateOrderRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey) || idempotencyKey.Length > 128 || string.IsNullOrWhiteSpace(request.Email) || request.Email.Length > 256 || !System.Net.Mail.MailAddress.TryCreate(request.Email, out _) || string.IsNullOrWhiteSpace(request.Phone) || request.Phone.Length > 30 || string.IsNullOrWhiteSpace(request.DeliveryAddress) || request.DeliveryAddress.Length > 1000 || string.IsNullOrWhiteSpace(request.BillingAddress) || request.BillingAddress.Length > 1000)
            throw new ArgumentException("Sipariş bilgileri geçersiz.");
        var hash = TokenHash(customerId, guestToken);
        if (!config.GetValue<bool>("Checkout:Enabled"))
            throw new InvalidOperationException("Sipariş oluşturma henüz etkinleştirilmedi.");
        var fee = config.GetValue<decimal?>("Checkout:ShippingFee");
        var threshold = config.GetValue<decimal?>("Checkout:FreeShippingThreshold");
        var minutes = config.GetValue<int?>("Checkout:ReservationMinutes");
        if (fee is null or < 0 || threshold is null or < 0 || minutes is null or < 1) throw new InvalidOperationException("Sipariş kuralları henüz yapılandırılmadı.");
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var conn = (NpgsqlConnection)db.Database.GetDbConnection();
        var tx = (NpgsqlTransaction)transaction.GetDbTransaction();
        await using var getCart = new NpgsqlCommand("SELECT \"Id\" FROM cart.\"Carts\" WHERE (\"CustomerId\" = @customer OR \"GuestTokenHash\" = @hash) FOR UPDATE", conn, tx);
        getCart.Parameters.AddWithValue("customer", NpgsqlTypes.NpgsqlDbType.Uuid, (object?)customerId ?? DBNull.Value);
        getCart.Parameters.AddWithValue("hash", NpgsqlTypes.NpgsqlDbType.Text, (object?)hash ?? DBNull.Value);
        var cartResult = await getCart.ExecuteScalarAsync(ct);
        if (cartResult is not Guid cartId) throw new UnauthorizedAccessException();
        var existing = await db.Orders.Include(x => x.Lines).SingleOrDefaultAsync(x => x.CartId == cartId && x.IdempotencyKey == idempotencyKey, ct);
        if (existing != null) return View(existing);
        var items = new List<(Guid Product, Guid? Variant, int Quantity)>();
        await using (var cmd = new NpgsqlCommand("SELECT \"ProductId\", \"VariantId\", \"Quantity\" FROM cart.\"Items\" WHERE \"CartId\" = @id ORDER BY \"ProductId\", \"VariantId\"", conn, tx))
        {
            cmd.Parameters.AddWithValue("id", cartId);
            await using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct)) items.Add((reader.GetGuid(0), reader.IsDBNull(1) ? null : reader.GetGuid(1), reader.GetInt32(2)));
        }
        if (items.Count == 0) throw new InvalidOperationException("Sepet boş.");
        var order = new Order { CartId = cartId, CustomerId = customerId, GuestTokenHash = hash, IdempotencyKey = idempotencyKey, Email = request.Email.Trim(), Phone = request.Phone.Trim(), DeliveryAddress = request.DeliveryAddress.Trim(), BillingAddress = request.BillingAddress.Trim(), ReservationExpiresAtUtc = DateTime.UtcNow.AddMinutes(minutes.Value) };
        foreach (var item in items)
        {
            string productName; string sku; decimal price;
            await using (var cmd = new NpgsqlCommand("SELECT \"Name\", \"Sku\", COALESCE(\"DiscountPrice\", \"BasePrice\") FROM catalog.\"Products\" WHERE \"Id\"=@id AND \"IsActive\" FOR UPDATE", conn, tx))
            {
                cmd.Parameters.AddWithValue("id", item.Product);
                await using var r = await cmd.ExecuteReaderAsync(ct);
                if (!await r.ReadAsync(ct)) throw new InvalidOperationException("Ürün satışta değil.");
                productName = r.GetString(0); sku = r.GetString(1); price = r.GetDecimal(2);
            }
            if (item.Variant.HasValue)
            {
                await using var cmd = new NpgsqlCommand("UPDATE catalog.\"ProductVariants\" SET \"StockQuantity\"=\"StockQuantity\"-@qty WHERE \"Id\"=@id AND \"ProductId\"=@product AND \"IsActive\" AND \"StockQuantity\">=@qty RETURNING \"Sku\", COALESCE(\"DiscountPrice\",\"Price\")", conn, tx);
                cmd.Parameters.AddWithValue("qty", item.Quantity); cmd.Parameters.AddWithValue("id", item.Variant.Value); cmd.Parameters.AddWithValue("product", item.Product);
                await using var r = await cmd.ExecuteReaderAsync(ct);
                if (!await r.ReadAsync(ct)) throw new InvalidOperationException("Varyant için stok yetersiz.");
                sku = r.GetString(0); price = r.GetDecimal(1);
            }
            else
            {
                await using var cmd = new NpgsqlCommand("UPDATE catalog.\"Products\" SET \"StockQuantity\"=\"StockQuantity\"-@qty WHERE \"Id\"=@id AND \"StockQuantity\">=@qty AND NOT EXISTS (SELECT 1 FROM catalog.\"ProductVariants\" WHERE \"ProductId\"=@id AND \"IsActive\")", conn, tx);
                cmd.Parameters.AddWithValue("qty", item.Quantity); cmd.Parameters.AddWithValue("id", item.Product);
                if (await cmd.ExecuteNonQueryAsync(ct) != 1) throw new InvalidOperationException("Stok yetersiz veya varyant seçilmedi.");
            }
            if (price < 0) throw new InvalidOperationException("Ürün fiyatı geçersiz.");
            order.Lines.Add(new OrderLine { OrderId = order.Id, ProductId = item.Product, VariantId = item.Variant, Name = productName, Sku = sku, Quantity = item.Quantity, UnitPrice = price });
        }
        order.Subtotal = order.Lines.Sum(x => x.UnitPrice * x.Quantity);
        await using (var readCoupon = new NpgsqlCommand("SELECT \"CouponCode\" FROM cart.\"Carts\" WHERE \"Id\"=@id", conn, tx))
        {
            readCoupon.Parameters.AddWithValue("id", cartId);
            var couponValue = await readCoupon.ExecuteScalarAsync(ct);
            if (couponValue is string code)
            {
                await using var couponLock = new NpgsqlCommand("SELECT \"Id\" FROM promotions.\"Coupons\" WHERE \"Code\"=@code FOR UPDATE", conn, tx);
                couponLock.Parameters.AddWithValue("code", code);
                if (await couponLock.ExecuteScalarAsync(ct) is not Guid couponId) throw new InvalidOperationException("Kupon geçersiz.");
                var promoOptions = new DbContextOptionsBuilder<PromotionsDbContext>().UseNpgsql(conn).Options;
                var catalogOptions = new DbContextOptionsBuilder<CatalogDbContext>().UseNpgsql(conn).Options;
                await using var promoDb = new PromotionsDbContext(promoOptions);
                await using var catalogDb = new CatalogDbContext(catalogOptions);
                await promoDb.Database.UseTransactionAsync(tx, ct);
                await catalogDb.Database.UseTransactionAsync(tx, ct);
                var categories = await catalogDb.Products.AsNoTracking().Where(p => order.Lines.Select(l => l.ProductId).Contains(p.Id)).Select(p => new { p.Id, p.CategoryId }).ToDictionaryAsync(x => x.Id, x => x.CategoryId, ct);
                var lines = order.Lines.Select(l => new CouponLine(l.ProductId, categories[l.ProductId], l.UnitPrice * l.Quantity)).ToList();
                var quote = await new CouponCalculator(promoDb, catalogDb).QuoteAsync(code, lines, ct);
                var updated = await promoDb.Coupons.Where(c => c.Id == couponId && (!c.UsageLimit.HasValue || c.UsageCount < c.UsageLimit)).ExecuteUpdateAsync(set => set.SetProperty(c => c.UsageCount, c => c.UsageCount + 1), ct);
                if (updated != 1) throw new InvalidOperationException("Kupon kullanım limiti doldu.");
                order.CouponId = couponId;
                order.CouponCode = quote.Code;
                order.Discount = quote.Discount;
            }
        }
        var discountedSubtotal = order.Subtotal - (order.Discount ?? 0);
        order.ShippingFee = discountedSubtotal >= threshold ? 0 : fee.Value;
        order.Total = discountedSubtotal + order.ShippingFee;
        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);
        await using (var clear = new NpgsqlCommand("DELETE FROM cart.\"Items\" WHERE \"CartId\"=@id", conn, tx)) { clear.Parameters.AddWithValue("id", cartId); await clear.ExecuteNonQueryAsync(ct); }
        await using (var clearCoupon = new NpgsqlCommand("UPDATE cart.\"Carts\" SET \"CouponCode\"=NULL WHERE \"Id\"=@id", conn, tx)) { clearCoupon.Parameters.AddWithValue("id", cartId); await clearCoupon.ExecuteNonQueryAsync(ct); }
        await transaction.CommitAsync(ct);
        return View(order);
    }
}
