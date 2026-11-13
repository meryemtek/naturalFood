using Application.Catalog.Services;
using Domain.Entities.Catalog;
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
            if (!await db.Categories.AnyAsync())
            {
                logger.LogInformation("Katalog modülü tohum verileri yükleniyor...");

                // 1. Ana Kategoriler
                var catKoyUrunleri = new Category("Köy Ürünleri", "koy-urunleri", "Geleneksel köy yöntemleriyle üretilen saf lezzetler", "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80", null, 1);
                var catKahvaltilik = new Category("Köy Kahvaltılıkları", "kahvaltiliklar", "Günün en önemli öğünü için katkısız köy kahvaltılıkları", "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80", null, 2);
                var catZeytinyagi = new Category("Zeytinyağları", "zeytinyaglari", "Erken hasat, soğuk sıkım saf Ege ve Hatay zeytinyağları", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80", null, 3);
                var catBalRecel = new Category("Bal & Reçel", "bal-ve-receller", "Yaylalardan gelen ham bal ve odun ateşinde pişmiş reçeller", "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80", null, 4);
                var catSalcaSos = new Category("Salça & Soslar", "salca-ve-soslar", "Güneşte kurutulmuş köy salçaları ve acı/tatlı kahvaltılık soslar", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80", null, 5);
                var catBakliyat = new Category("Kuru Gıdalar & Bakliyat", "kuru-gidalar", "Anadolu'nun ata tohumu bakliyatları ve taş değirmen unları", "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80", null, 6);

                var catKuruyemis = new Category("Kuruyemiş & Kuru Meyve", "kuruyemisler", "Yeni mahsul ceviz, fındık ve güneşte kurutulmuş meyveler", null, null, 7);
                db.Categories.AddRange(catKoyUrunleri, catKahvaltilik, catZeytinyagi, catBalRecel, catSalcaSos, catBakliyat, catKuruyemis);
                await db.SaveChangesAsync();

                // 2. Alt Kategoriler
                var subSizmaYag = new Category("Sızma Zeytinyağı", "sizma-zeytinyagi", "Asit oranı düşük soğuk sıkım yağlar", null, catZeytinyagi.Id, 1);
                var subKirmaZeytin = new Category("Kırma ve Çizik Zeytin", "kirma-ve-cizik-zeytin", "Doğal salamura zeytinler", null, catZeytinyagi.Id, 2);
                var subHamBal = new Category("Ham Çiçek & Çam Balı", "ham-cicek-ve-cam-bali", "Isıl işlem görmemiş doğal arı balları", null, catBalRecel.Id, 1);
                var subKoySalcasi = new Category("Ev Tipi Güneş Salçası", "ev-tipi-gunes-salcasi", "Köy kadınlarının el emeği güneşte kurutulmuş salça", null, catSalcaSos.Id, 1);

                db.Categories.AddRange(subSizmaYag, subKirmaZeytin, subHamBal, subKoySalcasi);
                await db.SaveChangesAsync();

                // 3. Örnek Ürünler
                // Ürün 1: Soğuk Sıkım Erken Hasat Zeytinyağı
                var p1 = new Product(
                    name: "Taş Baskı Soğuk Sıkım Erken Hasat Zeytinyağı",
                    slug: "tas-baski-soguk-sikim-erken-hasat-zeytinyagi",
                    shortDescription: "Ekim ayında erken toplanan zeytinlerden soğuk sıkımla elde edilen en yüksek polifenollü saf zeytinyağı.",
                    description: "Kaz Dağları ve Edremit Körfezi'nin tertemiz havasında yetişen zeytinlerimiz, dalından elle toplanarak bekletilmeden 24°C altında soğuk sıkım yöntemiyle sıkılır. 0.3 asit oranına sahiptir. Kahvaltılarda çiğ tüketim, salatalar ve gurme yemekler için mükemmeldir.",
                    categoryId: subSizmaYag.Id,
                    basePrice: 480.00m,
                    discountPrice: 420.00m,
                    stockQuantity: 150,
                    sku: "ZYT-ERK-001",
                    unitInfo: "1 Litre Cam Şişe",
                    ingredients: "%100 Saf Naturel Sızma Zeytinyağı",
                    allergens: new List<string>(),
                    origin: "Balıkesir / Edremit",
                    storageConditions: "Doğrudan güneş ışığı almayan serin ve kuru bir yerde kapağı kapalı olarak saklayınız.",
                    shelfLife: "Üretim tarihinden itibaren 2 yıl.",
                    isBestSeller: true,
                    isNew: false,
                    isFeatured: true,
                    isSeasonal: false,
                    certifications: new List<string> { "Organik Sertifikalı", "Vegan", "Katkısız" },
                    nutritionalValues: new NutritionalValues(884, 100, 14, 0, 0, 0, 0));

                p1.Images.Add(new ProductImage(p1.Id, "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80", "Zeytinyağı Şişesi", 0, true));
                p1.Images.Add(new ProductImage(p1.Id, "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80", "Zeytin Hasadı", 1, false));

                p1.Variants.Add(new ProductVariant(p1.Id, "500 ml Cam Şişe", "ZYT-ERK-500", 260.00m, 230.00m, 80, "500 ml", 0));
                p1.Variants.Add(new ProductVariant(p1.Id, "1 Litre Koyu Cam Şişe", "ZYT-ERK-1000", 480.00m, 420.00m, 150, "1 Lt", 1));
                p1.Variants.Add(new ProductVariant(p1.Id, "5 Litre Teneke Avantaj Paketi", "ZYT-ERK-5000", 2150.00m, 1890.00m, 45, "5 Lt", 2));

                // Ürün 2: Karakovan Ham Çiçek Balı
                var p2 = new Product(
                    name: "Doğu Anadolu Yayla Karakovan Çiçek Balı",
                    slug: "dogu-anadolu-yayla-karakovan-cicek-bali",
                    shortDescription: "2400 rakımlı yaylalarda üretilen, şeker ve glikoz içermeyen %100 saf ham çiçek balı.",
                    description: "Doğu Anadolu'nun el değmemiş yüksek yaylalarında endemik binlerce çiçek florasından arıların kendi ördükleri peteklerde ürettiği eşsiz bir şifa kaynağıdır. Isıl işlem görmez, filtre edilmez, enzim değerleri korunur.",
                    categoryId: subHamBal.Id,
                    basePrice: 550.00m,
                    discountPrice: 490.00m,
                    stockQuantity: 90,
                    sku: "BAL-KRK-001",
                    unitInfo: "850 gr Kavanoz",
                    ingredients: "%100 Doğal Ham Karakovan Çiçek Balı",
                    allergens: new List<string> { "1 yaşından küçük bebeklere bal verilmemelidir." },
                    origin: "Kars / Kağızman Yaylaları",
                    storageConditions: "Oda sıcaklığında (20-25°C) muhafaza ediniz. Hakiki ham bal kristalleşebilir (donabilir); 45°C'yi geçmeyen ılık suda bekleterek çözebilirsiniz.",
                    shelfLife: "Doğal bal süresiz saklanabilir.",
                    isBestSeller: true,
                    isNew: true,
                    isFeatured: true,
                    isSeasonal: false,
                    certifications: new List<string> { "Doğal Ham Bal", "Katkısız" },
                    nutritionalValues: new NutritionalValues(304, 0, 0, 82.4m, 82.1m, 0.3m, 0.01m));

                p2.Images.Add(new ProductImage(p2.Id, "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80", "Doğal Bal Kavanozu", 0, true));

                p2.Variants.Add(new ProductVariant(p2.Id, "450 gr Kavanoz", "BAL-KRK-450", 310.00m, null, 50, "450 gr", 0));
                p2.Variants.Add(new ProductVariant(p2.Id, "850 gr Kavanoz", "BAL-KRK-850", 550.00m, 490.00m, 90, "850 gr", 1));

                // Ürün 3: Hatay Kırma Halhalı Yeşil Zeytin
                var p3 = new Product(
                    name: "Antakya Halhalı Taş Kırma Yeşil Zeytin",
                    slug: "antakya-halhali-tas-kirma-yesil-zeytin",
                    shortDescription: "Geleneksel taşla kırılmış, kaya tuzu ve limonla tatlandırılmış çıtır köy zeytini.",
                    description: "Hatay yöresine has Halhalı cinsi küçük çekirdekli, bol etli zeytinler taşlarla tek tek kırılarak sadece kaynak suyu ve kaya tuzu ile tatlandırılmıştır. Hiçbir kimyasal koruyucu içermez.",
                    categoryId: subKirmaZeytin.Id,
                    basePrice: 220.00m,
                    discountPrice: 195.00m,
                    stockQuantity: 200,
                    sku: "ZYT-HLH-001",
                    unitInfo: "1 kg Kavanoz (Süzme 650g)",
                    ingredients: "Halhalı Yeşil Zeytin, Su, Kaya Tuzu, Doğal Limon Suyu, Saf Zeytinyağı",
                    allergens: new List<string>(),
                    origin: "Hatay / Altınözü",
                    storageConditions: "Kendi salamura suyunda serin yerde saklayınız. Açıldıktan sonra üzerine biraz zeytinyağı gezdirmeniz tavsiye edilir.",
                    shelfLife: "12 Ay",
                    isBestSeller: false,
                    isNew: true,
                    isFeatured: true,
                    isSeasonal: true,
                    certifications: new List<string> { "Vegan", "Geleneksel" },
                    nutritionalValues: new NutritionalValues(145, 15.3m, 2.1m, 3.8m, 0.5m, 1.0m, 3.2m));

                p3.Images.Add(new ProductImage(p3.Id, "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80", "Kırma Yeşil Zeytin", 0, true));

                // Ürün 4: Güneşte Kurutulmuş Ev Tipi Köy Domates Salçası
                var p4 = new Product(
                    name: "Güneşte Kurutulmuş Odun Ateşinde Köy Domates Salçası",
                    slug: "guneste-kurutulmus-odun-atesinde-koy-domates-salcasi",
                    shortDescription: "Ağustos domateslerinden, tepsilerde güneşte suyunu çeken geleneksel köy salçası.",
                    description: "Tarla domatesleri odun ateşinde kaynatıldıktan sonra tülbent serili tepsilerde güneşin altında olgunlaştırılmıştır. Yoğun kıvamlıdır, bir kaşığı tüm yemeğinize koyu renk ve eşsiz koku verir.",
                    categoryId: subKoySalcasi.Id,
                    basePrice: 280.00m,
                    discountPrice: 250.00m,
                    stockQuantity: 120,
                    sku: "SLC-DMT-001",
                    unitInfo: "1 kg Cam Kavanoz",
                    ingredients: "%100 Köy Domatesi, Çankırı Kaya Tuzu (%2.5)",
                    allergens: new List<string>(),
                    origin: "Çanakkale / Biga",
                    storageConditions: "Serin ve karanlık yerde muhafaza ediniz. Açtıktan sonra üzerini kapatacak kadar zeytinyağı ilave edip buzdolabında saklayınız.",
                    shelfLife: "2 Yıl",
                    isBestSeller: true,
                    isNew: false,
                    isFeatured: true,
                    isSeasonal: false,
                    certifications: new List<string> { "Vegan", "Güneşte Kurutulmuş", "Katkısız" },
                    nutritionalValues: new NutritionalValues(82, 0.5m, 0.1m, 14.2m, 9.8m, 4.3m, 2.5m));

                p4.Images.Add(new ProductImage(p4.Id, "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80", "Doğal Köy Salçası", 0, true));

                db.Products.AddRange(p1, p2, p3, p4);
                await db.SaveChangesAsync();

                logger.LogInformation("Katalog modülü tohum verileri başarıyla oluşturuldu.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Katalog veritabanı başlatılırken hata oluştu.");
            throw;
        }
    }
}
