using Application.Experience;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Experience;
public static class ExperienceDependencyInjection
{
    public static IServiceCollection AddExperience(this IServiceCollection services, IConfiguration config)
    {
        var connection = config.GetConnectionString("DefaultConnection") ?? config.GetConnectionString("AdminDb") ?? throw new InvalidOperationException("Veritabanı bağlantısı yapılandırılmalı.");
        services.AddDbContext<ExperienceDbContext>(o => o.UseNpgsql(connection, n => n.MigrationsHistoryTable("__EFMigrationsHistory_Experience", "experience")));
        services.AddScoped<IExperienceService, ExperienceService>();
        return services;
    }
}
