namespace Admin.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; private set; }
    public Guid? AdminUserId { get; private set; }
    public string Action { get; private set; } = default!;
    public string Resource { get; private set; } = default!;
    public DateTime TimestampUtc { get; private set; }
    public string? IpAddress { get; private set; }
    public string? Details { get; private set; }

    // EF Core için constructor
    private AuditLog() { }

    public AuditLog(
        string action,
        string resource,
        Guid? adminUserId = null,
        string? details = null,
        string? ipAddress = null,
        Guid? id = null,
        DateTime? timestampUtc = null)
    {
        Id = id ?? Guid.NewGuid();
        Action = action;
        Resource = resource;
        AdminUserId = adminUserId;
        Details = details;
        IpAddress = ipAddress;
        TimestampUtc = timestampUtc ?? DateTime.UtcNow;
    }
}
