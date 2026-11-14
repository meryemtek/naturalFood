using System.Text.Json;
using Application.Catalog.Services;
using Infrastructure.Persistence;
using Infrastructure.Services.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Catalog;

public static class DependencyInjection
{
    public static IServiceCollection AddCatalogInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? configuration.GetConnectionString("AdminDb")
            ?? throw new InvalidOperationException("Veritabanı bağlantısı yapılandırılmalı.");

        services.AddDbContext<CatalogDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory_Catalog", CatalogDbContext.DefaultSchema);
            });
        });

        services.AddScoped<ICatalogService, CatalogService>();

        return services;
    }

    public static async Task InitializeCatalogDatabaseAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<CatalogDbContext>>();
        var db = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();

        try
        {
            await db.Database.ExecuteSqlRawAsync($"CREATE SCHEMA IF NOT EXISTS {CatalogDbContext.DefaultSchema};");

            var creator = db.GetService<IRelationalDatabaseCreator>();
            try
            {
                await creator.CreateTablesAsync();
            }
            catch
            {
                // Tablolar zaten mevcutsa devam et
            }

            // Tohum verileri kontrolü
            // Tohum verileri kontrolü: tüm kategori, ürün, görsel ve varyantları gömülü JSON'dan yükle
            if (!await db.Categories.AnyAsync())
            {
                logger.LogInformation("Katalog modülü tohum verileri yükleniyor...");

                var assembly = typeof(DependencyInjection).Assembly;
                var resourceName = assembly.GetManifestResourceNames()
                    .FirstOrDefault(n => n.EndsWith("catalog-seed.json", StringComparison.OrdinalIgnoreCase));

                if (resourceName != null)
                {
                    await using var stream = assembly.GetManifestResourceStream(resourceName)!;
                    using var doc = await JsonDocument.ParseAsync(stream);
                    var root = doc.RootElement;

                    var categoriesJson = root.GetProperty("categories").GetRawText();
                    var productsJson = root.GetProperty("products").GetRawText();
                    var imagesJson = root.GetProperty("images").GetRawText();
                    var variantsJson = root.GetProperty("variants").GetRawText();

                    await using var tx = await db.Database.BeginTransactionAsync();
                    await db.Database.ExecuteSqlRawAsync(
                        """
                        INSERT INTO catalog."Categories"
                        SELECT * FROM json_populate_recordset(NULL::catalog."Categories", {0}::json)
                        WHERE "ParentCategoryId" IS NULL
                        ON CONFLICT ("Id") DO NOTHING;
                        """, categoriesJson);

                    await db.Database.ExecuteSqlRawAsync(
                        """
                        INSERT INTO catalog."Categories"
                        SELECT * FROM json_populate_recordset(NULL::catalog."Categories", {0}::json)
                        WHERE "ParentCategoryId" IS NOT NULL
                        ON CONFLICT ("Id") DO NOTHING;
                        """, categoriesJson);

                    await db.Database.ExecuteSqlRawAsync(
                        """
                        INSERT INTO catalog."Products"
                        SELECT * FROM json_populate_recordset(NULL::catalog."Products", {0}::json)
                        ON CONFLICT ("Id") DO NOTHING;
                        """, productsJson);

                    await db.Database.ExecuteSqlRawAsync(
                        """
                        INSERT INTO catalog."ProductImages"
                        SELECT * FROM json_populate_recordset(NULL::catalog."ProductImages", {0}::json)
                        ON CONFLICT ("Id") DO NOTHING;
                        """, imagesJson);

                    await db.Database.ExecuteSqlRawAsync(
                        """
                        INSERT INTO catalog."ProductVariants"
                        SELECT * FROM json_populate_recordset(NULL::catalog."ProductVariants", {0}::json)
                        ON CONFLICT ("Id") DO NOTHING;
                        """, variantsJson);

                    await tx.CommitAsync();
                    logger.LogInformation("Katalog modülü tohum verileri başarıyla oluşturuldu.");
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Katalog veritabanı başlatılırken hata oluştu.");
            throw;
        }
    }
}
