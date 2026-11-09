using Application.Customer.DTOs;

namespace Application.Customer.Services;

/// <summary>
/// Kimlik doğrulama servisi arayüzü (register, login, token yönetimi).
/// </summary>
public interface IAuthService
{
    /// <summary>Yeni müşteri kaydı oluşturur.</summary>
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);

    /// <summary>E-posta ve şifre ile giriş yapar.</summary>
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);

    /// <summary>Refresh token ile yeni access token üretir.</summary>
    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken ct = default);

    /// <summary>Aktif refresh token'ı iptal ederek oturumu kapatır.</summary>
    Task LogoutAsync(Guid customerId, string refreshToken, CancellationToken ct = default);

    /// <summary>Şifre sıfırlama bağlantısı gönderir (loglara yazar — gerçek e-posta entegrasyonu sonradan).</summary>
    Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default);

    /// <summary>Şifre sıfırlama token'ı ile yeni şifre belirler.</summary>
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default);

    /// <summary>Oturum açık kullanıcı için şifre değiştirme.</summary>
    Task<bool> ChangePasswordAsync(Guid customerId, ChangePasswordRequest request, CancellationToken ct = default);
}
