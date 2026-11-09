namespace Domain.Entities.Customer;

/// <summary>
/// JWT refresh token yönetimi. Her oturum için ayrı token saklanır.
/// </summary>
public class RefreshToken
{
    public Guid Id { get; private set; }
    public Guid CustomerId { get; private set; }
    public string Token { get; private set; } = default!;
    public DateTime ExpiresAtUtc { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? RevokedAtUtc { get; private set; }
    public string? ReplacedByToken { get; private set; }

    // Navigation
    public Customer? Customer { get; private set; }

    private RefreshToken() { }

    public RefreshToken(Guid customerId, string token, DateTime expiresAtUtc, Guid? id = null)
    {
        Id = id ?? Guid.NewGuid();
        CustomerId = customerId;
        Token = token;
        ExpiresAtUtc = expiresAtUtc;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAtUtc;
    public bool IsRevoked => RevokedAtUtc != null;
    public bool IsActive => !IsExpired && !IsRevoked;

    public void Revoke(string? replacedByToken = null)
    {
        RevokedAtUtc = DateTime.UtcNow;
        ReplacedByToken = replacedByToken;
    }
}
