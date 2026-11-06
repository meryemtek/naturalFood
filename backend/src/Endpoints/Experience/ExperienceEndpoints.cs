using System.Security.Claims;
using Application.Experience;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Endpoints.Experience;
public static class ExperienceEndpoints
{
    public static IEndpointRouteBuilder MapExperienceEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/products/{productId:guid}/reviews", async (Guid productId, int? page, IExperienceService service, CancellationToken ct) => Results.Ok(await service.ReviewsAsync(productId, page ?? 1, ct))).WithTags("Ürün Yorumları");
        app.MapPost("/api/products/{productId:guid}/reviews", async (Guid productId, CreateReviewRequest request, HttpContext context, IExperienceService service, CancellationToken ct) =>
        {
            if (!context.User.IsInRole("Customer") || !Guid.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var customerId)) return Results.Unauthorized();
            try { await service.AddReviewAsync(productId, customerId, request, ct); return Results.Accepted(); }
            catch (ArgumentException ex) { return Results.Problem(statusCode: 400, title: ex.Message); }
            catch (UnauthorizedAccessException) { return Results.Unauthorized(); }
            catch (KeyNotFoundException) { return Results.NotFound(); }
            catch (InvalidOperationException ex) { return Results.Problem(statusCode: 409, title: ex.Message); }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" }) { return Results.Problem(statusCode: 409, title: "Bu ürün için yorumunuz zaten mevcut."); }
        }).RequireAuthorization().RequireRateLimiting("auth").WithTags("Ürün Yorumları");
        app.MapPost("/api/contact", async (ContactRequest request, IExperienceService service, CancellationToken ct) =>
        {
            try { await service.ContactAsync(request, ct); return Results.Accepted(); }
            catch (ArgumentException ex) { return Results.Problem(statusCode: 400, title: ex.Message); }
        }).RequireRateLimiting("auth").WithTags("İletişim");
        app.MapPost("/api/newsletter/subscriptions", async (NewsletterRequest request, IExperienceService service, CancellationToken ct) =>
        {
            try { await service.SubscribeAsync(request, ct); return Results.Accepted(); }
            catch (ArgumentException ex) { return Results.Problem(statusCode: 400, title: ex.Message); }
        }).RequireRateLimiting("auth").WithTags("Bülten");
        app.MapGet("/api/policies/{slug}", async (string slug, IExperienceService service, CancellationToken ct) =>
        {
            var policy = await service.PolicyAsync(slug, ct);
            return policy == null ? Results.NotFound() : Results.Ok(policy);
        }).WithTags("Politikalar");
        return app;
    }
}
