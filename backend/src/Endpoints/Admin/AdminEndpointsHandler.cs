using Application.DTOs.Admin;
using Application.Services.Admin;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Endpoints.Admin;

internal static class AdminEndpointsHandler
{
    public static RouteGroupBuilder MapEndpoints(RouteGroupBuilder group)
    {
        // 1. Health Check
        group.MapGet("/health", () => Results.Ok(new
        {
            Module = "Admin",
            DatabaseSchema = "admin",
            Status = "Healthy",
            Timestamp = DateTime.UtcNow
        }))
        .WithName("GetAdminHealth")
        .WithTags("Admin Health");

        // 2. Kullanıcı İşlemleri
        var users = group.MapGroup("/users").WithTags("Admin Users");

        // GET /api/admin/users?page=1&pageSize=10
        users.MapGet("/", async (
            [FromQuery] int? page,
            [FromQuery] int? pageSize,
            IAdminService adminService,
            CancellationToken ct) =>
        {
            var p = page ?? 1;
            var ps = pageSize ?? 10;
            var paginatedUsers = await adminService.GetUsersAsync(p, ps, ct);
            return Results.Ok(paginatedUsers);
        })
        .WithName("GetAdminUsers")
        .Produces<PaginatedList<AdminUserDto>>(StatusCodes.Status200OK);

        // GET /api/admin/users/{id}
        users.MapGet("/{id:guid}", async (Guid id, IAdminService adminService, CancellationToken ct) =>
        {
            var user = await adminService.GetUserByIdAsync(id, ct);
            return user is not null 
                ? Results.Ok(user) 
                : Results.NotFound(new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Kullanıcı Bulunamadı",
                    Detail = $"Id değeri '{id}' olan yönetici kullanıcısı bulunamadı."
                });
        })
        .WithName("GetAdminUserById")
        .Produces<AdminUserDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        // POST /api/admin/users
        users.MapPost("/", async (
            CreateAdminUserRequest req,
            IValidator<CreateAdminUserRequest> validator,
            IAdminService adminService,
            CancellationToken ct) =>
        {
            var validationResult = await validator.ValidateAsync(req, ct);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var createdUser = await adminService.CreateUserAsync(req, ct);
            return Results.Created($"/api/admin/users/{createdUser.Id}", createdUser);
        })
        .WithName("CreateAdminUser")
        .Produces<AdminUserDto>(StatusCodes.Status201Created)
        .Produces<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest);

        // PATCH /api/admin/users/{id}/status
        users.MapPatch("/{id:guid}/status", async (
            Guid id,
            UpdateUserStatusRequest req,
            IValidator<UpdateUserStatusRequest> validator,
            IAdminService adminService,
            CancellationToken ct) =>
        {
            var validationResult = await validator.ValidateAsync(req, ct);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var updatedUser = await adminService.UpdateUserStatusAsync(id, req.IsActive, ct);
            return updatedUser is not null 
                ? Results.Ok(updatedUser) 
                : Results.NotFound(new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Kullanıcı Bulunamadı",
                    Detail = $"Durumu güncellenecek '{id}' Id numaralı yönetici bulunamadı."
                });
        })
        .WithName("UpdateAdminUserStatus")
        .Produces<AdminUserDto>(StatusCodes.Status200OK)
        .Produces<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        // 3. Denetim Kayıtları
        // GET /api/admin/audit-logs?page=1&pageSize=10
        group.MapGet("/audit-logs", async (
            [FromQuery] int? page,
            [FromQuery] int? pageSize,
            IAdminService adminService,
            CancellationToken ct) =>
        {
            var p = page ?? 1;
            var ps = pageSize ?? 10;
            var paginatedLogs = await adminService.GetAuditLogsAsync(p, ps, ct);
            return Results.Ok(paginatedLogs);
        })
        .WithName("GetAdminAuditLogs")
        .WithTags("Admin Audit")
        .Produces<PaginatedList<AuditLogDto>>(StatusCodes.Status200OK);

        // =========================================================================
        // 4. Doğal Gıda Ürün Yönetimi (Products - Vertical Slice 1)
        // =========================================================================
        var products = group.MapGroup("/products").WithTags("Admin Products");

        // GET /api/admin/products (Sayfalama, arama ve kategori/birim filtreli)
        products.MapGet("/", async (
            [FromQuery] int? page,
            [FromQuery] int? pageSize,
            [FromQuery] string? search,
            [FromQuery] string? category,
            [FromQuery] string? unit,
            IProductService productService,
            CancellationToken ct) =>
        {
            var p = page ?? 1;
            var ps = pageSize ?? 20;
            var paginatedProducts = await productService.GetProductsAsync(p, ps, search, category, unit, ct);
            return Results.Ok(paginatedProducts);
        })
        .WithName("GetAdminProducts")
        .Produces<PaginatedList<ProductDto>>(StatusCodes.Status200OK);

        // GET /api/admin/products/{id}
        products.MapGet("/{id:guid}", async (
            Guid id,
            IProductService productService,
            CancellationToken ct) =>
        {
            var product = await productService.GetProductByIdAsync(id, ct);
            return product is not null
                ? Results.Ok(product)
                : Results.NotFound(new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Ürün Bulunamadı",
                    Detail = $"Id değeri '{id}' olan ürün bulunamadı."
                });
        })
        .WithName("GetAdminProductById")
        .Produces<ProductDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        // POST /api/admin/products
        products.MapPost("/", async (
            CreateProductRequest req,
            IValidator<CreateProductRequest> validator,
            IProductService productService,
            CancellationToken ct) =>
        {
            var validationResult = await validator.ValidateAsync(req, ct);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var createdProduct = await productService.CreateProductAsync(req, ct);
            return Results.Created($"/api/admin/products/{createdProduct.Id}", createdProduct);
        })
        .WithName("CreateAdminProduct")
        .Produces<ProductDto>(StatusCodes.Status201Created)
        .Produces<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest);

        // PUT /api/admin/products/{id}
        products.MapPut("/{id:guid}", async (
            Guid id,
            UpdateProductRequest req,
            IValidator<UpdateProductRequest> validator,
            IProductService productService,
            CancellationToken ct) =>
        {
            var validationResult = await validator.ValidateAsync(req, ct);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var updatedProduct = await productService.UpdateProductAsync(id, req, ct);
            return updatedProduct is not null
                ? Results.Ok(updatedProduct)
                : Results.NotFound(new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Ürün Bulunamadı",
                    Detail = $"Güncellenecek '{id}' Id numaralı ürün bulunamadı."
                });
        })
        .WithName("UpdateAdminProduct")
        .Produces<ProductDto>(StatusCodes.Status200OK)
        .Produces<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        // DELETE /api/admin/products/{id}
        products.MapDelete("/{id:guid}", async (
            Guid id,
            IProductService productService,
            CancellationToken ct) =>
        {
            var success = await productService.DeleteProductAsync(id, ct);
            return success
                ? Results.Ok(new { Success = true, Message = "Ürün başarıyla silindi." })
                : Results.NotFound(new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Ürün Bulunamadı",
                    Detail = $"Silinecek '{id}' Id numaralı ürün bulunamadı."
                });
        })
        .WithName("DeleteAdminProduct")
        .Produces(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        // =========================================================================
        // 5. Envanter ve Stok Yönetimi (Inventory - Vertical Slice 2)
        // =========================================================================
        var inventory = group.MapGroup("/inventory").WithTags("Admin Inventory");

        // GET /api/admin/inventory (Sayfalama, arama, kategori ve kritik stok filtreli)
        inventory.MapGet("/", async (
            [FromQuery] int? page,
            [FromQuery] int? pageSize,
            [FromQuery] string? search,
            [FromQuery] string? category,
            [FromQuery] bool? criticalOnly,
            IInventoryService inventoryService,
            CancellationToken ct) =>
        {
            var p = page ?? 1;
            var ps = pageSize ?? 50;
            var result = await inventoryService.GetInventoryAsync(p, ps, search, category, criticalOnly, ct);
            return Results.Ok(result);
        })
        .WithName("GetAdminInventory")
        .Produces<PaginatedList<InventoryItemDto>>(StatusCodes.Status200OK);

        // PATCH /api/admin/inventory/{id}/stock
        inventory.MapPatch("/{id:guid}/stock", async (
            Guid id,
            UpdateStockRequest req,
            IInventoryService inventoryService,
            CancellationToken ct) =>
        {
            var updated = await inventoryService.UpdateStockAsync(id, req, ct);
            return updated is not null
                ? Results.Ok(updated)
                : Results.NotFound(new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Ürün Bulunamadı",
                    Detail = $"Stok miktarı güncellenecek '{id}' Id numaralı ürün bulunamadı."
                });
        })
        .WithName("UpdateAdminInventoryStock")
        .Produces<InventoryItemDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return group;
    }
}
