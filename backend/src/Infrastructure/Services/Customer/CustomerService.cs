using Application.Customer.DTOs;
using Application.Customer.Services;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services.Customer;

public class CustomerService : ICustomerService
{
    private readonly CustomerDbContext _db;
    private readonly CatalogDbContext _catalogDb;
    private readonly ILogger<CustomerService> _logger;

    public CustomerService(
        CustomerDbContext db,
        CatalogDbContext catalogDb,
        ILogger<CustomerService> logger)
    {
        _db = db;
        _catalogDb = catalogDb;
        _logger = logger;
    }

    // ===== Profil =====

    public async Task<CustomerProfileDto?> GetProfileAsync(Guid customerId, CancellationToken ct = default)
    {
        var customer = await _db.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId, ct);

        return customer == null ? null : MapToProfile(customer);
    }

    public async Task<CustomerProfileDto?> UpdateProfileAsync(Guid customerId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        var customer = await _db.Customers.FindAsync([customerId], ct);
        if (customer == null) return null;

        customer.UpdateProfile(request.FirstName, request.LastName, request.Phone);
        await _db.SaveChangesAsync(ct);

        return MapToProfile(customer);
    }

    // ===== Adresler =====

    public async Task<IReadOnlyList<AddressDto>> GetAddressesAsync(Guid customerId, CancellationToken ct = default)
    {
        var addresses = await _db.CustomerAddresses
            .AsNoTracking()
            .Where(a => a.CustomerId == customerId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAtUtc)
            .ToListAsync(ct);

        return addresses.Select(MapToAddressDto).ToList();
    }

    public async Task<AddressDto?> GetAddressByIdAsync(Guid customerId, Guid addressId, CancellationToken ct = default)
    {
        var address = await _db.CustomerAddresses
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == addressId && a.CustomerId == customerId, ct);

        return address == null ? null : MapToAddressDto(address);
    }

    public async Task<AddressDto> CreateAddressAsync(Guid customerId, AddressRequest request, CancellationToken ct = default)
    {
        // Eğer isDefault işaretlenmişse, diğer varsayılan adresi kaldır
        if (request.IsDefault)
        {
            await UnsetDefaultAddressesAsync(customerId, ct);
        }

        // İlk adres ise otomatik olarak varsayılan yap
        var hasAnyAddress = await _db.CustomerAddresses.AnyAsync(a => a.CustomerId == customerId, ct);
        var isDefault = request.IsDefault || !hasAnyAddress;

        var address = new Domain.Entities.Customer.CustomerAddress(
            customerId: customerId,
            title: request.Title,
            recipientName: request.RecipientName,
            phone: request.Phone,
            city: request.City,
            district: request.District,
            neighborhood: request.Neighborhood,
            fullAddress: request.FullAddress,
            postalCode: request.PostalCode,
            isDefault: isDefault,
            isBillingAddress: request.IsBillingAddress,
            companyName: request.CompanyName,
            taxOffice: request.TaxOffice,
            taxNumber: request.TaxNumber);

        _db.CustomerAddresses.Add(address);
        await _db.SaveChangesAsync(ct);

        return MapToAddressDto(address);
    }

    public async Task<AddressDto?> UpdateAddressAsync(Guid customerId, Guid addressId, AddressRequest request, CancellationToken ct = default)
    {
        var address = await _db.CustomerAddresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.CustomerId == customerId, ct);

        if (address == null) return null;

        if (request.IsDefault)
        {
            await UnsetDefaultAddressesAsync(customerId, ct);
        }

        address.Update(
            title: request.Title,
            recipientName: request.RecipientName,
            phone: request.Phone,
            city: request.City,
            district: request.District,
            neighborhood: request.Neighborhood,
            fullAddress: request.FullAddress,
            postalCode: request.PostalCode,
            isDefault: request.IsDefault,
            isBillingAddress: request.IsBillingAddress,
            companyName: request.CompanyName,
            taxOffice: request.TaxOffice,
            taxNumber: request.TaxNumber);

        await _db.SaveChangesAsync(ct);
        return MapToAddressDto(address);
    }

    public async Task<bool> DeleteAddressAsync(Guid customerId, Guid addressId, CancellationToken ct = default)
    {
        var address = await _db.CustomerAddresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.CustomerId == customerId, ct);

        if (address == null) return false;

        var wasDefault = address.IsDefault;

        _db.CustomerAddresses.Remove(address);
        await _db.SaveChangesAsync(ct);

        // Silinen varsayılansa, kalan ilk adresi varsayılan yap
        if (wasDefault)
        {
            var firstAddress = await _db.CustomerAddresses
                .Where(a => a.CustomerId == customerId)
                .OrderBy(a => a.CreatedAtUtc)
                .FirstOrDefaultAsync(ct);

            if (firstAddress != null)
            {
                firstAddress.SetAsDefault();
                await _db.SaveChangesAsync(ct);
            }
        }

        return true;
    }

    // ===== Favoriler =====

    public async Task<IReadOnlyList<WishlistItemDto>> GetWishlistAsync(Guid customerId, CancellationToken ct = default)
    {
        var wishlistItems = await _db.Wishlists
            .AsNoTracking()
            .Where(w => w.CustomerId == customerId)
            .OrderByDescending(w => w.AddedAtUtc)
            .ToListAsync(ct);

        if (wishlistItems.Count == 0)
            return [];

        // Ürün bilgilerini Catalog DbContext'ten çek
        var productIds = wishlistItems.Select(w => w.ProductId).ToList();
        var products = await _catalogDb.Products
            .AsNoTracking()
            .Include(p => p.Images)
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, ct);

        return wishlistItems.Select(w =>
        {
            products.TryGetValue(w.ProductId, out var product);
            var mainImage = product?.Images.FirstOrDefault(i => i.IsMain) ?? product?.Images.FirstOrDefault();

            return new WishlistItemDto(
                Id: w.Id,
                ProductId: w.ProductId,
                ProductName: product?.Name ?? "Silinmiş ürün",
                ProductSlug: product?.Slug ?? "",
                ProductImageUrl: mainImage?.ImageUrl,
                BasePrice: product?.BasePrice ?? 0,
                DiscountPrice: product?.DiscountPrice,
                InStock: (product?.StockQuantity ?? 0) > 0,
                AddedAtUtc: w.AddedAtUtc);
        }).ToList();
    }

    public async Task<WishlistItemDto> AddToWishlistAsync(Guid customerId, Guid productId, CancellationToken ct = default)
    {
        // Ürün var mı kontrol et
        var product = await _catalogDb.Products
            .AsNoTracking()
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == productId, ct)
            ?? throw new InvalidOperationException("Ürün bulunamadı.");

        // Zaten favoride mi kontrol et
        var existing = await _db.Wishlists
            .FirstOrDefaultAsync(w => w.CustomerId == customerId && w.ProductId == productId, ct);

        if (existing != null)
            throw new InvalidOperationException("Bu ürün zaten favorilerinizde.");

        var wishlistItem = new Domain.Entities.Customer.Wishlist(customerId, productId);
        _db.Wishlists.Add(wishlistItem);
        await _db.SaveChangesAsync(ct);

        var mainImage = product.Images.FirstOrDefault(i => i.IsMain) ?? product.Images.FirstOrDefault();

        return new WishlistItemDto(
            Id: wishlistItem.Id,
            ProductId: product.Id,
            ProductName: product.Name,
            ProductSlug: product.Slug,
            ProductImageUrl: mainImage?.ImageUrl,
            BasePrice: product.BasePrice,
            DiscountPrice: product.DiscountPrice,
            InStock: product.StockQuantity > 0,
            AddedAtUtc: wishlistItem.AddedAtUtc);
    }

    public async Task<bool> RemoveFromWishlistAsync(Guid customerId, Guid productId, CancellationToken ct = default)
    {
        var item = await _db.Wishlists
            .FirstOrDefaultAsync(w => w.CustomerId == customerId && w.ProductId == productId, ct);

        if (item == null) return false;

        _db.Wishlists.Remove(item);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> IsInWishlistAsync(Guid customerId, Guid productId, CancellationToken ct = default)
    {
        return await _db.Wishlists
            .AnyAsync(w => w.CustomerId == customerId && w.ProductId == productId, ct);
    }

    // ===== Yardımcı Metodlar =====

    private async Task UnsetDefaultAddressesAsync(Guid customerId, CancellationToken ct)
    {
        var currentDefaults = await _db.CustomerAddresses
            .Where(a => a.CustomerId == customerId && a.IsDefault)
            .ToListAsync(ct);

        foreach (var addr in currentDefaults)
            addr.UnsetDefault();
    }

    private static CustomerProfileDto MapToProfile(Domain.Entities.Customer.Customer customer)
    {
        return new CustomerProfileDto(
            Id: customer.Id,
            Email: customer.Email,
            FirstName: customer.FirstName,
            LastName: customer.LastName,
            Phone: customer.Phone,
            IsGuest: customer.IsGuest,
            CreatedAtUtc: customer.CreatedAtUtc,
            LastLoginAtUtc: customer.LastLoginAtUtc,
            Role: string.IsNullOrWhiteSpace(customer.Role) ? "Customer" : customer.Role);
    }

    private static AddressDto MapToAddressDto(Domain.Entities.Customer.CustomerAddress address)
    {
        return new AddressDto(
            Id: address.Id,
            Title: address.Title,
            RecipientName: address.RecipientName,
            Phone: address.Phone,
            City: address.City,
            District: address.District,
            Neighborhood: address.Neighborhood,
            FullAddress: address.FullAddress,
            PostalCode: address.PostalCode,
            IsDefault: address.IsDefault,
            IsBillingAddress: address.IsBillingAddress,
            CompanyName: address.CompanyName,
            TaxOffice: address.TaxOffice,
            TaxNumber: address.TaxNumber);
    }
}
