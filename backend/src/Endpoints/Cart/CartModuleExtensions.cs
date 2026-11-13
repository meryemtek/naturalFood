using System.Security.Claims;
using Application.Cart;
using Infrastructure.Cart;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Endpoints.Cart;

public static class CartModuleExtensions
{
    public static async Task InitializeCartDatabaseAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<CartDbContext>().Database.MigrateAsync();
    }

    public static IServiceCollection AddCartModule(this IServiceCollection services, IConfiguration configuration) => services.AddCartInfrastructure(configuration);
    public static IEndpointRouteBuilder MapCartEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/cart").WithTags("Sepet");
        group.MapPost("/guest", async (ICartService service, CancellationToken ct) => Results.Ok(await service.CreateGuestAsync(ct))).RequireRateLimiting("auth");
        group.MapGet("/", (HttpContext ctx, ICartService service, CancellationToken ct) => Execute(ctx, (id, token) => service.GetAsync(id, token, ct)));
        group.MapPut("/items", (HttpContext ctx, SetCartItemRequest request, ICartService service, CancellationToken ct) => Execute(ctx, (id, token) => service.SetItemAsync(id, token, request, ct)));
        group.MapDelete("/items/{itemId:guid}", (Guid itemId, HttpContext ctx, ICartService service, CancellationToken ct) => Execute(ctx, (id, token) => service.RemoveAsync(id, token, itemId, ct)));
        group.MapDelete("/", (HttpContext ctx, ICartService service, CancellationToken ct) => Execute(ctx, (id, token) => service.ClearAsync(id, token, ct)));
        group.MapPut("/coupon", (HttpContext ctx, ApplyCouponRequest request, ICartService service, CancellationToken ct) => Execute(ctx, (id, token) => service.ApplyCouponAsync(id, token, request.Code, ct))).RequireRateLimiting("auth");
        group.MapDelete("/coupon", (HttpContext ctx, ICartService service, CancellationToken ct) => Execute(ctx, (id, token) => service.RemoveCouponAsync(id, token, ct)));
        group.MapPost("/merge", (HttpContext ctx, ICartService service, CancellationToken ct) => Execute(ctx, (id, token) => id.HasValue && !string.IsNullOrWhiteSpace(token) ? service.MergeAsync(id.Value, token, ct) : throw new UnauthorizedAccessException())).RequireAuthorization();
        return app;
    }
    private static async Task<IResult> Execute(HttpContext ctx, Func<Guid?, string?, Task<CartView>> action)
    {
        var claim = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? customerId = ctx.User.IsInRole("Customer") && Guid.TryParse(claim, out var id) ? id : null;
        var token = ctx.Request.Headers["X-Guest-Cart-Token"].FirstOrDefault();
        try { return Results.Ok(await action(customerId, token)); }
        catch (UnauthorizedAccessException) { return Results.Unauthorized(); }
        catch (KeyNotFoundException) { return Results.NotFound(); }
        catch (ArgumentException ex) { return Results.Problem(statusCode: 400, title: ex.Message); }
        catch (InvalidOperationException ex) { return Results.Problem(statusCode: 409, title: ex.Message); }
    }
}
