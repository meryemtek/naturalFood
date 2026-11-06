using System.Security.Cryptography;
using System.Text;
using Application.Common;
using Application.Customer.Services;
using Application.Customer.Validators;
using Domain.Entities.Customer;
using FluentValidation;
using Infrastructure.Persistence;
using Infrastructure.Services.Customer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Customer;

public static class DependencyInjection
{
    public static IServiceCollection AddCustomerInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? configuration.GetConnectionString("AdminDb")
            ?? throw new InvalidOperationException("Veritabanı bağlantısı yapılandırılmalı.");

        // JWT Ayarları
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        // DbContext
        services.AddDbContext<CustomerDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory_Customer", CustomerDbContext.DefaultSchema);
            });
        });

        // Servisler
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICustomerService, CustomerService>();

        // Doğrulayıcılar (FluentValidation)
        services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

        return services;
    }

    public static async Task InitializeCustomerDatabaseAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<CustomerDbContext>>();
        var db = scope.ServiceProvider.GetRequiredService<CustomerDbContext>();

        try
        {
            await db.Database.ExecuteSqlRawAsync($"CREATE SCHEMA IF NOT EXISTS {CustomerDbContext.DefaultSchema};");

            var creator = db.GetService<IRelationalDatabaseCreator>();
            try
            {
                await creator.CreateTablesAsync();
            }
            catch
            {
                // Tablolar zaten mevcutsa devam et
            }

            // Tohum verileri: Örnek müşteri ve adres
            if (!await db.Customers.AnyAsync())
            {
                logger.LogInformation("Müşteri modülü tohum verileri oluşturuluyor...");

                // Demo Müşteri: musteri@koykokusu.com.tr / Sifre123*
                var salt = RandomNumberGenerator.GetBytes(16);
                var hash = Rfc2898DeriveBytes.Pbkdf2(
                    Encoding.UTF8.GetBytes("Sifre123*"),
                    salt,
                    iterations: 100_000,
                    HashAlgorithmName.SHA256,
                    outputLength: 32);
                var passwordHash = $"100000.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";

                var demoCustomer = Domain.Entities.Customer.Customer.CreateRegistered(
                    email: "musteri@koykokusu.com.tr",
                    passwordHash: passwordHash,
                    firstName: "Ayşe",
                    lastName: "Yılmaz",
                    phone: "05321112233");

                db.Customers.Add(demoCustomer);
                await db.SaveChangesAsync();

                // Demo Adres
                var demoAddress = new CustomerAddress(
                    customerId: demoCustomer.Id,
                    title: "Ev Adresim",
                    recipientName: "Ayşe Yılmaz",
                    phone: "05321112233",
                    city: "İstanbul",
                    district: "Kadıköy",
                    neighborhood: "Moda",
                    fullAddress: "Moda Caddesi, No: 42 Daire: 5",
                    postalCode: "34710",
                    isDefault: true,
                    isBillingAddress: false);

                db.CustomerAddresses.Add(demoAddress);
                await db.SaveChangesAsync();

                logger.LogInformation("Müşteri modülü tohum verileri başarıyla oluşturuldu.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Müşteri veritabanı başlatılırken hata oluştu.");
            throw;
        }
    }
}
