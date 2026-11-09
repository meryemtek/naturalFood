using Infrastructure.Content;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Endpoints.Content;

public static class ContentModuleExtensions
{
    public static IServiceCollection AddContentModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddContentInfrastructure(configuration);
        return services;
    }

    public static IEndpointRouteBuilder MapContentEndpoints(this IEndpointRouteBuilder app)
    {
        ContentEndpointsHandler.MapEndpoints(app);
        return app;
    }

    public static async Task InitializeContentModuleDatabaseAsync(this IServiceProvider serviceProvider)
    {
        await DependencyInjection.InitializeContentDatabaseAsync(serviceProvider);
    }
}
