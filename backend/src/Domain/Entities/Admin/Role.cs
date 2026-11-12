namespace Domain.Entities.Admin;

public class Role
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = default!;
    public string Description { get; private set; } = default!;

    public ICollection<RolePermission> RolePermissions { get; private set; } = new List<RolePermission>();

    // EF Core için constructor
    private Role() { }

    public Role(string name, string description, Guid? id = null)
    {
        Id = id ?? Guid.NewGuid();
        Name = name.Trim();
        Description = description.Trim();
    }

    public void UpdateDescription(string description)
    {
        Description = description.Trim();
    }
}
