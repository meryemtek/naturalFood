namespace Domain.Entities.Admin;

public class ModulePermission
{
    public Guid Id { get; private set; }
    public string Key { get; private set; } = default!;
    public string Title { get; private set; } = default!;
    public string Category { get; private set; } = default!;

    public ICollection<RolePermission> RolePermissions { get; private set; } = new List<RolePermission>();

    // EF Core için constructor
    private ModulePermission() { }

    public ModulePermission(string key, string title, string category, Guid? id = null)
    {
        Id = id ?? Guid.NewGuid();
        Key = key.Trim();
        Title = title.Trim();
        Category = category.Trim();
    }
}
