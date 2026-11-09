using Application.Catalog.DTOs;
using Application.Catalog.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Endpoints.Catalog;

public static class CatalogEndpointsHandler
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        // -------------------------------------------------------------
        // 1. Müşteri (Public) Katalog Endpoint'leri (/api/catalog)
        // -------------------------------------------------------------
        var publicGroup = app.MapGroup("/api/catalog")
            .WithTags("Müşteri Kataloğu");

        // Kategoriler
        publicGroup.MapGet("/categories/tree", async (ICatalogService catalogService, CancellationToken ct) =>
        {
            var tree = await catalogService.GetCategoryTreeAsync(ct);
            return Results.Ok(tree);
        })
        .WithName("GetCategoryTree")
        .WithSummary("Hiyerarşik kategori ağacını döner.");

        publicGroup.MapGet("/categories", async (ICatalogService catalogService, CancellationToken ct) =>
        {
            var categories = await catalogService.GetAllCategoriesAsync(false, ct);
            return Results.Ok(categories);
        })
        .WithName("GetPublicCategories")
        .WithSummary("Tüm aktif kategorileri listeler.");

        publicGroup.MapGet("/categories/{slug}", async (string slug, ICatalogService catalogService, CancellationToken ct) =>
        {
            var category = await catalogService.GetCategoryBySlugAsync(slug, ct);
            return category != null ? Results.Ok(category) : Results.NotFound(new { message = "Kategori bulunamadı." });
        })
        .WithName("GetCategoryBySlug")
        .WithSummary("Slug ile kategori detayını getirir.");

        // Ürünler
        publicGroup.MapGet("/products", async (
            [AsParameters] ProductListFilter filter,
            ICatalogService catalogService,
            CancellationToken ct) =>
        {
            var result = await catalogService.GetProductsAsync(filter, ct);
            return Results.Ok(result);
        })
        .WithName("GetPublicProducts")
        .WithSummary("Filtrelenebilir ve sayfalanabilir ürün listesini döner.");

        publicGroup.MapGet("/products/{slug}", async (string slug, ICatalogService catalogService, CancellationToken ct) =>
        {
            var product = await catalogService.GetProductBySlugAsync(slug, ct);
            return product != null ? Results.Ok(product) : Results.NotFound(new { message = "Ürün bulunamadı." });
        })
        .WithName("GetProductBySlug")
        .WithSummary("Slug ile ürünün detayını, görsellerini ve gramaj varyantlarını döner.");

        publicGroup.MapGet("/products/id/{id:guid}", async (Guid id, ICatalogService catalogService, CancellationToken ct) =>
        {
            var product = await catalogService.GetProductByIdAsync(id, ct);
            return product != null ? Results.Ok(product) : Results.NotFound(new { message = "Ürün bulunamadı." });
        })
        .WithName("GetProductById")
        .WithSummary("ID ile ürün detayını döner.");

        publicGroup.MapGet("/products/{id:guid}/related", async (Guid id, int? count, ICatalogService catalogService, CancellationToken ct) =>
        {
            var related = await catalogService.GetRelatedProductsAsync(id, count ?? 4, ct);
            return Results.Ok(related);
        })
        .WithName("GetRelatedProducts")
        .WithSummary("İlgili veya benzer ürünleri döner.");

    }
}
