namespace Application.Common;

/// <summary>
/// JWT token konfigürasyon ayarları. appsettings.json'dan bağlanır.
/// </summary>
public class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string SecretKey { get; set; } = default!;
    public string Issuer { get; set; } = "KoyKokusuApi";
    public string Audience { get; set; } = "KoyKokusuApp";
    public int AccessTokenExpirationMinutes { get; set; } = 60;
    public int RefreshTokenExpirationDays { get; set; } = 30;
}
