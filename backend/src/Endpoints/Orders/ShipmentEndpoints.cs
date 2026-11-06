using System.Security.Claims;
using Application.Orders;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Endpoints.Orders;

public static class ShipmentEndpoints
{
    public static IEndpointRouteBuilder MapShipmentEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/orders/{orderId:guid}/shipment", async (Guid orderId, HttpContext context, IShipmentService service, CancellationToken ct) =>
        {
            var principal = context.User;
            Guid? customer = principal.IsInRole("Customer") && Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
            try
            {
                var result = await service.GetAsync(orderId, customer, context.Request.Headers["X-Guest-Cart-Token"].FirstOrDefault(), ct);
                return result is null ? Results.NotFound() : Results.Ok(result);
            }
            catch (UnauthorizedAccessException) { return Results.Unauthorized(); }
        }).WithTags("Teslimat");

        return app;
    }
}
