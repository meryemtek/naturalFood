using System.Net;
using System.Net.Mail;
using Application.Common;
using Application.Customer.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.Services.Customer;

/// <summary>
/// SMTP üzerinden e-posta gönderir; ayarlar eksikse bağlantıyı loglar.
/// </summary>
public class SmtpEmailSender : IEmailSender
{
    private readonly EmailSettings _settings;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IOptions<EmailSettings> settings, ILogger<SmtpEmailSender> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string firstName, string resetUrl, CancellationToken ct = default)
    {
        if (!_settings.IsConfigured)
        {
            _logger.LogWarning("SMTP ayarları yapılandırılmadığı için şifre sıfırlama bağlantısı e-posta olarak gönderilemedi. Alıcı: {Email}, Bağlantı: {ResetUrl}", toEmail, resetUrl);
            return false;
        }

        var fromAddress = string.IsNullOrWhiteSpace(_settings.FromEmail) ? _settings.Username : _settings.FromEmail;
        var safeName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(firstName) ? "Değerli Müşterimiz" : firstName);
        var safeUrl = WebUtility.HtmlEncode(resetUrl);

        using var message = new MailMessage
        {
            From = new MailAddress(fromAddress, string.IsNullOrWhiteSpace(_settings.FromName) ? "Köyden Sofraya" : _settings.FromName),
            Subject = "Köyden Sofraya — Şifre Sıfırlama Bağlantınız",
            IsBodyHtml = true,
            Body = $"""
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #faf8f3; border: 1px solid #e5dfd3; border-radius: 12px; color: #2b2a27;">
                  <h2 style="color: #2f4f2f; margin-top: 0;">Şifre Sıfırlama Talebi</h2>
                  <p>Merhaba {safeName},</p>
                  <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni şifrenizi belirlemek için aşağıdaki düğmeye tıklayın:</p>
                  <p style="margin: 24px 0;">
                    <a href="{safeUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2f4f2f; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">Şifremi Sıfırla</a>
                  </p>
                  <p style="font-size: 13px; color: #666;">Bağlantı çalışmazsa aşağıdaki adresi tarayıcınıza kopyalayabilirsiniz (30 dakika geçerlidir):</p>
                  <p style="font-size: 12px; word-break: break-all; color: #2f4f2f;">{safeUrl}</p>
                  <hr style="border: none; border-top: 1px solid #e5dfd3; margin: 20px 0;" />
                  <p style="font-size: 12px; color: #777; margin-bottom: 0;">Bu talebi siz oluşturmadıysanız bu e-postayı dikkate almayabilirsiniz.</p>
                </div>
                """
        };
        message.To.Add(new MailAddress(toEmail));

        using var client = new SmtpClient(_settings.Host, _settings.Port)
        {
            EnableSsl = _settings.EnableSsl,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(_settings.Username, _settings.Password),
            DeliveryMethod = SmtpDeliveryMethod.Network
        };

        await client.SendMailAsync(message, ct);
        _logger.LogInformation("Şifre sıfırlama e-postası gönderildi: {Email}", toEmail);
        return true;
    }
}
