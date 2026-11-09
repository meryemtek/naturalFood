using Infrastructure.Catalog;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Endpoints.Catalog;

public static class CatalogModuleExtensions
{
    public static IServiceCollection AddCatalogModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCatalogInfrastructure(configuration);
        return services;
    }

    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        CatalogEndpointsHandler.MapEndpoints(app);
        return app;
    }

    public static async Task InitializeCatalogModuleDatabaseAsync(this IServiceProvider serviceProvider)
    {
        await DependencyInjection.InitializeCatalogDatabaseAsync(serviceProvider);
    }
}
