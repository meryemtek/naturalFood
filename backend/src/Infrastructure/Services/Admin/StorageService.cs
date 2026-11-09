using Application.DTOs.Admin;
using Application.Services.Admin;
using Domain.Entities.Admin;
using Domain.Entities.Catalog;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Admin;

public class StorageService : IStorageService
{
    private readonly CatalogDbContext _catalogDb;
    private readonly AdminDbContext _adminDb;

    public StorageService(CatalogDbContext catalogDb, AdminDbContext adminDb)
    {
        _catalogDb = catalogDb;
        _adminDb = adminDb;
    }

    public async Task<IReadOnlyList<StorageConditionDto>> GetStorageConditionsAsync(CancellationToken cancellationToken = default)
    {
        var conditions = await _catalogDb.StorageConditions
            .AsNoTracking()
            .Include(sc => sc.Products)
            .OrderBy(sc => sc.MinTemperature)
            .ToListAsync(cancellationToken);

        return conditions.Select(sc => new StorageConditionDto(
            Id: sc.Id,
            Name: sc.Name,
            MinTemperature: sc.MinTemperature,
            MaxTemperature: sc.MaxTemperature,
            MaxHumidity: sc.MaxHumidity,
            RequiresColdChain: sc.RequiresColdChain,
            DefaultShelfZone: sc.DefaultShelfZone,
            Description: sc.Description,
            ProductCount: sc.Products.Count,
            SampleProducts: sc.Products.Take(5).Select(p => p.Name).ToList()
        )).ToList();
    }

    public async Task<StorageConditionDto> CreateStorageConditionAsync(CreateStorageConditionRequest req, CancellationToken cancellationToken = default)
    {
        var sc = new StorageCondition(
            name: req.Name.Trim(),
            minTemperature: req.MinTemperature,
            maxTemperature: req.MaxTemperature,
            maxHumidity: req.MaxHumidity,
            requiresColdChain: req.RequiresColdChain,
            defaultShelfZone: req.DefaultShelfZone.Trim(),
            description: req.Description?.Trim()
        );

        _catalogDb.StorageConditions.Add(sc);
        await _catalogDb.SaveChangesAsync(cancellationToken);

        var audit = new AuditLog(
            action: "StorageConditionCreated",
            resource: "Catalog.StorageCondition",
            adminUserId: null,
            details: $"Yeni saklama koşulu oluşturuldu: {sc.Name} ({sc.MinTemperature}°C - {sc.MaxTemperature}°C)"
        );
        _adminDb.AuditLogs.Add(audit);
        await _adminDb.SaveChangesAsync(cancellationToken);

        return new StorageConditionDto(
            Id: sc.Id,
            Name: sc.Name,
            MinTemperature: sc.MinTemperature,
            MaxTemperature: sc.MaxTemperature,
            MaxHumidity: sc.MaxHumidity,
            RequiresColdChain: sc.RequiresColdChain,
            DefaultShelfZone: sc.DefaultShelfZone,
            Description: sc.Description,
            ProductCount: 0,
            SampleProducts: new List<string>()
        );
    }

    public async Task<ProductStorageItemDto?> UpdateProductStorageAsync(Guid productId, UpdateProductStorageRequest req, CancellationToken cancellationToken = default)
    {
        var product = await _catalogDb.Products
            .Include(p => p.Category)
            .Include(p => p.StorageCondition)
            .FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);

        if (product == null)
            return null;

        var prevConditionName = product.StorageCondition?.Name ?? "Tanımsız";
        var prevShelf = product.ShelfLocation ?? "Tanımsız";

        product.UpdateStorage(req.StorageConditionId, req.ShelfLocation?.Trim());
        await _catalogDb.SaveChangesAsync(cancellationToken);

        // İlişkili saklama koşulunu yeniden yükle
        if (req.StorageConditionId.HasValue)
        {
            await _catalogDb.Entry(product).Reference(p => p.StorageCondition).LoadAsync(cancellationToken);
        }

        var newConditionName = product.StorageCondition?.Name ?? "Tanımsız";
        var newShelf = product.ShelfLocation ?? "Tanımsız";

        // Denetim Günlüğü Kaydı: Action = 'ProductStorageUpdated'
        var audit = new AuditLog(
            action: "ProductStorageUpdated",
            resource: "Catalog.Product",
            adminUserId: null,
            details: $"Ürün saklama koşulu güncellendi: {product.Name}. Koşul: {prevConditionName} -> {newConditionName}, Raf: {prevShelf} -> {newShelf}"
        );
        _adminDb.AuditLogs.Add(audit);
        await _adminDb.SaveChangesAsync(cancellationToken);

        return MapToStorageItemDto(product);
    }

    public async Task<IReadOnlyList<ProductStorageItemDto>> GetProductsStorageAsync(Guid? conditionId = null, string? search = null, CancellationToken cancellationToken = default)
    {
        var query = _catalogDb.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.StorageCondition)
            .AsQueryable();

        if (conditionId.HasValue && conditionId.Value != Guid.Empty)
        {
            query = query.Where(p => p.StorageConditionId == conditionId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || p.Sku.ToLower().Contains(s));
        }

        var products = await query.OrderBy(p => p.Name).ToListAsync(cancellationToken);
        return products.Select(MapToStorageItemDto).ToList();
    }

    private static ProductStorageItemDto MapToStorageItemDto(Product p)
    {
        return new ProductStorageItemDto(
            Id: p.Id,
            Name: p.Name,
            Sku: p.Sku,
            Category: p.Category?.Name ?? "Genel",
            StorageConditionId: p.StorageConditionId,
            StorageConditionName: p.StorageCondition?.Name,
            MinTemperature: p.StorageCondition?.MinTemperature,
            MaxTemperature: p.StorageCondition?.MaxTemperature,
            RequiresColdChain: p.StorageCondition?.RequiresColdChain ?? false,
            ShelfLocation: p.ShelfLocation ?? p.StorageCondition?.DefaultShelfZone,
            StockQuantity: p.StockQuantity
        );
    }
}
