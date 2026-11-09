using Application.DTOs.Admin;
using Application.Services.Admin;
using Domain.Entities.Admin;
using Domain.Entities.Catalog;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Admin;

public class LotService : ILotService
{
    private readonly CatalogDbContext _catalogDb;
    private readonly AdminDbContext _adminDb;

    public LotService(CatalogDbContext catalogDb, AdminDbContext adminDb)
    {
        _catalogDb = catalogDb;
        _adminDb = adminDb;
    }

    public async Task<PaginatedLotsResponse> GetLotsAsync(
        Guid? productId = null,
        int? expiringWithinDays = null,
        string? status = null,
        string? search = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var p = Math.Max(1, page);
        var ps = Math.Clamp(pageSize, 1, 100);

        var query = _catalogDb.ProductLots
            .AsNoTracking()
            .Include(pl => pl.Product)
            .AsQueryable();

        // 1. Filtrelemeler
        if (productId.HasValue && productId.Value != Guid.Empty)
        {
            query = query.Where(pl => pl.ProductId == productId.Value);
        }

        if (expiringWithinDays.HasValue && expiringWithinDays.Value > 0)
        {
            var maxExpiry = now.AddDays(expiringWithinDays.Value);
            query = query.Where(pl => pl.ExpiryDate <= maxExpiry && pl.Status != "WrittenOff");
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "all")
        {
            if (status.Equals("Expired", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(pl => pl.ExpiryDate <= now && pl.Status != "WrittenOff");
            }
            else if (status.Equals("NearExpiry", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(pl => pl.ExpiryDate > now && pl.ExpiryDate <= now.AddDays(15) && pl.Status != "WrittenOff");
            }
            else
            {
                query = query.Where(pl => pl.Status == status);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(pl =>
                pl.LotNumber.ToLower().Contains(s) ||
                (pl.Product != null && pl.Product.Name.ToLower().Contains(s)) ||
                (pl.Product != null && pl.Product.Sku.ToLower().Contains(s)));
        }

        // Metrikler (Tüm filtre dışı aktif partiler genel istatistiği)
        var allLots = await _catalogDb.ProductLots.AsNoTracking().ToListAsync(cancellationToken);
        var metrics = new LotSummaryMetricsDto(
            TotalLots: allLots.Count,
            ActiveLots: allLots.Count(x => x.Status == "Active" && x.ExpiryDate > now),
            NearExpiryCount: allLots.Count(x => x.Status != "WrittenOff" && (x.ExpiryDate - now).TotalDays <= 15 && (x.ExpiryDate - now).TotalDays > 0),
            CriticalCount: allLots.Count(x => x.Status != "WrittenOff" && (x.ExpiryDate - now).TotalDays <= 7 && (x.ExpiryDate - now).TotalDays > 0),
            ExpiredCount: allLots.Count(x => x.Status != "WrittenOff" && x.ExpiryDate <= now),
            WrittenOffCount: allLots.Count(x => x.Status == "WrittenOff")
        );

        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalCount / (double)ps);

        // FIFO: En erken son tüketim tarihli olan en üstte
        var rawItems = await query
            .OrderBy(pl => pl.ExpiryDate)
            .Skip((p - 1) * ps)
            .Take(ps)
            .ToListAsync(cancellationToken);

        var items = rawItems.Select(pl => MapToDto(pl, now)).ToList();

        return new PaginatedLotsResponse(
            Items: items,
            TotalCount: totalCount,
            Page: p,
            PageSize: ps,
            TotalPages: totalPages,
            Metrics: metrics
        );
    }

    public async Task<ProductLotDto> CreateLotAsync(CreateLotRequest req, CancellationToken cancellationToken = default)
    {
        var product = await _catalogDb.Products
            .FirstOrDefaultAsync(p => p.Id == req.ProductId, cancellationToken);

        if (product == null)
            throw new InvalidOperationException($"'{req.ProductId}' ID'li ürün bulunamadı.");

        var lotNumber = !string.IsNullOrWhiteSpace(req.LotNumber)
            ? req.LotNumber.Trim().ToUpperInvariant()
            : $"LOT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("n")[..4].ToUpperInvariant()}";

        var lot = new ProductLot(
            productId: product.Id,
            lotNumber: lotNumber,
            productionDate: req.ProductionDate,
            expiryDate: req.ExpiryDate,
            quantity: Math.Max(0, req.Quantity),
            status: req.Status ?? "Active"
        );

        _catalogDb.ProductLots.Add(lot);

        // Parti eklendiğinde bağlı ürünün catalog.Products.StockQuantity miktarını otomatik güncelle
        if (req.Quantity > 0)
        {
            product.AdjustStock(req.Quantity);
        }

        await _catalogDb.SaveChangesAsync(cancellationToken);

        // Denetim Günlüğü Kaydı (AuditLog)
        var audit = new AuditLog(
            action: "ProductLotCreated",
            resource: "Catalog.ProductLot",
            adminUserId: null,
            details: $"Yeni parti eklendi: Lot {lot.LotNumber}, Ürün: {product.Name}, Parti Miktarı: +{lot.Quantity}, Yeni Toplam Ürün Stoğu: {product.StockQuantity}"
        );
        _adminDb.AuditLogs.Add(audit);
        await _adminDb.SaveChangesAsync(cancellationToken);

        lot = await _catalogDb.ProductLots
            .Include(pl => pl.Product)
            .FirstAsync(pl => pl.Id == lot.Id, cancellationToken);

        return MapToDto(lot, DateTime.UtcNow);
    }

    public async Task<ProductLotDto?> UpdateLotStatusAsync(Guid id, string status, CancellationToken cancellationToken = default)
    {
        var lot = await _catalogDb.ProductLots
            .Include(pl => pl.Product)
            .FirstOrDefaultAsync(pl => pl.Id == id, cancellationToken);

        if (lot == null)
            return null;

        var previousStatus = lot.Status;
        var newStatus = string.IsNullOrWhiteSpace(status) ? "Active" : status.Trim();

        // Eğer parti fire/imha edilirse (WrittenOff) ve daha önce edilmemişse, ürün stoğunu parti miktarı kadar düşür
        if (newStatus.Equals("WrittenOff", StringComparison.OrdinalIgnoreCase) &&
            !previousStatus.Equals("WrittenOff", StringComparison.OrdinalIgnoreCase) &&
            lot.Product != null && lot.Quantity > 0)
        {
            var reduceStock = Math.Min(lot.Quantity, lot.Product.StockQuantity);
            lot.Product.AdjustStock(-reduceStock);
        }

        lot.UpdateStatus(newStatus);
        await _catalogDb.SaveChangesAsync(cancellationToken);

        // Denetim Günlüğü Kaydı
        var audit = new AuditLog(
            action: "ProductLotStatusUpdated",
            resource: "Catalog.ProductLot",
            adminUserId: null,
            details: $"Parti durumu güncellendi: Lot {lot.LotNumber} ({previousStatus} -> {newStatus}), Ürün: {lot.Product?.Name ?? lot.ProductId.ToString()}"
        );
        _adminDb.AuditLogs.Add(audit);
        await _adminDb.SaveChangesAsync(cancellationToken);

        return MapToDto(lot, DateTime.UtcNow);
    }

    private static ProductLotDto MapToDto(ProductLot pl, DateTime now)
    {
        var daysLeft = (int)Math.Ceiling((pl.ExpiryDate.Date - now.Date).TotalDays);

        string autoDiscount;
        if (pl.Status.Equals("WrittenOff", StringComparison.OrdinalIgnoreCase))
        {
            autoDiscount = "İmha / Fire (Satış Dışı)";
        }
        else if (daysLeft <= 0)
        {
            autoDiscount = "Satış Durduruldu (Tarihi Geçti)";
        }
        else if (daysLeft <= 2)
        {
            autoDiscount = "Karantina / Aşevi Çıkışı";
        }
        else if (daysLeft <= 7)
        {
            autoDiscount = "%30 Flaş İndirim";
        }
        else if (daysLeft <= 15)
        {
            autoDiscount = "%15 Erken SKT İndirimi";
        }
        else
        {
            autoDiscount = "Normal Fiyat";
        }

        string calculatedStatus;
        if (pl.Status.Equals("WrittenOff", StringComparison.OrdinalIgnoreCase))
        {
            calculatedStatus = "WrittenOff";
        }
        else if (daysLeft <= 0)
        {
            calculatedStatus = "Expired";
        }
        else if (daysLeft <= 7 || pl.Status.Equals("NearExpiry", StringComparison.OrdinalIgnoreCase))
        {
            calculatedStatus = "NearExpiry";
        }
        else
        {
            calculatedStatus = pl.Status;
        }

        return new ProductLotDto(
            Id: pl.Id,
            ProductId: pl.ProductId,
            ProductName: pl.Product?.Name ?? "Bilinmeyen Ürün",
            ProductSku: pl.Product?.Sku,
            LotNumber: pl.LotNumber,
            ProductionDate: pl.ProductionDate,
            ExpiryDate: pl.ExpiryDate,
            Quantity: pl.Quantity,
            DaysLeft: daysLeft,
            Status: calculatedStatus,
            AutoDiscount: autoDiscount,
            CreatedAtUtc: pl.CreatedAtUtc
        );
    }
}
