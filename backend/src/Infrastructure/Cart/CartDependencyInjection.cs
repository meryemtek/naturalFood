using Application.Cart;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Cart;

public static class CartDependencyInjection
{
    public static IServiceCollection AddCartInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connection = configuration.GetConnectionString("DefaultConnection") ?? configuration.GetConnectionString("AdminDb")
            ?? throw new InvalidOperationException("Veritabanı bağlantısı yapılandırılmalı.");
        services.AddDbContext<CartDbContext>(o => o.UseNpgsql(connection, n => n.MigrationsHistoryTable("__EFMigrationsHistory_Cart", "cart")));
        services.AddScoped<ICartService, CartService>();
        return services;
    }
}
