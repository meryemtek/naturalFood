using Infrastructure.Customer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Endpoints.Customer;

public static class CustomerModuleExtensions
{
    public static IServiceCollection AddCustomerModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCustomerInfrastructure(configuration);
        return services;
    }

    public static IEndpointRouteBuilder MapCustomerEndpoints(this IEndpointRouteBuilder app)
    {
        CustomerEndpointsHandler.MapEndpoints(app);
        return app;
    }

    public static async Task InitializeCustomerModuleDatabaseAsync(this IServiceProvider serviceProvider)
    {
        await DependencyInjection.InitializeCustomerDatabaseAsync(serviceProvider);
    }
}
