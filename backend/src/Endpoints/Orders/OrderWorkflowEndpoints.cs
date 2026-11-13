using System.Security.Claims;
using Application.Orders;
using Endpoints.Admin;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Npgsql;

namespace Endpoints.Orders;

public static class OrderWorkflowEndpoints
{
    public static IEndpointRouteBuilder MapOrderWorkflowEndpoints(this IEndpointRouteBuilder app)
    {
        var customer = app.MapGroup("/api/orders/{id:guid}").WithTags("Sipariş takibi").RequireRateLimiting("orderTracking");
        customer.MapGet("/workflow", (Guid id, HttpContext ctx, IOrderService orders, IOrderWorkflowService service, CancellationToken ct) =>
            Run(ctx, async () => { await Owner(id, ctx, orders, ct); return Results.Ok(await service.GetAsync(id, ct)); }));
        customer.MapPost("/requests", (Guid id, CreateOrderCustomerRequest request, HttpContext ctx, IOrderService orders, IOrderWorkflowService service, CancellationToken ct) =>
            Run(ctx, async () => { await Owner(id, ctx, orders, ct); await service.CreateRequestAsync(id, request, ct); return Results.NoContent(); }));
        customer.MapGet("/invoice", (Guid id, HttpContext ctx, IOrderService orders, IOrderWorkflowService service, CancellationToken ct) =>
            Run(ctx, async () => { await Owner(id, ctx, orders, ct); var result = await service.InvoiceAsync(id, ct); return result is null ? Results.NotFound() : Results.Ok(result); }));
        var admin = app.MapGroup("/api/admin/orders/{id:guid}").RequireAuthorization().RequirePermission("orders.view").WithTags("Admin Orders");
        admin.MapGet("/workflow", (Guid id, HttpContext ctx, IOrderWorkflowService service, CancellationToken ct) =>
            Run(ctx, async () => Results.Ok(await service.GetAsync(id, ct))));
        admin.MapPatch("/status", (Guid id, UpdateOrderStatusRequest request, HttpContext ctx, IOrderWorkflowService service, CancellationToken ct) =>
            Run(ctx, async () => { await service.ChangeStatusAsync(id, request, Actor(ctx), ct); return Results.NoContent(); })).RequirePermission("orders.manage");
        admin.MapPost("/requests/{requestId:guid}/resolve", (Guid id, Guid requestId, ResolveOrderCustomerRequest request, HttpContext ctx, IOrderWorkflowService service, CancellationToken ct) =>
            Run(ctx, async () => { await service.ResolveRequestAsync(id, requestId, request, Actor(ctx), ct); return Results.NoContent(); })).RequirePermission("orders.manage");
        admin.MapPost("/invoice", (Guid id, HttpContext ctx, IOrderWorkflowService service, CancellationToken ct) =>
            Run(ctx, async () => { await service.IssueDemoInvoiceAsync(id, Actor(ctx), ct); return Results.NoContent(); })).RequirePermission("orders.manage");
        admin.MapGet("/invoice", (Guid id, HttpContext ctx, IOrderWorkflowService service, CancellationToken ct) =>
            Run(ctx, async () => { var result = await service.InvoiceAsync(id, ct); return result is null ? Results.NotFound() : Results.Ok(result); }));
        return app;
    }
    private static Guid Actor(HttpContext ctx) => Guid.TryParse(ctx.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : throw new UnauthorizedAccessException();
    private static async Task Owner(Guid id, HttpContext ctx, IOrderService orders, CancellationToken ct)
    {
        Guid? customer = ctx.User.IsInRole("Customer") ? Actor(ctx) : null;
        if (await orders.GetAsync(id, customer, ctx.Request.Headers["X-Guest-Cart-Token"].FirstOrDefault(), ct) is null) throw new KeyNotFoundException();
    }
    private static async Task<IResult> Run(HttpContext ctx, Func<Task<IResult>> action)
    {
        ctx.Response.Headers.CacheControl = "no-store";
        try { return await action(); }
        catch (UnauthorizedAccessException) { return Results.Unauthorized(); }
        catch (KeyNotFoundException) { return Results.NotFound(); }
        catch (ArgumentException ex) { return Results.Problem(statusCode: 400, title: ex.Message); }
        catch (InvalidOperationException ex) { return Results.Problem(statusCode: 409, title: ex.Message); }
        catch (PostgresException ex) when (ex.SqlState is "40001" or "40P01" or "23505") { return Results.Problem(statusCode: 409, title: "Sipariş başka bir işlemle güncellendi. Yenileyip tekrar deneyin."); }
    }
}
