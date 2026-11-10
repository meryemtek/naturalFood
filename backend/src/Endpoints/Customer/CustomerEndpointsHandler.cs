using System.Security.Claims;
using Application.Customer.DTOs;
using Application.Customer.Services;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Npgsql;

namespace Endpoints.Customer;

public static class CustomerEndpointsHandler
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        // =============================================================
        // 1. Kimlik Doğrulama Endpoint'leri (/api/auth)
        // =============================================================
        var authGroup = app.MapGroup("/api/auth")
            .WithTags("Kimlik Doğrulama")
            .RequireRateLimiting("auth");

        // Kayıt Ol
        authGroup.MapPost("/register", async (
            RegisterRequest request,
            IValidator<RegisterRequest> validator,
            IAuthService authService,
            CancellationToken ct) =>
        {
            var valResult = await validator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
                return Results.ValidationProblem(valResult.ToDictionary());

            try
            {
                var response = await authService.RegisterAsync(request, ct);
                return Results.Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
            catch (DbUpdateException ex) when (ex.GetBaseException() is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation,
                ConstraintName: "IX_Customers_Email"
            })
            {
                return Results.Conflict(new { message = "Bu e-posta adresi ile hesap oluşturulamıyor." });
            }
        })
        .WithName("Register")
        .WithSummary("Yeni müşteri hesabı oluşturur ve JWT token döner.");

        // Giriş Yap
        authGroup.MapPost("/login", async (
            LoginRequest request,
            IValidator<LoginRequest> validator,
            IAuthService authService,
            CancellationToken ct) =>
        {
            var valResult = await validator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
                return Results.ValidationProblem(valResult.ToDictionary());

            try
            {
                var response = await authService.LoginAsync(request, ct);
                return Results.Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Results.Json(new { message = ex.Message }, statusCode: StatusCodes.Status401Unauthorized);
            }
        })
        .WithName("Login")
        .WithSummary("Müşteri girişi yapar ve JWT token döner.");

        // Refresh Token ile Yenileme
        authGroup.MapPost("/refresh", async (
            RefreshTokenRequest request,
            IAuthService authService,
            CancellationToken ct) =>
        {
            try
            {
                var response = await authService.RefreshTokenAsync(request, ct);
                return Results.Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Results.Json(new { message = ex.Message }, statusCode: StatusCodes.Status401Unauthorized);
            }
        })
        .WithName("RefreshToken")
        .WithSummary("Refresh token ile yeni Access Token üretir.");

        // Çıkış Yap
        authGroup.MapPost("/logout", async (
            RefreshTokenRequest request,
            ClaimsPrincipal user,
            IAuthService authService,
            CancellationToken ct) =>
        {
            var customerId = GetCustomerId(user);
            if (customerId.HasValue)
            {
                await authService.LogoutAsync(customerId.Value, request.RefreshToken, ct);
            }
            return Results.Ok(new { message = "Başarıyla çıkış yapıldı." });
        })
        .RequireAuthorization()
        .WithName("Logout")
        .WithSummary("Mevcut oturumu kapatır ve refresh token'ı geçersiz kılar.");

        // Şifremi Unuttum
        authGroup.MapPost("/forgot-password", async (
            ForgotPasswordRequest request,
            IValidator<ForgotPasswordRequest> validator,
            IAuthService authService,
            CancellationToken ct) =>
        {
            var valResult = await validator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
                return Results.ValidationProblem(valResult.ToDictionary());

            await authService.ForgotPasswordAsync(request, ct);
            return Results.Problem(statusCode: 503, title: "Şifre sıfırlama henüz kullanılamıyor.");
        })
        .WithName("ForgotPassword")
        .WithSummary("Şifre sıfırlama talebi oluşturur.");

        // Şifre Sıfırlama
        authGroup.MapPost("/reset-password", async (
            ResetPasswordRequest request,
            IValidator<ResetPasswordRequest> validator,
            IAuthService authService,
            CancellationToken ct) =>
        {
            var valResult = await validator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
                return Results.ValidationProblem(valResult.ToDictionary());

            var success = await authService.ResetPasswordAsync(request, ct);
            return success
                ? Results.Ok(new { message = "Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz." })
                : Results.BadRequest(new { message = "Geçersiz veya süresi dolmuş sıfırlama token'ı." });
        })
        .WithName("ResetPassword")
        .WithSummary("Token kullanarak şifreyi sıfırlar.");

        // =============================================================
        // 2. Müşteri Profil & Güvenlik Endpoint'leri (/api/customer)
        // =============================================================
        var customerGroup = app.MapGroup("/api/customer")
            .WithTags("Müşteri Hesabı")
            .RequireAuthorization();

        // Profil Getir
        customerGroup.MapGet("/profile", async (
            ClaimsPrincipal user,
            ICustomerService customerService,
            CancellationToken ct) =>
        {
            var customerId = GetCustomerId(user);
            if (!customerId.HasValue)
                return Results.Unauthorized();

            var profile = await customerService.GetProfileAsync(customerId.Value, ct);
            return profile != null ? Results.Ok(profile) : Results.NotFound(new { message = "Müşteri bulunamadı." });
        })
        .WithName("GetCustomerProfile")
        .WithSummary("Giriş yapmış müşterinin profil bilgilerini döner.");

        // Profil Güncelle
        customerGroup.MapPut("/profile", async (
            UpdateProfileRequest request,
            IValidator<UpdateProfileRequest> validator,
            ClaimsPrincipal user,
            ICustomerService customerService,
            CancellationToken ct) =>
        {
            var customerId = GetCustomerId(user);
            if (!customerId.HasValue)
                return Results.Unauthorized();

            var valResult = await validator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
                return Results.ValidationProblem(valResult.ToDictionary());

            var updated = await customerService.UpdateProfileAsync(customerId.Value, request, ct);
            return updated != null ? Results.Ok(updated) : Results.NotFound(new { message = "Müşteri bulunamadı." });
        })
        .WithName("UpdateCustomerProfile")
        .WithSummary("Müşteri profil bilgilerini günceller.");

        // Şifre Değiştir
        customerGroup.MapPost("/change-password", async (
            ChangePasswordRequest request,
            IValidator<ChangePasswordRequest> validator,
            ClaimsPrincipal user,
            IAuthService authService,
            CancellationToken ct) =>
        {
            var customerId = GetCustomerId(user);
            if (!customerId.HasValue)
                return Results.Unauthorized();

            var valResult = await validator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
                return Results.ValidationProblem(valResult.ToDictionary());

            try
            {
                var success = await authService.ChangePasswordAsync(customerId.Value, request, ct);
                return success
                    ? Results.Ok(new { message = "Şifreniz başarıyla değiştirildi." })
                    : Results.BadRequest(new { message = "Şifre değiştirilemedi." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        })
        .WithName("ChangeCustomerPassword")
        .WithSummary("Mevcut şifreyi doğrulayarak yeni şifre belirler.");

        // =============================================================
        // 3. Adres Yönetimi (/api/customer/addresses)
        // =============================================================
        var addressGroup = customerGroup.MapGroup("/addresses")
            .WithTags("Müşteri Adresleri");

        addressGroup.MapGet("/", async (
            ClaimsPrincipal user,
            ICustomerService customerService,
            CancellationToken ct) =>
        {
            var customerId = GetCustomerId(user);
            if (!customerId.HasValue) return Results.Unauthorized();

            var addresses = await customerService.GetAddressesAsync(customerId.Value, ct);
            return Results.Ok(addresses);
        })
        .WithName("GetCustomerAddresses")
        .WithSummary("Müşterinin tüm kayıtlı adreslerini döner.");

        addressGroup.MapGet("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal user,
            ICustomerService customerService,
            CancellationToken ct) =>
        {
            var customerId = GetCustomerId(user);
            if (!customerId.HasValue) return Results.Unauthorized();

            var address = await customerService.GetAddressByIdAsync(customerId.Value, id, ct);
            return address != null ? Results.Ok(address) : Results.NotFound(new { message = "Adres bulunamadı." });
        })
        .WithName("GetCustomerAddressById")
        .WithSummary("ID ile belirli bir adresi döner.");

        addressGroup.MapPost("/", async (
            AddressRequest request,
            IValidator<AddressRequest> validator,
            ClaimsPrincipal user,
            ICustomerService customerService,
            CancellationToken ct) =>
        {
            var customerId = GetCustomerId(user);
            if (!customerId.HasValue) return Results.Unauthorized();

            var valResult = await validator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
                return Results.ValidationProblem(valResult.ToDictionary());

            var address = await customerService.CreateAddressAsync(customerId.Value, request, ct);
            return Results.Created($"/api/customer/addresses/{address.Id}", address);
        })
        .WithName("CreateCustomerAddress")
        .WithSummary("Yeni teslimat veya fatura adresi ekler.");

        addressGroup.MapPut("/{id:guid}", async (
            Guid id,
            AddressRequest request,
            IValidator<AddressRequest> validator,
            ClaimsPrincipal user,
            ICustomerService customerService,
            CancellationToken ct) =>
        {
            var customerId = GetCustomerId(user);
            if (!customerId.HasValue) return Results.Unauthorized();

            var valResult = await validator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
                return Results.ValidationProblem(valResult.ToDictionary());

            var updated = await customerService.UpdateAddressAsync(customerId.Value, id, request, ct);
            return updated != null ? Results.Ok(updated) : Results.NotFound(new { message = "Adres bulunamadı." });
        })
        .WithName("UpdateCustomerAddress")
        .WithSummary("Kayıtlı adresi günceller.");

        addressGroup.MapDelete("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal user,
            ICustomerService customerService,
            CancellationToken ct) =>
        {
            var customerId = GetCustomerId(user);
            if (!customerId.HasValue) return Results.Unauthorized();

            var deleted = await customerService.DeleteAddressAsync(customerId.Value, id, ct);
            return deleted ? Results.NoContent() : Results.NotFound(new { message = "Adres bulunamadı." });
        })
        .WithName("DeleteCustomerAddress")
        .WithSummary("Kayıtlı adresi siler.");

        // =============================================================
        // 4. Favori (Wishlist) Yönetimi (/api/customer/wishlist)
        // =============================================================
        var wishlistGroup = customerGroup.MapGroup("/wishlist")
            .WithTags("Müşteri Favorileri");

        wishlistGroup.MapGet("/", async (
            ClaimsPrincipal user,
            ICustomerService customerService,
            CancellationToken ct) =>
        {
            var customerId = GetCustomerId(user);
            if (!customerId.HasValue) return Results.Unauthorized();

            var wishlist = await customerService.GetWishlistAsync(customerId.Value, ct);
            return Results.Ok(wishlist);
        })
        .WithName("GetCustomerWishlist")
        .WithSummary("Müşterinin favori ürünler listesini döner.");

        wishlistGroup.MapPost("/{productId:guid}", async (
            Guid productId,
            ClaimsPrincipal user,
            ICustomerService customerService,
            CancellationToken ct) =>
        {
            var customerId = GetCustomerId(user);
            if (!customerId.HasValue) return Results.Unauthorized();

            try
            {
                var item = await customerService.AddToWishlistAsync(customerId.Value, productId, ct);
                return Results.Created($"/api/customer/wishlist/{productId}", item);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        })
        .WithName("AddToCustomerWishlist")
        .WithSummary("Ürünü favorilere ekler.");

        wishlistGroup.MapDelete("/{productId:guid}", async (
            Guid productId,
            ClaimsPrincipal user,
            ICustomerService customerService,
            CancellationToken ct) =>
        {
            var customerId = GetCustomerId(user);
            if (!customerId.HasValue) return Results.Unauthorized();

            var removed = await customerService.RemoveFromWishlistAsync(customerId.Value, productId, ct);
            return removed ? Results.NoContent() : Results.NotFound(new { message = "Ürün favorilerinizde bulunamadı." });
        })
        .WithName("RemoveFromCustomerWishlist")
        .WithSummary("Ürünü favorilerden çıkarır.");

        wishlistGroup.MapGet("/check/{productId:guid}", async (
            Guid productId,
            ClaimsPrincipal user,
            ICustomerService customerService,
            CancellationToken ct) =>
        {
            var customerId = GetCustomerId(user);
            if (!customerId.HasValue) return Results.Unauthorized();

            var isIn = await customerService.IsInWishlistAsync(customerId.Value, productId, ct);
            return Results.Ok(new { isInWishlist = isIn });
        })
        .WithName("CheckInCustomerWishlist")
        .WithSummary("Ürünün favorilerde olup olmadığını sorgular.");
    }

    private static Guid? GetCustomerId(ClaimsPrincipal user)
    {
        var claim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}
