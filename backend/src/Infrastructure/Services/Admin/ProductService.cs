using Application.Common.Interfaces;
using Application.DTOs.Admin;
using Application.Services.Admin;
using Domain.Entities.Admin;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Admin;

public class ProductService : IProductService
{
    private readonly IAdminDbContext _context;

    public ProductService(IAdminDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<ProductDto>> GetProductsAsync(
        int page = 1,
        int pageSize = 10,
        string? search = null,
        string? category = null,
        string? unit = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Products.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLowerInvariant();
            query = query.Where(p =>
                p.Name.ToLower().Contains(s) ||
                (p.SKU != null && p.SKU.ToLower().Contains(s)) ||
                (p.Barcode != null && p.Barcode.Contains(s)) ||
                p.Category.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(unit) && !unit.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.SaleUnit.ToLower() == unit.ToLower());
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(p => p.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => MapToDto(p))
            .ToListAsync(cancellationToken);

        return PaginatedList<ProductDto>.Create(items, totalCount, page, pageSize);
    }

    public async Task<ProductDto?> GetProductByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        return product is null ? null : MapToDto(product);
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductRequest req, CancellationToken cancellationToken = default)
    {
        var status = !string.IsNullOrWhiteSpace(req.Status)
            ? req.Status
            : (req.StockQuantity <= 0 ? "OutOfStock" : (req.StockQuantity <= 5 ? "LowStock" : "Active"));

        var product = new Product(
            name: req.Name.Trim(),
            category: req.Category.Trim(),
            saleUnit: req.SaleUnit.Trim(),
            sellingPrice: req.SellingPrice,
            basePrice: req.BasePrice,
            stockQuantity: req.StockQuantity,
            sku: string.IsNullOrWhiteSpace(req.Sku) ? null : req.Sku.Trim().ToUpperInvariant(),
            barcode: string.IsNullOrWhiteSpace(req.Barcode) ? null : req.Barcode.Trim(),
            status: status,
            imageUrl: req.ImageUrl
        );

        await _context.Products.AddAsync(product, cancellationToken);

        // Denetim Günlüğü Kaydı
        var audit = new AuditLog(
            action: "CreateProduct",
            resource: "Product",
            adminUserId: null,
            details: $"Yeni gıda ürünü tanımlandı: {product.Name} (SKU: {product.SKU ?? "-"}, {product.SellingPrice} TL)"
        );
        await _context.AuditLogs.AddAsync(audit, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(product);
    }

    public async Task<ProductDto?> UpdateProductAsync(Guid id, UpdateProductRequest req, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (product is null) return null;

        var status = !string.IsNullOrWhiteSpace(req.Status)
            ? req.Status
            : (req.StockQuantity <= 0 ? "OutOfStock" : (req.StockQuantity <= 5 ? "LowStock" : "Active"));

        product.Update(
            name: req.Name.Trim(),
            category: req.Category.Trim(),
            saleUnit: req.SaleUnit.Trim(),
            sellingPrice: req.SellingPrice,
            basePrice: req.BasePrice,
            stockQuantity: req.StockQuantity,
            sku: string.IsNullOrWhiteSpace(req.Sku) ? null : req.Sku.Trim().ToUpperInvariant(),
            barcode: string.IsNullOrWhiteSpace(req.Barcode) ? null : req.Barcode.Trim(),
            status: status,
            imageUrl: req.ImageUrl
        );

        var audit = new AuditLog(
            action: "UpdateProduct",
            resource: "Product",
            adminUserId: null,
            details: $"Gıda ürünü güncellendi: {product.Name} (Id: {id})"
        );
        await _context.AuditLogs.AddAsync(audit, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(product);
    }

    public async Task<bool> DeleteProductAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (product is null) return false;

        _context.Products.Remove(product);

        var audit = new AuditLog(
            action: "DeleteProduct",
            resource: "Product",
            adminUserId: null,
            details: $"Gıda ürünü silindi: {product.Name} (SKU: {product.SKU ?? "-"})"
        );
        await _context.AuditLogs.AddAsync(audit, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static ProductDto MapToDto(Product p) => new(
        Id: p.Id,
        Name: p.Name,
        Sku: p.SKU,
        Barcode: p.Barcode,
        Category: p.Category,
        SaleUnit: p.SaleUnit,
        BasePrice: p.BasePrice,
        SellingPrice: p.SellingPrice,
        StockQuantity: p.StockQuantity,
        Status: p.Status,
        ImageUrl: p.ImageUrl,
        CreatedAtUtc: p.CreatedAtUtc,
        UpdatedAtUtc: p.UpdatedAtUtc
    );
}
