using Application.Content.DTOs;
using Application.Content.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Endpoints.Content;

public static class ContentEndpointsHandler
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        // -------------------------------------------------------------
        // 1. Müşteri (Public) İçerik & Ana Sayfa Endpoint'leri (/api/content)
        // -------------------------------------------------------------
        var publicGroup = app.MapGroup("/api/content")
            .WithTags("Müşteri - Ana Sayfa & İçerik");

        publicGroup.MapGet("/home", async (IContentService contentService, CancellationToken ct) =>
        {
            var homeData = await contentService.GetHomePageDataAsync(ct);
            return Results.Ok(homeData);
        })
        .WithName("GetHomePageData")
        .WithSummary("Ana sayfa vitrinini (slider, çok satanlar, yeni ürünler, indirimdekiler, mevsimlikler, rozetler ve hikaye) tek seferde döner.");

        publicGroup.MapGet("/banners", async (IContentService contentService, CancellationToken ct) =>
        {
            var banners = await contentService.GetActiveBannersAsync(ct);
            return Results.Ok(banners);
        })
        .WithName("GetActiveBanners")
        .WithSummary("Aktif slider hero banner'larını listeler.");

        publicGroup.MapGet("/features", async (IContentService contentService, CancellationToken ct) =>
        {
            var features = await contentService.GetFeaturesAsync(false, ct);
            return Results.Ok(features);
        })
        .WithName("GetSiteFeatures")
        .WithSummary("Güvenli alışveriş, soğuk zincir teslimat vb. rozetleri döner.");

        publicGroup.MapGet("/story", async (IContentService contentService, CancellationToken ct) =>
        {
            var story = await contentService.GetBrandStoryAsync(ct);
            return story != null ? Results.Ok(story) : Results.NotFound(new { message = "Marka hikayesi bulunamadı." });
        })
        .WithName("GetBrandStory")
        .WithSummary("Markanın hikayesini ve felsefesini döner.");

        publicGroup.MapGet("/faqs", async (IContentService contentService, CancellationToken ct) =>
        {
            var faqs = await contentService.GetFaqsAsync(false, ct);
            return Results.Ok(faqs);
        })
        .WithName("GetFaqs")
        .WithSummary("Sıkça sorulan soruları (SSS) listeler.");

    }
}
