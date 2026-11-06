using System.Security.Cryptography;
using System.Text;
using Application.Cart;
using Application.Promotions;
using Domain.Entities.Cart;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Cart;

public class CartService(CartDbContext carts, CatalogDbContext catalog, ICouponCalculator coupons) : ICartService
{
    private static string Hash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    public async Task<GuestCartCreated> CreateGuestAsync(CancellationToken ct)
    {
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var cart = new ShoppingCart { GuestTokenHash = Hash(token) };
        carts.Carts.Add(cart);
        await carts.SaveChangesAsync(ct);
        return new GuestCartCreated(token, new CartView(cart.Id, [], 0));
    }

    private async Task<ShoppingCart> FindAsync(Guid? customerId, string? token, CancellationToken ct)
    {
        if (customerId.HasValue)
        {
            var cart = await carts.Carts.Include(x => x.Items).SingleOrDefaultAsync(x => x.CustomerId == customerId, ct);
            if (cart != null) return cart;
            cart = new ShoppingCart { CustomerId = customerId };
            carts.Carts.Add(cart);
            await carts.SaveChangesAsync(ct);
            return cart;
        }
        if (string.IsNullOrWhiteSpace(token) || token.Length != 64) throw new UnauthorizedAccessException();
        var hash = Hash(token);
        return await carts.Carts.Include(x => x.Items).SingleOrDefaultAsync(x => x.GuestTokenHash == hash, ct)
            ?? throw new UnauthorizedAccessException();
    }

    private async Task<CartLine> PriceAsync(CartItem item, bool checkStock, CancellationToken ct)
    {
        var product = await catalog.Products.AsNoTracking().Include(x => x.Variants)
            .SingleOrDefaultAsync(x => x.Id == item.ProductId && x.IsActive, ct)
            ?? throw new InvalidOperationException("Ürün satışta değil.");
        var variant = item.VariantId.HasValue ? product.Variants.SingleOrDefault(x => x.Id == item.VariantId && x.IsActive) : null;
        if (item.VariantId.HasValue && variant == null) throw new InvalidOperationException("Varyant satışta değil.");
        if (variant == null && product.Variants.Any(x => x.IsActive)) throw new InvalidOperationException("Ürün için varyant seçilmelidir.");
        var stock = variant?.StockQuantity ?? product.StockQuantity;
        if (checkStock && stock < item.Quantity) throw new InvalidOperationException("Yetersiz stok.");
        var price = variant != null ? variant.DiscountPrice ?? variant.Price : product.DiscountPrice ?? product.BasePrice;
        return new CartLine(item.Id, product.Id, variant?.Id, product.CategoryId, product.Name, variant?.Sku ?? product.Sku, item.Quantity, price, stock, price * item.Quantity);
    }
    private async Task<CartView> ViewAsync(ShoppingCart cart, CancellationToken ct)
    {
        var lines = new List<CartLine>();
        foreach (var item in cart.Items) lines.Add(await PriceAsync(item, false, ct));
        var subtotal = lines.Sum(x => x.LineTotal);
        decimal discount = 0;
        string? error = null;
        if (!string.IsNullOrEmpty(cart.CouponCode))
        {
            try { discount = (await coupons.QuoteAsync(cart.CouponCode, lines.Select(x => new CouponLine(x.ProductId, x.CategoryId, x.LineTotal)).ToList(), ct)).Discount; }
            catch (InvalidOperationException ex) { error = ex.Message; }
        }
        return new CartView(cart.Id, lines, subtotal, cart.CouponCode, discount, subtotal - discount, error);
    }
    public async Task<CartView> GetAsync(Guid? customerId, string? guestToken, CancellationToken ct) => await ViewAsync(await FindAsync(customerId, guestToken, ct), ct);
    public async Task<CartView> SetItemAsync(Guid? customerId, string? guestToken, SetCartItemRequest request, CancellationToken ct)
    {
        if (request.Quantity is < 1 or > 100 || request.ProductId == Guid.Empty) throw new ArgumentException("Geçersiz ürün veya miktar.");
        var cart = await FindAsync(customerId, guestToken, ct);
        var item = cart.Items.SingleOrDefault(x => x.ProductId == request.ProductId && x.VariantId == request.VariantId);
        if (item == null) { item = new CartItem { CartId = cart.Id, ProductId = request.ProductId, VariantId = request.VariantId }; cart.Items.Add(item); carts.Items.Add(item); }
        item.Quantity = request.Quantity;
        await PriceAsync(item, true, ct);
        await carts.SaveChangesAsync(ct);
        return await ViewAsync(cart, ct);
    }
    public async Task<CartView> RemoveAsync(Guid? customerId, string? guestToken, Guid itemId, CancellationToken ct)
    {
        var cart = await FindAsync(customerId, guestToken, ct);
        var item = cart.Items.SingleOrDefault(x => x.Id == itemId) ?? throw new KeyNotFoundException();
        carts.Items.Remove(item); cart.Items.Remove(item);
        await carts.SaveChangesAsync(ct);
        return await ViewAsync(cart, ct);
    }
    public async Task<CartView> ClearAsync(Guid? customerId, string? guestToken, CancellationToken ct)
    {
        var cart = await FindAsync(customerId, guestToken, ct);
        carts.Items.RemoveRange(cart.Items); cart.Items.Clear(); cart.CouponCode = null;
        await carts.SaveChangesAsync(ct);
        return await ViewAsync(cart, ct);
    }
    public async Task<CartView> ApplyCouponAsync(Guid? customerId, string? guestToken, string code, CancellationToken ct)
    {
        var cart = await FindAsync(customerId, guestToken, ct);
        var current = await ViewAsync(cart, ct);
        var quote = await coupons.QuoteAsync(code, current.Items.Select(x => new CouponLine(x.ProductId, x.CategoryId, x.LineTotal)).ToList(), ct);
        cart.CouponCode = quote.Code;
        await carts.SaveChangesAsync(ct);
        return await ViewAsync(cart, ct);
    }
    public async Task<CartView> RemoveCouponAsync(Guid? customerId, string? guestToken, CancellationToken ct)
    {
        var cart = await FindAsync(customerId, guestToken, ct);
        cart.CouponCode = null;
        await carts.SaveChangesAsync(ct);
        return await ViewAsync(cart, ct);
    }
    public async Task<CartView> MergeAsync(Guid customerId, string guestToken, CancellationToken ct)
    {
        await using var transaction = await carts.Database.BeginTransactionAsync(ct);
        var guest = await FindAsync(null, guestToken, ct);
        var member = await FindAsync(customerId, null, ct);
        foreach (var source in guest.Items)
        {
            var target = member.Items.SingleOrDefault(x => x.ProductId == source.ProductId && x.VariantId == source.VariantId);
            if (target == null) { target = new CartItem { CartId = member.Id, ProductId = source.ProductId, VariantId = source.VariantId }; member.Items.Add(target); carts.Items.Add(target); }
            target.Quantity += source.Quantity;
            if (target.Quantity > 100) throw new InvalidOperationException("Sepet miktarı sınırı aşıldı.");
            await PriceAsync(target, true, ct);
        }
        member.CouponCode ??= guest.CouponCode;
        carts.Carts.Remove(guest);
        await carts.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return await ViewAsync(member, ct);
    }
}
