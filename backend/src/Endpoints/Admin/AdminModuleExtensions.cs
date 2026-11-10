
using Infrastructure.Admin;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Endpoints.Admin;

public static class AdminModuleExtensions
{
    /// <summary>
    /// Admin modülünün bağımlılıklarını (Persistence, Services) DI konteynerine kaydeder.
    /// Modül veritabanında "admin" şemasını kullanacak şekilde yapılandırılır.
    /// </summary>
    public static IServiceCollection AddAdminModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddAdminInfrastructure(configuration);
        return services;
    }

    /// <summary>
    /// Admin modülüne ait tüm minimal API endpoint'lerini "/api/admin" yol öneki altında haritalar.
    /// </summary>
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin");
        AdminEndpointsHandler.MapEndpoints(group);
        return app;
    }

    /// <summary>
    /// Admin şemasının ve ilk tablolarının/tohum verilerinin hazırlandığından emin olur.
    /// </summary>
    public static async Task InitializeAdminModuleDatabaseAsync(this IServiceProvider serviceProvider)
    {
        await DependencyInjection.InitializeAdminDatabaseAsync(serviceProvider);
    }
}

