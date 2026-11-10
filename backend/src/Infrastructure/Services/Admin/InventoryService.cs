using Application.Common.Interfaces;
using Application.DTOs.Admin;
using Application.Services.Admin;
using Domain.Entities.Admin;
using Domain.Entities.Catalog;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Admin;

/// <summary>
/// Admin Envanter ve Stok Yönetim Servisi
/// catalog.Products tablosu ve admin.AuditLogs denetim izleme sistemini kullanır.
/// </summary>
public class InventoryService : IInventoryService
{
    private readonly CatalogDbContext _catalogDb;
    private readonly IAdminDbContext _adminDb;

    public InventoryService(CatalogDbContext catalogDb, IAdminDbContext adminDb)
    {
        _catalogDb = catalogDb;
        _adminDb = adminDb;
    }

    public async Task<PaginatedList<InventoryItemDto>> GetInventoryAsync(
        int page = 1,
        int pageSize = 50,
        string? search = null,
        string? category = null,
        bool? criticalOnly = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _catalogDb.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Images)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(s) ||
                p.Sku.ToLower().Contains(s) ||
                (p.Category != null && p.Category.Name.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var cLower = category.Trim().ToLower();
            query = query.Where(p => p.Category != null && (p.Category.Name.ToLower() == cLower || p.Category.Slug.ToLower() == cLower));
        }

        if (criticalOnly == true)
        {
            query = query.Where(p => p.StockQuantity <= 5);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(p => p.StockQuantity) // Kritik stoktakiler öncelikli
            .ThenByDescending(p => p.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtoList = items.Select(MapToInventoryDto).ToList();

        return PaginatedList<InventoryItemDto>.Create(dtoList, totalCount, page, pageSize);
    }

    public async Task<InventoryItemDto?> UpdateStockAsync(
        Guid id,
        UpdateStockRequest req,
        CancellationToken cancellationToken = default)
    {
        var product = await _catalogDb.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null) return null;

        int oldStock = product.StockQuantity;
        int targetStock = oldStock;

        if (req.NewQuantity.HasValue)
        {
            targetStock = Math.Max(0, req.NewQuantity.Value);
        }
        else if (req.Delta.HasValue)
        {
            targetStock = Math.Max(0, oldStock + req.Delta.Value);
        }

        // Set stock on entity
        product.SetStock(targetStock);

        await _catalogDb.SaveChangesAsync(cancellationToken);

        // Denetim Günlüğü Kaydı (admin.AuditLogs)
        int diff = targetStock - oldStock;
        string diffStr = diff >= 0 ? $"+{diff}" : $"{diff}";
        string reason = !string.IsNullOrWhiteSpace(req.Reason) ? req.Reason.Trim() : "Manuel Stok Hızlı Güncelleme";

        var audit = new AuditLog(
            action: "StockUpdated",
            resource: "Catalog.Product",
            adminUserId: null,
            details: $"Ürün stoğu güncellendi: {product.Name} (SKU: {product.Sku}). Önceki: {oldStock}, Yeni: {targetStock} (Fark: {diffStr}). Neden: {reason}"
        );

        _adminDb.AuditLogs.Add(audit);
        await _adminDb.SaveChangesAsync(cancellationToken);

        return MapToInventoryDto(product);
    }

    private static InventoryItemDto MapToInventoryDto(Product p)
    {
        var status = p.StockQuantity <= 0
            ? "OutOfStock"
            : (p.StockQuantity <= 5 ? "LowStock" : "InStock");

        var imageUrl = p.Images.FirstOrDefault(i => i.IsMain)?.ImageUrl
            ?? p.Images.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl;

        return new InventoryItemDto(
            Id: p.Id,
            Name: p.Name,
            Sku: p.Sku,
            Category: p.Category?.Name ?? "Genel",
            UnitPrice: p.DiscountPrice ?? p.BasePrice,
            StockQuantity: p.StockQuantity,
            UnitInfo: p.UnitInfo,
            Status: status,
            ImageUrl: imageUrl,
            LastUpdatedUtc: p.UpdatedAtUtc ?? p.CreatedAtUtc
        );
    }
}
