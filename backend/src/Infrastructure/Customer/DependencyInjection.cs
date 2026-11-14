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

        // JWT & E-posta Ayarları
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));

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
        services.AddScoped<IEmailSender, SmtpEmailSender>();

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

            // Mevcut veritabanında Role ve şifre sıfırlama sütunlarının bulunduğundan emin ol
            await db.Database.ExecuteSqlRawAsync(
                """
                ALTER TABLE customer."Customers" ADD COLUMN IF NOT EXISTS "Role" character varying(50) NOT NULL DEFAULT 'Customer';
                ALTER TABLE customer."Customers" ADD COLUMN IF NOT EXISTS "PasswordResetTokenHash" character varying(128);
                ALTER TABLE customer."Customers" ADD COLUMN IF NOT EXISTS "PasswordResetTokenExpiresAtUtc" timestamp with time zone;
                """);

            // Tohum verileri: Örnek müşteri ve adres
            if (!await db.Customers.AnyAsync(c => c.Email == "musteri@koykokusu.com.tr"))
            {
                logger.LogInformation("Müşteri modülü demo müşteri verisi oluşturuluyor...");

                var demoCustomer = Domain.Entities.Customer.Customer.CreateRegistered(
                    email: "musteri@koykokusu.com.tr",
                    passwordHash: AuthService.HashPassword("Sifre123*"),
                    firstName: "Ayşe",
                    lastName: "Yılmaz",
                    phone: "05321112233",
                    role: "Customer");

                db.Customers.Add(demoCustomer);
                await db.SaveChangesAsync();

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
            }

        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Müşteri veritabanı başlatılırken hata oluştu.");
            throw;
        }
    }
}
