using Domain.Enums.Admin;

namespace Domain.Entities.Admin;

public class AdminUser
{
    public Guid Id { get; private set; }
    public string Email { get; private set; } = default!;
    public string FullName { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public AdminRole Role { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? LastLoginAtUtc { get; private set; }

    // EF Core için private parameterless constructor
    private AdminUser() { }

    public AdminUser(
        string email,
        string fullName,
        string passwordHash,
        AdminRole role,
        bool isActive = true,
        Guid? id = null,
        DateTime? createdAtUtc = null)
    {
        Id = id ?? Guid.NewGuid();
        Email = email;
        FullName = fullName;
        PasswordHash = passwordHash;
        Role = role;
        IsActive = isActive;
        CreatedAtUtc = createdAtUtc ?? DateTime.UtcNow;
    }

    public void UpdateProfile(string fullName, string email, AdminRole role, bool isActive)
    {
        FullName = fullName;
        Email = email;
        Role = role;
        IsActive = isActive;
    }

    public void SetPasswordHash(string passwordHash)
    {
        PasswordHash = passwordHash;
    }

    public void RecordLogin()
    {
        LastLoginAtUtc = DateTime.UtcNow;
    }

    public void ToggleStatus(bool isActive)
    {
        IsActive = isActive;
    }
}

