namespace Domain.Entities.Catalog;

public class StorageCondition
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = default!;
    public decimal MinTemperature { get; private set; }
    public decimal MaxTemperature { get; private set; }
    public int? MaxHumidity { get; private set; }
    public bool RequiresColdChain { get; private set; }
    public string DefaultShelfZone { get; private set; } = default!;
    public string? Description { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public ICollection<Product> Products { get; private set; } = new List<Product>();

    private StorageCondition() { }

    public StorageCondition(
        string name,
        decimal minTemperature,
        decimal maxTemperature,
        int? maxHumidity,
        bool requiresColdChain,
        string defaultShelfZone,
        string? description = null,
        Guid? id = null,
        DateTime? createdAtUtc = null)
    {
        Id = id ?? Guid.NewGuid();
        Name = name;
        MinTemperature = minTemperature;
        MaxTemperature = maxTemperature;
        MaxHumidity = maxHumidity;
        RequiresColdChain = requiresColdChain;
        DefaultShelfZone = defaultShelfZone;
        Description = description;
        CreatedAtUtc = createdAtUtc ?? DateTime.UtcNow;
    }

    public void Update(
        string name,
        decimal minTemperature,
        decimal maxTemperature,
        int? maxHumidity,
        bool requiresColdChain,
        string defaultShelfZone,
        string? description)
    {
        Name = name;
        MinTemperature = minTemperature;
        MaxTemperature = maxTemperature;
        MaxHumidity = maxHumidity;
        RequiresColdChain = requiresColdChain;
        DefaultShelfZone = defaultShelfZone;
        Description = description;
    }
}
