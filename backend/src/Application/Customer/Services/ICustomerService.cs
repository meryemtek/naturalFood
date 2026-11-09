using Application.Customer.DTOs;

namespace Application.Customer.Services;

/// <summary>
/// Müşteri profil, adres ve favori yönetim servisi arayüzü.
/// </summary>
public interface ICustomerService
{
    // Profil
    Task<CustomerProfileDto?> GetProfileAsync(Guid customerId, CancellationToken ct = default);
    Task<CustomerProfileDto?> UpdateProfileAsync(Guid customerId, UpdateProfileRequest request, CancellationToken ct = default);

    // Adresler
    Task<IReadOnlyList<AddressDto>> GetAddressesAsync(Guid customerId, CancellationToken ct = default);
    Task<AddressDto?> GetAddressByIdAsync(Guid customerId, Guid addressId, CancellationToken ct = default);
    Task<AddressDto> CreateAddressAsync(Guid customerId, AddressRequest request, CancellationToken ct = default);
    Task<AddressDto?> UpdateAddressAsync(Guid customerId, Guid addressId, AddressRequest request, CancellationToken ct = default);
    Task<bool> DeleteAddressAsync(Guid customerId, Guid addressId, CancellationToken ct = default);

    // Favoriler
    Task<IReadOnlyList<WishlistItemDto>> GetWishlistAsync(Guid customerId, CancellationToken ct = default);
    Task<WishlistItemDto> AddToWishlistAsync(Guid customerId, Guid productId, CancellationToken ct = default);
    Task<bool> RemoveFromWishlistAsync(Guid customerId, Guid productId, CancellationToken ct = default);
    Task<bool> IsInWishlistAsync(Guid customerId, Guid productId, CancellationToken ct = default);
}
