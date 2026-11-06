namespace Application.Customer.DTOs;

// =============================================
// Kimlik Doğrulama (Auth) DTO'ları
// =============================================

/// <summary>Üyelik kaydı isteği.</summary>
public record RegisterRequest(
    string Email,
    string Password,
    string PasswordConfirm,
    string FirstName,
    string LastName,
    string? Phone = null);

/// <summary>Giriş isteği.</summary>
public record LoginRequest(
    string Email,
    string Password);

/// <summary>Token yenileme isteği.</summary>
public record RefreshTokenRequest(
    string RefreshToken);

/// <summary>Şifremi unuttum isteği.</summary>
public record ForgotPasswordRequest(
    string Email);

/// <summary>Şifre sıfırlama isteği.</summary>
public record ResetPasswordRequest(
    string Token,
    string Email,
    string NewPassword,
    string NewPasswordConfirm);

/// <summary>Şifre değiştirme isteği (oturum açık).</summary>
public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword,
    string NewPasswordConfirm);

/// <summary>Başarılı kimlik doğrulama yanıtı.</summary>
public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAtUtc,
    CustomerProfileDto Customer);

// =============================================
// Müşteri Profil DTO'ları
// =============================================

/// <summary>Müşteri profil bilgileri (API yanıtı).</summary>
public record CustomerProfileDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string? Phone,
    bool IsGuest,
    DateTime CreatedAtUtc,
    DateTime? LastLoginAtUtc);

/// <summary>Profil güncelleme isteği.</summary>
public record UpdateProfileRequest(
    string FirstName,
    string LastName,
    string? Phone);

// =============================================
// Adres DTO'ları
// =============================================

/// <summary>Adres bilgileri (API yanıtı).</summary>
public record AddressDto(
    Guid Id,
    string Title,
    string RecipientName,
    string Phone,
    string City,
    string District,
    string? Neighborhood,
    string FullAddress,
    string? PostalCode,
    bool IsDefault,
    bool IsBillingAddress,
    string? CompanyName,
    string? TaxOffice,
    string? TaxNumber);

/// <summary>Adres oluşturma/güncelleme isteği.</summary>
public record AddressRequest(
    string Title,
    string RecipientName,
    string Phone,
    string City,
    string District,
    string? Neighborhood,
    string FullAddress,
    string? PostalCode = null,
    bool IsDefault = false,
    bool IsBillingAddress = false,
    string? CompanyName = null,
    string? TaxOffice = null,
    string? TaxNumber = null);

// =============================================
// Favori DTO'ları
// =============================================

/// <summary>Favori ürün bilgisi.</summary>
public record WishlistItemDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductSlug,
    string? ProductImageUrl,
    decimal BasePrice,
    decimal? DiscountPrice,
    bool InStock,
    DateTime AddedAtUtc);
