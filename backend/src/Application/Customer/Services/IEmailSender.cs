namespace Application.Customer.Services;

/// <summary>
/// E-posta gönderim servisi arayüzü.
/// </summary>
public interface IEmailSender
{
    /// <summary>
    /// Şifre sıfırlama bağlantısı içeren e-posta gönderir.
    /// SMTP yapılandırılmamışsa false döner.
    /// </summary>
    Task<bool> SendPasswordResetEmailAsync(string toEmail, string firstName, string resetUrl, CancellationToken ct = default);
}
