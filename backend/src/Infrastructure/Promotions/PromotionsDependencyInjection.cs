using Application.Promotions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Promotions;
public static class PromotionsDependencyInjection
{
    public static async Task InitializePromotionsDatabaseAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<PromotionsDbContext>().Database.MigrateAsync();
    }

    public static IServiceCollection AddPromotions(this IServiceCollection services, IConfiguration configuration)
    {
        var connection = configuration.GetConnectionString("DefaultConnection") ?? configuration.GetConnectionString("AdminDb")
            ?? throw new InvalidOperationException("Veritabanı bağlantısı yapılandırılmalı.");
        services.AddDbContext<PromotionsDbContext>(o => o.UseNpgsql(connection, n => n.MigrationsHistoryTable("__EFMigrationsHistory_Promotions", "promotions")));
        services.AddScoped<ICouponCalculator, CouponCalculator>();
        services.AddScoped<ICouponCreationService, CouponCreationService>();
        return services;
    }
}
