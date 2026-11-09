using Application.Content.Services;
using Domain.Entities.Content;
using Infrastructure.Persistence;
using Infrastructure.Services.Content;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Content;

public static class DependencyInjection
{
    public static IServiceCollection AddContentInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? configuration.GetConnectionString("AdminDb")
            ?? throw new InvalidOperationException("Veritabanı bağlantısı yapılandırılmalı.");

        services.AddDbContext<ContentDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory_Content", ContentDbContext.DefaultSchema);
            });
        });

        services.AddScoped<IContentService, ContentService>();

        return services;
    }

    public static async Task InitializeContentDatabaseAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ContentDbContext>>();
        var db = scope.ServiceProvider.GetRequiredService<ContentDbContext>();

        try
        {
            await db.Database.ExecuteSqlRawAsync($"CREATE SCHEMA IF NOT EXISTS {ContentDbContext.DefaultSchema};");

            var creator = db.GetService<IRelationalDatabaseCreator>();
            try
            {
                await creator.CreateTablesAsync();
            }
            catch
            {
                // Tablolar zaten mevcutsa devam et
            }

            if (!await db.Banners.AnyAsync())
            {
                logger.LogInformation("İçerik (Content) modülü tohum verileri yükleniyor...");

                // 1. Hero Bannerlar
                var b1 = new Banner(
                    title: "Köyden Sofranıza En Saf Lezzetler",
                    subtitle: "Kaz Dağları'nın erken hasat soğuk sıkım zeytinyağları ve yayla balları şimdi taptaze stokta.",
                    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80",
                    targetUrl: "/kategori/zeytin-ve-zeytinyaglari",
                    buttonText: "Doğallığı Keşfet",
                    displayOrder: 1);

                var b2 = new Banner(
                    title: "Geleneksel Güneşte Kurutulmuş Köy Salçaları",
                    subtitle: "Odun ateşinde pişirilip güneşte olgunlaşan katkısız domates ve biber salçalarımızla yemeklerinize lezzet katın.",
                    imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=80",
                    targetUrl: "/kategori/salca-ve-soslar",
                    buttonText: "Salçaları İncele",
                    displayOrder: 2);

                db.Banners.AddRange(b1, b2);

                // 2. Güven ve Özellik Rozetleri
                var f1 = new SiteFeature("%100 Katkısız ve Doğal", "Hiçbir koruyucu, yapay tatlandırıcı veya renklendirici içermez.", "shield-check", 1);
                var f2 = new SiteFeature("Kırılmaz & Soğuk Zincir Paketleme", "Özel straforlu ve darbe emici kutularla güvenli teslimat.", "package", 2);
                var f3 = new SiteFeature("Hızlı Teslimat", "Saat 14:00'e kadar verilen siparişler aynı gün kargoda.", "truck", 3);
                var f4 = new SiteFeature("Yöresinden Doğrudan Temin", "Aracısız, doğrudan yerel üretici kadınlar ve çiftçilerden sofranıza.", "map-pin", 4);

                db.SiteFeatures.AddRange(f1, f2, f3, f4);

                // 3. Marka Hikayesi
                var story = new BrandStory(
                    title: "Toprağın Bereketi, Anne Eli Değmiş Doğallık",
                    summary: "Unutulmaya yüz tutmuş geleneksel lezzetleri, Anadolu'nun köylerinden kapınıza getiriyoruz.",
                    fullContent: "Hikayemiz, çocukluğumuzda ninelerimizin kilerinden yayılan o mis gibi köy kokusunu yeniden yaşatma arzusuyla başladı. Market raflarındaki endüstriyel, katkılı gıdalardan uzaklaşarak; toprağına sahip çıkan küçük üreticilerle el ele verdik. Zeytinyağımızın zeytini dalından tek tek toplanır, balımız yaylalardaki kovanlardan sağılır, salçamız odun ateşinde pişer. Biz sofranıza sadece yiyecek değil; emeği, sağlığı ve güveni taşıyoruz.",
                    imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80",
                    badgeText: "Gelenekten Geleceğe");

                db.BrandStories.Add(story);

                // 4. Sıkça Sorulan Sorular (SSS)
                var q1 = new Faq("Ürünlerinizde kimyasal koruyucu var mı?", "Kesinlikle hayır. Tüm ürünlerimiz geleneksel yöntemlerle, sadece kaya tuzu, zeytinyağı veya limon gibi doğal koruyucularla hazırlanır.", "Ürün Güvenliği", 1);
                var q2 = new Faq("Cam kavanozlar kargoda kırılır mı?", "Cam kavanozlarımız özel hava yastıklı balonlu ambalajlar ve sert kraft koruma kutuları ile paketlenir. Kırılma oranı binde birin altındadır; olası bir hasarda ücretsiz yenisi anında gönderilir.", "Kargo & Teslimat", 2);
                var q3 = new Faq("Balınız neden kristalleşiyor (donuyor)?", "Hakiki ham bal pastörize edilmediği için zamanla doğal olarak kristalleşebilir. Bu durum balın saf ve katkısız olduğunun en somut kanıtıdır. 45°C'yi geçmeyen benmari usulü ılık suda bekleterek eski haline getirebilirsiniz.", "Ürün Bilgisi", 3);

                db.Faqs.AddRange(q1, q2, q3);

                await db.SaveChangesAsync();
                logger.LogInformation("İçerik (Content) modülü tohum verileri başarıyla oluşturuldu.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "İçerik veritabanı başlatılırken hata oluştu.");
            throw;
        }
    }
}
