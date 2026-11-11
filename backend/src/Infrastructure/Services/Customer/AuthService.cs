using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Application.Common;
using Application.Customer.DTOs;
using Application.Customer.Services;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Services.Customer;

public class AuthService : IAuthService
{
    private readonly CustomerDbContext _db;
    private readonly AdminDbContext _adminDb;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        CustomerDbContext db,
        AdminDbContext adminDb,
        IOptions<JwtSettings> jwtSettings,
        ILogger<AuthService> logger)
    {
        _db = db;
        _adminDb = adminDb;
        _jwtSettings = jwtSettings.Value;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);

        // Misafir kaydı, e-posta sahipliği kanıtlanmadan devralınamaz.
        if (await _db.Customers.AnyAsync(c => c.Email == normalizedEmail, ct))
            throw new InvalidOperationException("Bu e-posta adresi ile kayıt oluşturulamıyor.");

        var customer = Domain.Entities.Customer.Customer.CreateRegistered(
            normalizedEmail, HashPassword(request.Password), request.FirstName, request.LastName, request.Phone, role: "Customer");
        customer.RecordLogin();
        _db.Customers.Add(customer);

        var response = await GenerateAuthResponseAsync(customer, ct);
        await transaction.CommitAsync(ct);
        return response;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var customer = await _db.Customers
            .FirstOrDefaultAsync(c => c.Email == normalizedEmail && !c.IsGuest, ct);

        // Eğer müşteri tablosunda yoksa ancak AdminUsers tablosunda tanımlı bir yönetici ise senkronize et
        if (customer == null)
        {
            var adminUser = await _adminDb.AdminUsers
                .FirstOrDefaultAsync(a => a.Email.ToLower() == normalizedEmail, ct);

            if (adminUser != null)
            {
                if (!adminUser.IsActive)
                    throw new UnauthorizedAccessException("Yönetici hesabınız devre dışı bırakılmıştır.");

                if (!VerifyPassword(request.Password, adminUser.PasswordHash))
                    throw new UnauthorizedAccessException("E-posta veya şifre hatalı.");

                var nameParts = adminUser.FullName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                var firstName = nameParts.Length > 0 ? nameParts[0] : "Admin";
                var lastName = nameParts.Length > 1 ? nameParts[1] : "User";

                customer = Domain.Entities.Customer.Customer.CreateRegistered(
                    email: normalizedEmail,
                    passwordHash: HashPassword(request.Password),
                    firstName: firstName,
                    lastName: lastName,
                    role: "Admin");

                _db.Customers.Add(customer);
                adminUser.RecordLogin();
                await _adminDb.SaveChangesAsync(ct);
            }
        }

        if (customer == null || customer.PasswordHash == null)
            throw new UnauthorizedAccessException("E-posta veya şifre hatalı.");

        if (!customer.IsActive)
            throw new UnauthorizedAccessException("Hesabınız devre dışı bırakılmıştır.");

        if (!VerifyPassword(request.Password, customer.PasswordHash))
            throw new UnauthorizedAccessException("E-posta veya şifre hatalı.");

        customer.RecordLogin();
        await _db.SaveChangesAsync(ct);

        return await GenerateAuthResponseAsync(customer, ct);
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken ct = default)
    {
        var tokenHash = HashRefreshToken(request.RefreshToken);
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);
        var existingToken = await _db.RefreshTokens.AsNoTracking()
            .Include(r => r.Customer)
            .FirstOrDefaultAsync(r => r.Token == tokenHash, ct);

        if (existingToken == null || !existingToken.IsActive || existingToken.Customer == null || !existingToken.Customer.IsActive)
            throw new UnauthorizedAccessException("Geçersiz veya süresi dolmuş refresh token.");

        var customer = existingToken.Customer;
        var newRefreshToken = GenerateRefreshToken();
        var newTokenHash = HashRefreshToken(newRefreshToken);
        var now = DateTime.UtcNow;
        // Aynı token ile eşzamanlı isteklerden yalnızca biri başarılı olabilir.
        var updated = await _db.RefreshTokens
            .Where(r => r.Id == existingToken.Id && r.RevokedAtUtc == null && r.ExpiresAtUtc > now)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(r => r.RevokedAtUtc, now)
                .SetProperty(r => r.ReplacedByToken, newTokenHash), ct);
        if (updated != 1)
            throw new UnauthorizedAccessException("Geçersiz veya süresi dolmuş refresh token.");

        _db.RefreshTokens.Add(new Domain.Entities.Customer.RefreshToken(
            customer.Id, newTokenHash, now.AddDays(_jwtSettings.RefreshTokenExpirationDays)));
        await _db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        var accessToken = GenerateAccessToken(customer);

        return new AuthResponse(
            AccessToken: accessToken,
            RefreshToken: newRefreshToken,
            ExpiresAtUtc: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
            Customer: MapToProfile(customer));
    }

    public async Task LogoutAsync(Guid customerId, string refreshToken, CancellationToken ct = default)
    {
        var tokenHash = HashRefreshToken(refreshToken);
        var token = await _db.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == tokenHash && r.CustomerId == customerId, ct);

        if (token != null && token.IsActive)
        {
            token.Revoke();
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default)
    {
        // E-posta teslimi yapılandırılana kadar token üretilmez veya kaydedilmez.
        await Task.CompletedTask;
    }

    public Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default)
        => Task.FromResult(false);

    public async Task<bool> ChangePasswordAsync(Guid customerId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        var customer = await _db.Customers.FindAsync([customerId], ct);
        if (customer == null || customer.PasswordHash == null)
            return false;

        if (!VerifyPassword(request.CurrentPassword, customer.PasswordHash))
            throw new UnauthorizedAccessException("Mevcut şifre hatalı.");

        customer.ChangePassword(HashPassword(request.NewPassword));
        var activeTokens = await _db.RefreshTokens
            .Where(r => r.CustomerId == customerId && r.RevokedAtUtc == null)
            .ToListAsync(ct);
        foreach (var token in activeTokens)
            token.Revoke();
        await _db.SaveChangesAsync(ct);
        return true;
    }

    // ===== Yardımcı Metodlar =====

    private async Task<AuthResponse> GenerateAuthResponseAsync(Domain.Entities.Customer.Customer customer, CancellationToken ct)
    {
        var accessToken = GenerateAccessToken(customer);
        var refreshTokenValue = GenerateRefreshToken();

        var refreshTokenEntity = new Domain.Entities.Customer.RefreshToken(
            customer.Id,
            HashRefreshToken(refreshTokenValue),
            DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays));

        _db.RefreshTokens.Add(refreshTokenEntity);
        await _db.SaveChangesAsync(ct);

        return new AuthResponse(
            AccessToken: accessToken,
            RefreshToken: refreshTokenValue,
            ExpiresAtUtc: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
            Customer: MapToProfile(customer));
    }

    private string GenerateAccessToken(Domain.Entities.Customer.Customer customer)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var role = string.IsNullOrWhiteSpace(customer.Role) ? "Customer" : customer.Role;

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, customer.Id.ToString()),
            new(ClaimTypes.Email, customer.Email),
            new(ClaimTypes.GivenName, customer.FirstName),
            new(ClaimTypes.Surname, customer.LastName),
            new("is_guest", customer.IsGuest.ToString().ToLowerInvariant()),
            new(ClaimTypes.Role, role)
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string HashRefreshToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private static string GenerateRefreshToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    }

    public static string HashPassword(string password)
    {
        // PBKDF2 ile güvenli şifre hashleme
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations: 100_000,
            HashAlgorithmName.SHA256,
            outputLength: 32);

        // Format: {iterations}.{salt_base64}.{hash_base64}
        return $"100000.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    private static bool VerifyPassword(string password, string storedHash)
    {
        var parts = storedHash.Split('.');
        if (parts.Length == 3)
        {
            var iterations = int.Parse(parts[0]);
            var salt = Convert.FromBase64String(parts[1]);
            var expectedHash = Convert.FromBase64String(parts[2]);

            var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(password),
                salt,
                iterations: iterations,
                HashAlgorithmName.SHA256,
                outputLength: expectedHash.Length);

            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }

        if (parts.Length == 2)
        {
            var salt = Convert.FromBase64String(parts[0]);
            var expectedHash = Convert.FromBase64String(parts[1]);

            var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(password),
                salt,
                iterations: 100_000,
                HashAlgorithmName.SHA256,
                outputLength: expectedHash.Length);

            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }

        return false;
    }

    private static CustomerProfileDto MapToProfile(Domain.Entities.Customer.Customer customer)
    {
        return new CustomerProfileDto(
            Id: customer.Id,
            Email: customer.Email,
            FirstName: customer.FirstName,
            LastName: customer.LastName,
            Phone: customer.Phone,
            IsGuest: customer.IsGuest,
            CreatedAtUtc: customer.CreatedAtUtc,
            LastLoginAtUtc: customer.LastLoginAtUtc,
            Role: string.IsNullOrWhiteSpace(customer.Role) ? "Customer" : customer.Role);
    }
}
