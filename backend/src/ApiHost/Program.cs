using Endpoints.Admin;

var builder = WebApplication.CreateBuilder(args);

// 1. OpenAPI & Dokümantasyon
builder.Services.AddOpenApi();

// 2. Global Hata Yakalama (RFC 7807 ProblemDetails Standardı)
builder.Services.AddProblemDetails();

// 3. CORS Politikası (Frontend Monorepo - Vite için)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 4. Modüler Monolit: Admin Modülünün Kaydı
// Not: ApiHost yalnızca Admin.Endpoints üzerinden AddAdminModule çağırır!
builder.Services.AddAdminModule(builder.Configuration);

var app = builder.Build();

// Global Exception Handler
app.UseExceptionHandler();

// HTTP Pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAll");

// Modüler Monolit: Admin Modülü Endpoint'lerinin Haritalanması
app.MapAdminEndpoints();

// Kök karşılama endpoint'i
app.MapGet("/", () => Results.Ok(new
{
    Application = "Modular Monolith API Host",
    Version = "1.0.0",
    Framework = ".NET 10",
    Modules = new[] { "Admin" },
    Endpoints = new[]
    {
        "/openapi/v1.json",
        "/api/admin/health",
        "/api/admin/users",
        "/api/admin/audit-logs"
    }
}));

// Veritabanı başlatma (otomatik tohumlama ve migration kontrolü)
try
{
    await app.Services.InitializeAdminModuleDatabaseAsync();
}
catch (Exception ex)
{
    app.Logger.LogWarning(ex, "Admin veritabanı başlatma sırasında bağlantı kurulamadı.");
}

app.Run();
