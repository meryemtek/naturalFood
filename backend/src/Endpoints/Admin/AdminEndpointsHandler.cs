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

        // GET /api/admin/products/{id}/details
        products.MapGet("/{id:guid}/details", async (
            Guid id,
            IProductService productService,
            CancellationToken ct) =>
        {
            var details = await productService.GetProductDetailsAsync(id, ct);
            return details is not null
                ? Results.Ok(details)
                : Results.NotFound(new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Ürün Bulunamadı",
                    Detail = $"Id değeri '{id}' olan ürünün detayları bulunamadı."
                });
        })
        .WithName("GetAdminProductDetails")
        .Produces<ProductDetailsDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        // PUT /api/admin/products/{id}/details
        products.MapPut("/{id:guid}/details", async (
            Guid id,
            UpdateProductDetailsRequest req,
            IProductService productService,
            CancellationToken ct) =>
        {
            var updatedDetails = await productService.UpdateProductDetailsAsync(id, req, ct);
            return updatedDetails is not null
                ? Results.Ok(updatedDetails)
                : Results.NotFound(new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Ürün Bulunamadı",
                    Detail = $"Detayları güncellenecek '{id}' Id numaralı ürün bulunamadı."
                });
        })
        .WithName("UpdateAdminProductDetails")
        .Produces<ProductDetailsDto>(StatusCodes.Status200OK)
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

        // =========================================================================
        // 6. STT / TETT ve Parti (Lot) Takibi (Lots - Vertical Slice 4)
        // =========================================================================
        var lots = group.MapGroup("/lots").WithTags("Admin Lots");

        // GET /api/admin/lots
        lots.MapGet("/", async (
            [FromQuery] Guid? productId,
            [FromQuery] int? expiringWithinDays,
            [FromQuery] string? status,
            [FromQuery] string? search,
            [FromQuery] int? page,
            [FromQuery] int? pageSize,
            ILotService lotService,
            CancellationToken ct) =>
        {
            var p = page ?? 1;
            var ps = pageSize ?? 20;
            var result = await lotService.GetLotsAsync(productId, expiringWithinDays, status, search, p, ps, ct);
            return Results.Ok(result);
        })
        .WithName("GetAdminLots")
        .Produces<PaginatedLotsResponse>(StatusCodes.Status200OK);

        // POST /api/admin/lots
        lots.MapPost("/", async (
            CreateLotRequest req,
            ILotService lotService,
            CancellationToken ct) =>
        {
            if (req.ProductId == Guid.Empty)
            {
                return Results.BadRequest(new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Geçersiz İstek",
                    Detail = "Ürün (ProductId) seçilmelidir."
                });
            }

            if (req.Quantity <= 0)
            {
                return Results.BadRequest(new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Geçersiz İstek",
                    Detail = "Parti miktarı 0'dan büyük olmalıdır."
                });
            }

            if (req.ExpiryDate <= req.ProductionDate)
            {
                return Results.BadRequest(new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Geçersiz İstek",
                    Detail = "Son tüketim tarihi üretim tarihinden sonra olmalıdır."
                });
            }

            var createdLot = await lotService.CreateLotAsync(req, ct);
            return Results.Created($"/api/admin/lots/{createdLot.Id}", createdLot);
        })
        .WithName("CreateAdminLot")
        .Produces<ProductLotDto>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest);

        // PATCH /api/admin/lots/{id}/status
        lots.MapPatch("/{id:guid}/status", async (
            Guid id,
            UpdateLotStatusRequest req,
            ILotService lotService,
            CancellationToken ct) =>
        {
            var updated = await lotService.UpdateLotStatusAsync(id, req.Status, ct);
            return updated is not null
                ? Results.Ok(updated)
                : Results.NotFound(new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Parti Bulunamadı",
                    Detail = $"Durumu güncellenecek '{id}' Id numaralı parti bulunamadı."
                });
        })
        .WithName("UpdateAdminLotStatus")
        .Produces<ProductLotDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        // =========================================================================
        // 7. Saklama Koşulları ve Muhafaza Tanımları (Storage - Vertical Slice 5)
        // =========================================================================
        var storage = group.MapGroup("/storage-conditions").WithTags("Admin Storage Conditions");

        // GET /api/admin/storage-conditions
        storage.MapGet("/", async (
            IStorageService storageService,
            CancellationToken ct) =>
        {
            var conditions = await storageService.GetStorageConditionsAsync(ct);
            return Results.Ok(conditions);
        })
        .WithName("GetAdminStorageConditions")
        .Produces<IReadOnlyList<StorageConditionDto>>(StatusCodes.Status200OK);

        // POST /api/admin/storage-conditions
        storage.MapPost("/", async (
            CreateStorageConditionRequest req,
            IStorageService storageService,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
            {
                return Results.BadRequest(new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Geçersiz İstek",
                    Detail = "Saklama koşulu adı zorunludur."
                });
            }

            var created = await storageService.CreateStorageConditionAsync(req, ct);
            return Results.Created($"/api/admin/storage-conditions/{created.Id}", created);
        })
        .WithName("CreateAdminStorageCondition")
        .Produces<StorageConditionDto>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest);

        // GET /api/admin/storage-conditions/products
        storage.MapGet("/products", async (
            [FromQuery] Guid? conditionId,
            [FromQuery] string? search,
            IStorageService storageService,
            CancellationToken ct) =>
        {
            var products = await storageService.GetProductsStorageAsync(conditionId, search, ct);
            return Results.Ok(products);
        })
        .WithName("GetAdminProductsStorage")
        .Produces<IReadOnlyList<ProductStorageItemDto>>(StatusCodes.Status200OK);

        // PATCH /api/admin/products/{id}/storage
        products.MapPatch("/{id:guid}/storage", async (
            Guid id,
            UpdateProductStorageRequest req,
            IStorageService storageService,
            CancellationToken ct) =>
        {
            var updated = await storageService.UpdateProductStorageAsync(id, req, ct);
            return updated is not null
                ? Results.Ok(updated)
                : Results.NotFound(new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Ürün Bulunamadı",
                    Detail = $"Saklama koşulu güncellenecek '{id}' Id numaralı ürün bulunamadı."
                });
        })
        .WithName("UpdateAdminProductStorage")
        .Produces<ProductStorageItemDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        // =========================================================================
        // 8. Müşteri Değerlendirmeleri & Dashboard Risk Takibi (CRM Reviews)
        // =========================================================================
        var reviews = group.MapGroup("/reviews").WithTags("Admin Customer Reviews");

        // GET /api/admin/reviews/dashboard-attention
        reviews.MapGet("/dashboard-attention", async (
            IAdminReviewService reviewService,
            CancellationToken ct) =>
        {
            var result = await reviewService.GetDashboardAttentionReviewsAsync(ct);
            return Results.Ok(result);
        })
        .WithName("GetDashboardAttentionReviews")
        .Produces<DashboardReviewsAttentionResponse>(StatusCodes.Status200OK);

        // GET /api/admin/reviews (Müşteri Değerlendirmeleri Detay Sayfası için tüm yorumlar)
        reviews.MapGet("/", async (
            [FromQuery] int? rating,
            [FromQuery] string? status,
            [FromQuery] bool? onlyNegative,
            [FromQuery] string? search,
            [FromQuery] int? page,
            [FromQuery] int? pageSize,
            IAdminReviewService reviewService,
            CancellationToken ct) =>
        {
            var p = page ?? 1;
            var ps = pageSize ?? 20;
            var result = await reviewService.GetAllReviewsAsync(rating, status, onlyNegative, search, p, ps, ct);
            return Results.Ok(result);
        })
        .WithName("GetAllAdminReviews")
        .Produces<PaginatedAdminReviewsResponse>(StatusCodes.Status200OK);

        // POST /api/admin/reviews/{id}/quick-response
        reviews.MapPost("/{id:guid}/quick-response", async (
            Guid id,
            QuickReviewResponseRequest req,
            IAdminReviewService reviewService,
            CancellationToken ct) =>
        {
            var updated = await reviewService.QuickRespondAsync(id, req, ct);
            return updated is not null
                ? Results.Ok(updated)
                : Results.NotFound(new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Yorum Bulunamadı",
                    Detail = $"Yanıtlanacak '{id}' Id numaralı müşteri değerlendirmesi bulunamadı."
                });
        })
        .WithName("QuickRespondAdminReview")
        .Produces<AdminReviewItemDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        // PATCH /api/admin/reviews/{id}/status
        reviews.MapPatch("/{id:guid}/status", async (
            Guid id,
            UpdateReviewStatusRequest req,
            IAdminReviewService reviewService,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Status))
            {
                return Results.BadRequest(new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Geçersiz Durum",
                    Detail = "Durum bilgisi zorunludur."
                });
            }

            var updated = await reviewService.UpdateReviewStatusAsync(id, req.Status, ct);
            return updated is not null
                ? Results.Ok(updated)
                : Results.NotFound(new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Yorum Bulunamadı",
                    Detail = $"Durumu güncellenecek '{id}' Id numaralı müşteri değerlendirmesi bulunamadı."
                });
        })
        .WithName("UpdateAdminReviewStatus")
        .Produces<AdminReviewItemDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return group;
    }
}
