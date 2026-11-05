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

        return group;
    }
}

