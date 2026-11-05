using Application.Common.Interfaces;
using Application.Common.Security;
using Application.Services.Admin;
using Application.Validators.Admin;
using FluentValidation;
using Infrastructure.Persistence;
using Infrastructure.Services.Admin;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Admin;

public static class DependencyInjection
{
    public static IServiceCollection AddAdminInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("AdminDb") 
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=ecommerce_admin;Username=postgres;Password=postgres;SearchPath=admin,public";

        services.AddDbContext<AdminDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory_Admin", AdminDbContext.DefaultSchema);
                npgsqlOptions.MigrationsAssembly(typeof(AdminDbContext).Assembly.FullName);
            });
        });

        services.AddScoped<IAdminDbContext>(sp => sp.GetRequiredService<AdminDbContext>());

        // Güvenlik & Hash
        services.AddSingleton<IPasswordHasher, PasswordHasher>();

        // Admin Servisleri
        services.AddScoped<IAdminService, AdminService>();

        // Validatörler
        services.AddValidatorsFromAssemblyContaining<CreateAdminUserRequestValidator>();

        return services;
    }

    public static async Task InitializeAdminDatabaseAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AdminDbContext>();

        await context.Database.MigrateAsync();
    }
}

