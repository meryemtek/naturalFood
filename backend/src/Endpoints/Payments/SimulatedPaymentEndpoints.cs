using System.Security.Claims;
using Application.Payments;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Endpoints.Payments;
public static class SimulatedPaymentEndpoints
{
    public static IEndpointRouteBuilder MapSimulatedPaymentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/orders/{orderId:guid}/simulated-payments").WithTags("Ödeme Simülasyonu");
        group.MapPost("/", async (Guid orderId, HttpContext context, SimulatePaymentRequest request, ISimulatedPaymentService service, IHostEnvironment env, IConfiguration config, CancellationToken ct) =>
        {
            if (!Enabled(env, config)) return Results.NotFound();
            try
            {
                var result = await service.SimulateAsync(orderId, Customer(context), context.Request.Headers["X-Guest-Cart-Token"].FirstOrDefault(), context.Request.Headers["Idempotency-Key"].FirstOrDefault() ?? "", request, ct);
                return Results.Ok(result);
            }
            catch (UnauthorizedAccessException) { return Results.Unauthorized(); }
            catch (KeyNotFoundException) { return Results.NotFound(); }
            catch (ArgumentException ex) { return Results.Problem(statusCode: 400, title: ex.Message); }
            catch (InvalidOperationException ex) { return Results.Problem(statusCode: 409, title: ex.Message); }
        }).RequireRateLimiting("auth").WithSummary("Yalnızca geliştirme ortamında simüle ödeme sonucu kaydeder.");
        group.MapGet("/{paymentId:guid}", async (Guid orderId, Guid paymentId, HttpContext context, ISimulatedPaymentService service, IHostEnvironment env, IConfiguration config, CancellationToken ct) =>
        {
            if (!Enabled(env, config)) return Results.NotFound();
            try
            {
                var result = await service.GetAsync(orderId, paymentId, Customer(context), context.Request.Headers["X-Guest-Cart-Token"].FirstOrDefault(), ct);
                return result == null ? Results.NotFound() : Results.Ok(result);
            }
            catch (UnauthorizedAccessException) { return Results.Unauthorized(); }
        });
        return app;
    }
    private static bool Enabled(IHostEnvironment env, IConfiguration config) => env.IsDevelopment() && config.GetValue<bool>("Payments:Simulation:Enabled");
    private static Guid? Customer(HttpContext context) => context.User.IsInRole("Customer") && Guid.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}
