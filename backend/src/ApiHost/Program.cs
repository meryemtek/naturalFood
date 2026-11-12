using System.Threading.RateLimiting;
using System.Text;
using Application.Common;
using Endpoints.Admin;
using Endpoints.Cart;
using Endpoints.Orders;
using Endpoints.Payments;
using Endpoints.Experience;
using Infrastructure.Experience;
using Infrastructure.Promotions;
using Endpoints.Catalog;
using Endpoints.Content;
using Endpoints.Customer;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// 1. OpenAPI & Dokümantasyon
builder.Services.AddOpenApi();

// 2. Global Hata Yakalama (RFC 7807 ProblemDetails Standardı)
builder.Services.AddProblemDetails();

// İzin verilen istemciler yapılandırmadan belirlenir; varsayılan olarak çapraz köken erişimi kapalıdır.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy("Storefront", policy =>
{
    if (allowedOrigins.Length > 0)
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
}));

// 4. JWT Kimlik Doğrulama & Yetkilendirme
var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();
if (string.IsNullOrWhiteSpace(jwtSettings.SecretKey) || Encoding.UTF8.GetByteCount(jwtSettings.SecretKey) < 32)
    throw new InvalidOperationException("JwtSettings:SecretKey en az 32 bayt olmalı ve güvenli yapılandırmadan sağlanmalıdır.");

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 5. Modüler Monolit Modüllerinin Kaydı
builder.Services.AddAdminModule(builder.Configuration);
builder.Services.AddCatalogModule(builder.Configuration);
builder.Services.AddContentModule(builder.Configuration);
builder.Services.AddCustomerModule(builder.Configuration);
builder.Services.AddPromotions(builder.Configuration);
builder.Services.AddExperience(builder.Configuration);
builder.Services.AddCartModule(builder.Configuration);
builder.Services.AddOrdersModule(builder.Configuration);

var app = builder.Build();

// Global Exception Handler
app.UseExceptionHandler();

// HTTP Pipeline: OpenAPI & Modern Scalar UI Dokümantasyonu
app.MapOpenApi();
app.MapScalarApiReference(); // http://localhost:5000/scalar/v1

app.UseCors("Storefront");

// Kimlik Doğrulama & Yetkilendirme Middleware'leri
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Modüler Monolit: Endpoint Gruplarının Haritalanması
app.MapAdminEndpoints();
app.MapCatalogEndpoints();
app.MapContentEndpoints();
app.MapCustomerEndpoints();
app.MapCartEndpoints();
app.MapOrdersEndpoints();
app.MapShipmentEndpoints();
app.MapSimulatedPaymentEndpoints();
app.MapExperienceEndpoints();

// Kök karşılama endpoint'i
app.MapGet("/", () => Results.Ok(new
{
    Application = "Doğal & Yöresel Gıda E-Ticaret API Host",
    Version = "1.0.0",
    Framework = ".NET 10",
    Modules = new[] { "Admin", "Catalog", "Content", "Customer" },
    Documentation = new
    {
        OpenApiSpec = "/openapi/v1.json",
        InteractiveScalarUi = "/scalar/v1"
    },
    Endpoints = new[]
    {
        "/scalar/v1 (İnteraktif API Test Arayüzü)",
        "/openapi/v1.json",
        "/api/admin/health",
        "/api/admin/users",
        "/api/admin/audit-logs",
        "/api/admin/products",
        "/api/content/home (Ana Sayfa Vitrini)",
        "/api/catalog/categories/tree (Hiyerarşik Kategori Ağacı)",
        "/api/catalog/products (Filtreli Ürün Listesi)",
        "/api/catalog/products/{slug} (Ürün Detay & Varyantlar)",
        "/api/auth/register (Kayıt Ol)",
        "/api/auth/login (Giriş Yap)",
        "/api/customer/profile (Müşteri Profili)",
        "/api/customer/addresses (Adres Yönetimi)",
        "/api/customer/wishlist (Favoriler)"
    }
}));

// Şema değişiklikleri ve tohum verileri başlat
await app.Services.InitializeAdminModuleDatabaseAsync();
await app.Services.InitializeCatalogModuleDatabaseAsync();
await app.Services.InitializeCustomerModuleDatabaseAsync();

app.Run();
