using System.Security.Claims;
using Application.Services.Admin;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace Endpoints.Admin;

internal sealed class PermissionEndpointFilter : IEndpointFilter
{
    private readonly string _permissionKey;

    public PermissionEndpointFilter(string permissionKey)
    {
        _permissionKey = permissionKey;
    }

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var roleName = ResolveCallerRole(context.HttpContext);

        // Müşteri JWT'si ile yönetim API'sine erişim kesinlikle engellenir
        if (string.Equals(roleName, "Customer", StringComparison.OrdinalIgnoreCase))
        {
            return Results.Json(
                new ProblemDetails
                {
                    Status = StatusCodes.Status403Forbidden,
                    Title = "Yetkisiz Erişim",
                    Detail = "Müşteri oturumu yönetim paneli kaynaklarına erişemez."
                },
                statusCode: StatusCodes.Status403Forbidden);
        }

        // SuperAdmin (veya Root) her zaman tüm izinleri bypass eder
        if (IsSuperAdminRole(roleName))
        {
            return await next(context);
        }

        var rbacService = context.HttpContext.RequestServices.GetRequiredService<IAdminRbacService>();
        var allowed = await rbacService.HasPermissionAsync(roleName, _permissionKey, context.HttpContext.RequestAborted);

        if (!allowed)
        {
            return Results.Json(
                new ProblemDetails
                {
                    Status = StatusCodes.Status403Forbidden,
                    Title = "Yetkisiz Erişim",
                    Detail = $"'{roleName}' rolü bu modül/işlem ('{_permissionKey}') için yetkili değildir."
                },
                statusCode: StatusCodes.Status403Forbidden);
        }

        return await next(context);
    }

    internal static string ResolveCallerRole(HttpContext httpContext)
    {
        var headerRole = httpContext.Request.Headers["X-Admin-Role"].FirstOrDefault();

        if (httpContext.User?.Identity?.IsAuthenticated == true)
        {
            var claimRole = httpContext.User.FindFirst(ClaimTypes.Role)?.Value
                ?? httpContext.User.FindFirst("role")?.Value;

            if (!string.IsNullOrWhiteSpace(claimRole))
            {
                // Gerçek JWT rolü SuperAdmin ise geliştirme/önizleme için X-Admin-Role override edebilir;
                // aksi halde imzalı JWT rolü esastır (header ile yetki yükseltme engellenir).
                if (IsSuperAdminRole(claimRole) && !string.IsNullOrWhiteSpace(headerRole))
                    return headerRole.Trim();

                return claimRole.Trim();
            }
        }

        if (!string.IsNullOrWhiteSpace(headerRole))
            return headerRole.Trim();

        // Geliştirme modunda geriye dönük uyumluluk
        return "SuperAdmin";
    }

    internal static bool IsSuperAdminRole(string? roleName)
    {
        if (string.IsNullOrWhiteSpace(roleName))
            return false;

        var normalized = roleName.Trim();
        return string.Equals(normalized, "SuperAdmin", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "Root", StringComparison.OrdinalIgnoreCase);
    }
}

internal static class PermissionEndpointExtensions
{
    public static RouteHandlerBuilder RequirePermission(this RouteHandlerBuilder builder, string permissionKey)
        => builder.AddEndpointFilter(new PermissionEndpointFilter(permissionKey));

    public static RouteGroupBuilder RequirePermission(this RouteGroupBuilder group, string permissionKey)
        => group.AddEndpointFilter(new PermissionEndpointFilter(permissionKey));
}
