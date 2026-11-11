namespace Domain.Entities.Customer;

/// <summary>
/// Müşteri varlığı. Kayıtlı kullanıcıları, yöneticileri ve misafir alışverişçileri temsil eder.
/// </summary>
public class Customer
{
    public Guid Id { get; private set; }
    public string Email { get; private set; } = default!;
    public string? PasswordHash { get; private set; }
    public string FirstName { get; private set; } = default!;
    public string LastName { get; private set; } = default!;
    public string? Phone { get; private set; }
    public string Role { get; private set; } = "Customer";
    public bool IsGuest { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? LastLoginAtUtc { get; private set; }

    // Navigation
    public ICollection<CustomerAddress> Addresses { get; private set; } = new List<CustomerAddress>();
    public ICollection<Wishlist> WishlistItems { get; private set; } = new List<Wishlist>();
    public ICollection<RefreshToken> RefreshTokens { get; private set; } = new List<RefreshToken>();

    private Customer() { }

    /// <summary>
    /// Kayıtlı müşteri veya yönetici oluşturur.
    /// </summary>
    public static Customer CreateRegistered(
        string email,
        string passwordHash,
        string firstName,
        string lastName,
        string? phone = null,
        Guid? id = null,
        string role = "Customer")
    {
        return new Customer
        {
            Id = id ?? Guid.NewGuid(),
            Email = email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash,
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Phone = phone?.Trim(),
            Role = string.IsNullOrWhiteSpace(role) ? "Customer" : role.Trim(),
            IsGuest = false,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Misafir müşteri oluşturur. Şifre olmadan sepet/sipariş verebilir.
    /// </summary>
    public static Customer CreateGuest(string email, string firstName, string lastName, string? phone = null)
    {
        return new Customer
        {
            Id = Guid.NewGuid(),
            Email = email.Trim().ToLowerInvariant(),
            PasswordHash = null,
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Phone = phone?.Trim(),
            Role = "Customer",
            IsGuest = true,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Misafir hesabı → kayıtlı hesaba dönüştürür.
    /// </summary>
    public void ConvertToRegistered(string passwordHash)
    {
        if (!IsGuest)
            throw new InvalidOperationException("Bu hesap zaten kayıtlı bir hesaptır.");

        PasswordHash = passwordHash;
        IsGuest = false;
    }

    public void UpdateProfile(string firstName, string lastName, string? phone)
    {
        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        Phone = phone?.Trim();
    }

    public void SetRole(string role)
    {
        Role = string.IsNullOrWhiteSpace(role) ? "Customer" : role.Trim();
    }

    public void ChangePassword(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
    }

    public void RecordLogin()
    {
        LastLoginAtUtc = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void Activate()
    {
        IsActive = true;
    }

    public string FullName => $"{FirstName} {LastName}";
}
