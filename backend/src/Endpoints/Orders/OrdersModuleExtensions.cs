using System.Security.Claims;
using Npgsql;
using Application.Orders;
using Infrastructure.Orders;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Endpoints.Orders;
public static class OrdersModuleExtensions
{
    public static IServiceCollection AddOrdersModule(this IServiceCollection services, IConfiguration configuration) => services.AddOrdersInfrastructure(configuration);
    public static IEndpointRouteBuilder MapOrdersEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/orders").WithTags("Siparişler");
        group.MapPost("/", async (HttpContext ctx, CreateOrderRequest request, IOrderService service, CancellationToken ct) =>
        {
            try
            {
                var result = await service.CreateAsync(Customer(ctx), ctx.Request.Headers["X-Guest-Cart-Token"].FirstOrDefault(), ctx.Request.Headers["Idempotency-Key"].FirstOrDefault() ?? "", request, ct);
                return Results.Ok(result);
            }
            catch (UnauthorizedAccessException) { return Results.Unauthorized(); }
            catch (PostgresException ex) when (ex.SqlState is "40001" or "40P01" or "23505") { return Results.Problem(statusCode: 409, title: "Sipariş eşzamanlı bir işlemle çakıştı; sepeti kontrol edip tekrar deneyin."); }
            catch (ArgumentException ex) { return Results.Problem(statusCode: 400, title: ex.Message); }
            catch (InvalidOperationException ex) { return Results.Problem(statusCode: 409, title: ex.Message); }
        }).RequireRateLimiting("auth");
        group.MapPost("/track", async (TrackGuestOrderRequest request, HttpContext ctx, IOrderService service, CancellationToken ct) =>
        {
            var result = await service.TrackGuestAsync(request.OrderNumber, ctx.Request.Headers["X-Guest-Cart-Token"].FirstOrDefault(), ct);
            return result is null ? Results.NotFound() : Results.Ok(result);
        }).RequireRateLimiting("auth").WithSummary("Misafir siparişini sipariş numarası ve sepet anahtarıyla sorgular.");
        group.MapGet("/{id:guid}", async (Guid id, HttpContext ctx, IOrderService service, CancellationToken ct) =>
        {
            try { var result = await service.GetAsync(id, Customer(ctx), ctx.Request.Headers["X-Guest-Cart-Token"].FirstOrDefault(), ct); return result == null ? Results.NotFound() : Results.Ok(result); }
            catch (UnauthorizedAccessException) { return Results.Unauthorized(); }
        });
        group.MapGet("/", async (HttpContext ctx, IOrderService service, CancellationToken ct) => Customer(ctx) is Guid id ? Results.Ok(await service.ListAsync(id, ct)) : Results.Unauthorized()).RequireAuthorization();
        return app;
    }
    private static Guid? Customer(HttpContext ctx) => ctx.User.IsInRole("Customer") && Guid.TryParse(ctx.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}
