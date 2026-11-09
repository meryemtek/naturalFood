using Application.Common;
using Application.Common.Interfaces;
using Application.DTOs.Admin;
using Application.Services.Admin;
using Domain.Entities.Admin;
using Domain.Entities.Catalog;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Admin;

/// <summary>
/// Admin Gelişmiş Ürün Tanımlama Servisi
/// Doğrudan çekirdek Catalog modülünün Product entity'sini ve CatalogDbContext'ini kullanır.
/// </summary>
public class ProductService : IProductService
{
    private readonly CatalogDbContext _catalogDb;
    private readonly IAdminDbContext _adminDb;

    public ProductService(CatalogDbContext catalogDb, IAdminDbContext adminDb)
    {
        _catalogDb = catalogDb;
        _adminDb = adminDb;
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
                (p.ShortDescription != null && p.ShortDescription.ToLower().Contains(s)) ||
                (p.Category != null && p.Category.Name.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var cLower = category.Trim().ToLower();
            query = query.Where(p => p.Category != null && (p.Category.Name.ToLower() == cLower || p.Category.Slug.ToLower() == cLower));
        }

        if (!string.IsNullOrWhiteSpace(unit) && !unit.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var uLower = unit.Trim().ToLower();
            query = query.Where(p => p.UnitInfo.ToLower().Contains(uLower));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(p => p.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtoList = items.Select(MapToDto).ToList();

        return PaginatedList<ProductDto>.Create(dtoList, totalCount, page, pageSize);
    }

    public async Task<ProductDto?> GetProductByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var product = await _catalogDb.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        return product is null ? null : MapToDto(product);
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductRequest req, CancellationToken cancellationToken = default)
    {
        var catName = string.IsNullOrWhiteSpace(req.Category) ? "Genel" : req.Category.Trim();
        var category = await _catalogDb.Categories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == catName.ToLower(), cancellationToken);

        if (category == null)
        {
            var catSlug = SlugHelper.GenerateSlug(catName);
            if (await _catalogDb.Categories.AnyAsync(c => c.Slug == catSlug, cancellationToken))
                catSlug = $"{catSlug}-{Guid.NewGuid().ToString("n")[..4]}";

            category = new Category(
                name: catName,
                slug: catSlug,
                description: $"{catName} kategorisi",
                imageUrl: null,
                parentCategoryId: null,
                displayOrder: 10,
                isActive: true
            );
            _catalogDb.Categories.Add(category);
            await _catalogDb.SaveChangesAsync(cancellationToken);
        }

        var slug = SlugHelper.GenerateSlug(req.Name);
        if (await _catalogDb.Products.AnyAsync(p => p.Slug == slug, cancellationToken))
            slug = $"{slug}-{Guid.NewGuid().ToString("n")[..4]}";

        var sku = !string.IsNullOrWhiteSpace(req.Sku)
            ? req.Sku.Trim().ToUpperInvariant()
            : $"SKU-{Guid.NewGuid().ToString("n")[..8].ToUpperInvariant()}";

        if (await _catalogDb.Products.AnyAsync(p => p.Sku == sku, cancellationToken))
            sku = $"{sku}-{Guid.NewGuid().ToString("n")[..4].ToUpperInvariant()}";

        var basePrice = req.SellingPrice > 0 ? req.SellingPrice : req.BasePrice;
        decimal? discountPrice = (req.BasePrice > 0 && req.BasePrice < basePrice) ? req.BasePrice : null;
        var isActive = req.Status != "OutOfStock" && req.Status != "Draft";
        var stockQuantity = (int)Math.Max(0, req.StockQuantity);
        var unitInfo = !string.IsNullOrWhiteSpace(req.SaleUnit) ? req.SaleUnit.Trim() : "Adet";

        var product = new Product(
            name: req.Name.Trim(),
            slug: slug,
            shortDescription: $"{req.Name.Trim()} - Doğal ve taze yöresel ürün.",
            description: null,
            categoryId: category.Id,
            basePrice: basePrice,
            discountPrice: discountPrice,
            stockQuantity: stockQuantity,
            sku: sku,
            unitInfo: unitInfo,
            isActive: isActive
        );

        if (!string.IsNullOrWhiteSpace(req.ImageUrl))
        {
            product.Images.Add(new ProductImage(product.Id, req.ImageUrl.Trim(), product.Name, 0, true));
        }

        _catalogDb.Products.Add(product);
        await _catalogDb.SaveChangesAsync(cancellationToken);

        // Denetim Günlüğü Kaydı
        var audit = new AuditLog(
            action: "CreateProduct",
            resource: "Catalog.Product",
            adminUserId: null,
            details: $"Admin paneli üzerinden yeni gıda ürünü tanımlandı: {product.Name} (SKU: {product.Sku}, Fiyat: {product.BasePrice} TL, Kategori: {category.Name})"
        );
        _adminDb.AuditLogs.Add(audit);
        await _adminDb.SaveChangesAsync(cancellationToken);

        await _catalogDb.Entry(product).Reference(p => p.Category).LoadAsync(cancellationToken);
        await _catalogDb.Entry(product).Collection(p => p.Images).LoadAsync(cancellationToken);

        return MapToDto(product);
    }

    public async Task<ProductDto?> UpdateProductAsync(Guid id, UpdateProductRequest req, CancellationToken cancellationToken = default)
    {
        var product = await _catalogDb.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null) return null;

        var catName = string.IsNullOrWhiteSpace(req.Category) ? (product.Category?.Name ?? "Genel") : req.Category.Trim();
        var category = await _catalogDb.Categories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == catName.ToLower(), cancellationToken);

        if (category == null)
        {
            var catSlug = SlugHelper.GenerateSlug(catName);
            if (await _catalogDb.Categories.AnyAsync(c => c.Slug == catSlug, cancellationToken))
                catSlug = $"{catSlug}-{Guid.NewGuid().ToString("n")[..4]}";

            category = new Category(
                name: catName,
                slug: catSlug,
                description: $"{catName} kategorisi",
                imageUrl: null,
                parentCategoryId: null,
                displayOrder: 10,
                isActive: true
            );
            _catalogDb.Categories.Add(category);
            await _catalogDb.SaveChangesAsync(cancellationToken);
        }

        var slug = SlugHelper.GenerateSlug(req.Name);
        if (await _catalogDb.Products.AnyAsync(p => p.Slug == slug && p.Id != id, cancellationToken))
            slug = $"{slug}-{Guid.NewGuid().ToString("n")[..4]}";

        var sku = !string.IsNullOrWhiteSpace(req.Sku) ? req.Sku.Trim().ToUpperInvariant() : product.Sku;
        if (await _catalogDb.Products.AnyAsync(p => p.Sku == sku && p.Id != id, cancellationToken))
            sku = product.Sku;

        var basePrice = req.SellingPrice > 0 ? req.SellingPrice : product.BasePrice;
        decimal? discountPrice = (req.BasePrice > 0 && req.BasePrice < basePrice) ? req.BasePrice : product.DiscountPrice;
        var isActive = req.Status != "OutOfStock" && req.Status != "Draft";
        var stockQuantity = (int)Math.Max(0, req.StockQuantity);
        var unitInfo = !string.IsNullOrWhiteSpace(req.SaleUnit) ? req.SaleUnit.Trim() : product.UnitInfo;

        product.Update(
            name: req.Name.Trim(),
            slug: slug,
            shortDescription: product.ShortDescription,
            description: product.Description,
            categoryId: category.Id,
            basePrice: basePrice,
            discountPrice: discountPrice,
            stockQuantity: stockQuantity,
            sku: sku,
            unitInfo: unitInfo,
            ingredients: product.Ingredients,
            allergens: product.Allergens,
            origin: product.Origin,
            storageConditions: product.StorageConditions,
            shelfLife: product.ShelfLife,
            isBestSeller: product.IsBestSeller,
            isNew: product.IsNew,
            isFeatured: product.IsFeatured,
            isSeasonal: product.IsSeasonal,
            isActive: isActive
        );

        if (!string.IsNullOrWhiteSpace(req.ImageUrl))
        {
            product.Images.Clear();
            product.Images.Add(new ProductImage(product.Id, req.ImageUrl.Trim(), product.Name, 0, true));
        }

        await _catalogDb.SaveChangesAsync(cancellationToken);

        // Denetim Günlüğü Kaydı
        var audit = new AuditLog(
            action: "UpdateProduct",
            resource: "Catalog.Product",
            adminUserId: null,
            details: $"Ürün güncellendi: {product.Name} (ID: {product.Id}, Fiyat: {product.BasePrice} TL)"
        );
        _adminDb.AuditLogs.Add(audit);
        await _adminDb.SaveChangesAsync(cancellationToken);

        await _catalogDb.Entry(product).Reference(p => p.Category).LoadAsync(cancellationToken);
        await _catalogDb.Entry(product).Collection(p => p.Images).LoadAsync(cancellationToken);

        return MapToDto(product);
    }

    public async Task<bool> DeleteProductAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var product = await _catalogDb.Products
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null) return false;

        var productName = product.Name;

        _catalogDb.Products.Remove(product);
        await _catalogDb.SaveChangesAsync(cancellationToken);

        // Denetim Günlüğü Kaydı
        var audit = new AuditLog(
            action: "DeleteProduct",
            resource: "Catalog.Product",
            adminUserId: null,
            details: $"Ürün silindi: {productName} (ID: {id})"
        );
        _adminDb.AuditLogs.Add(audit);
        await _adminDb.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static ProductDto MapToDto(Product p)
    {
        var status = !p.IsActive
            ? "OutOfStock"
            : (p.StockQuantity <= 0 ? "OutOfStock" : (p.StockQuantity <= 5 ? "LowStock" : "Active"));

        var imageUrl = p.Images.FirstOrDefault(i => i.IsMain)?.ImageUrl
            ?? p.Images.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl;

        return new ProductDto(
            Id: p.Id,
            Name: p.Name,
            Sku: p.Sku,
            Barcode: null,
            Category: p.Category?.Name ?? "Genel",
            SaleUnit: p.UnitInfo,
            BasePrice: p.BasePrice,
            SellingPrice: p.DiscountPrice ?? p.BasePrice,
            StockQuantity: p.StockQuantity,
            Status: status,
            ImageUrl: imageUrl,
            CreatedAtUtc: p.CreatedAtUtc,
            UpdatedAtUtc: p.UpdatedAtUtc
        );
    }
}
