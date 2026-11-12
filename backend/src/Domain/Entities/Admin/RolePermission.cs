namespace Domain.Entities.Admin;

public class RolePermission
{
    public Guid RoleId { get; private set; }
    public string PermissionKey { get; private set; } = default!;

    public Role Role { get; private set; } = default!;
    public ModulePermission ModulePermission { get; private set; } = default!;

    // EF Core için constructor
    private RolePermission() { }

    public RolePermission(Guid roleId, string permissionKey)
    {
        RoleId = roleId;
        PermissionKey = permissionKey.Trim();
    }
}
