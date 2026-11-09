using Application.Orders;
using Application.Payments;
using Infrastructure.Payments;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Orders;
public static class OrdersDependencyInjection
{
    public static IServiceCollection AddOrdersInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connection = configuration.GetConnectionString("DefaultConnection") ?? configuration.GetConnectionString("AdminDb") ?? throw new InvalidOperationException("Veritabanı bağlantısı yapılandırılmalı.");
        services.AddDbContext<OrdersDbContext>(o => o.UseNpgsql(connection, n => n.MigrationsHistoryTable("__EFMigrationsHistory_Orders", "orders")));
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<ISimulatedPaymentService, SimulatedPaymentService>();
        services.AddScoped<IShipmentService, ShipmentService>();
        services.AddHostedService<ReservationExpiryWorker>();
        return services;
    }
}
