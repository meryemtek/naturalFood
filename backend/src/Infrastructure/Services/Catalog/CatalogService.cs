using Application.Catalog.DTOs;
using Application.Catalog.Services;
using Application.Common;
using Domain.Entities.Catalog;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Catalog;

public class CatalogService : ICatalogService
{
    private readonly CatalogDbContext _db;

    public CatalogService(CatalogDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<CategoryTreeDto>> GetCategoryTreeAsync(CancellationToken cancellationToken = default)
    {
        var allCategories = await _db.Categories
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);

        // Kök kategoriler (ParentCategoryId == null)
        var roots = allCategories.Where(c => c.ParentCategoryId == null).ToList();

        return roots.Select(r => BuildTree(r, allCategories)).ToList();
    }

    private static CategoryTreeDto BuildTree(Category current, List<Category> all)
    {
        var subs = all
            .Where(c => c.ParentCategoryId == current.Id)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => BuildTree(c, all))
            .ToList();

        return new CategoryTreeDto(
            current.Id,
            current.Name,
            current.Slug,
            current.Description,
            current.ImageUrl,
            current.DisplayOrder,
            current.IsActive,
            subs);
    }

    public async Task<IReadOnlyList<CategoryDto>> GetAllCategoriesAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _db.Categories.AsNoTracking();

        if (!includeInactive)
            query = query.Where(c => c.IsActive);

        return await query
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryDto(
                c.Id,
                c.Name,
                c.Slug,
                c.Description,
                c.ImageUrl,
                c.ParentCategoryId,
                c.DisplayOrder,
                c.IsActive,
                c.Products.Count(p => p.IsActive)))
            .ToListAsync(cancellationToken);
    }

    public async Task<CategoryDto?> GetCategoryBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        return await _db.Categories
            .AsNoTracking()
            .Where(c => c.Slug == slug && c.IsActive)
            .Select(c => new CategoryDto(
                c.Id,
                c.Name,
                c.Slug,
                c.Description,
                c.ImageUrl,
                c.ParentCategoryId,
                c.DisplayOrder,
                c.IsActive,
                c.Products.Count(p => p.IsActive)))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<CategoryDto?> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _db.Categories
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CategoryDto(
                c.Id,
                c.Name,
                c.Slug,
                c.Description,
                c.ImageUrl,
                c.ParentCategoryId,
                c.DisplayOrder,
                c.IsActive,
                c.Products.Count(p => p.IsActive)))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<PagedResult<ProductDto>> GetProductsAsync(ProductListFilter filter, CancellationToken cancellationToken = default)
    {
        var query = _db.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Where(p => p.IsActive);

        // Etkin kategoriler arasında seçilen düğüm ve tüm alt dalları kapsa.
        if (filter.CategoryId.HasValue || !string.IsNullOrWhiteSpace(filter.CategorySlug))
        {
            var categories = await _db.Categories.AsNoTracking().Where(c => c.IsActive)
                .Select(c => new { c.Id, c.ParentCategoryId, c.Slug }).ToListAsync(cancellationToken);
            var selected = filter.CategoryId.HasValue
                ? categories.FirstOrDefault(c => c.Id == filter.CategoryId.Value)
                : categories.FirstOrDefault(c => c.Slug == filter.CategorySlug);
            var ids = new HashSet<Guid>();
            if (selected != null)
            {
                var pending = new Queue<Guid>();
                pending.Enqueue(selected.Id);
                while (pending.TryDequeue(out var id))
                {
                    if (!ids.Add(id)) continue;
                    foreach (var child in categories.Where(c => c.ParentCategoryId == id)) pending.Enqueue(child.Id);
                }
            }
            query = query.Where(p => ids.Contains(p.CategoryId));
        }

        // Arama (İsim, Kısa Açıklama, Menşei)
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(search) ||
                p.ShortDescription.ToLower().Contains(search) ||
                (p.Origin != null && p.Origin.ToLower().Contains(search)));
        }

        // Fiyat aralığı
        if (filter.MinPrice.HasValue)
            query = query.Where(p => (p.Variants.Where(v => v.IsActive).Select(v => (decimal?)(v.DiscountPrice ?? v.Price)).Min() ?? p.DiscountPrice ?? p.BasePrice) >= filter.MinPrice.Value);

        if (filter.MaxPrice.HasValue)
            query = query.Where(p => (p.Variants.Where(v => v.IsActive).Select(v => (decimal?)(v.DiscountPrice ?? v.Price)).Min() ?? p.DiscountPrice ?? p.BasePrice) <= filter.MaxPrice.Value);

        // Rozet filtreleri
        if (filter.IsBestSeller.HasValue)
            query = query.Where(p => p.IsBestSeller == filter.IsBestSeller.Value);

        if (filter.IsNew.HasValue)
            query = query.Where(p => p.IsNew == filter.IsNew.Value);

        if (filter.IsFeatured.HasValue)
            query = query.Where(p => p.IsFeatured == filter.IsFeatured.Value);

        if (filter.IsSeasonal.HasValue)
            query = query.Where(p => p.IsSeasonal == filter.IsSeasonal.Value);

        if (filter.IsDiscounted == true)
            query = query.Where(p => p.Variants.Any(v => v.IsActive && v.DiscountPrice.HasValue && v.DiscountPrice < v.Price) || (!p.Variants.Any(v => v.IsActive) && p.DiscountPrice.HasValue && p.DiscountPrice < p.BasePrice));

        // Sıralama
        query = filter.SortBy?.ToLowerInvariant() switch
        {
            "price_asc" => query.OrderBy(p => (p.Variants.Where(v => v.IsActive).Select(v => (decimal?)(v.DiscountPrice ?? v.Price)).Min() ?? p.DiscountPrice ?? p.BasePrice)),
            "price_desc" => query.OrderByDescending(p => (p.Variants.Where(v => v.IsActive).Select(v => (decimal?)(v.DiscountPrice ?? v.Price)).Min() ?? p.DiscountPrice ?? p.BasePrice)),
            "newest" => query.OrderByDescending(p => p.CreatedAtUtc),
            "bestselling" => query.OrderByDescending(p => p.IsBestSeller).ThenByDescending(p => p.CreatedAtUtc),
            _ => query.OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.CreatedAtUtc)
        };
        query = ((IOrderedQueryable<Product>)query).ThenBy(p => p.Id);

        var totalCount = await query.CountAsync(cancellationToken);

        var pageIndex = Math.Max(1, filter.PageIndex);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductDto(
                p.Id,
                p.Name,
                p.Slug,
                p.ShortDescription,
                p.CategoryId,
                p.Category != null ? p.Category.Name : string.Empty,
                p.Category != null ? p.Category.Slug : string.Empty,
                p.BasePrice,
                p.DiscountPrice,
                p.StockQuantity,
                p.Sku,
                p.UnitInfo,
                p.Images.Where(i => i.IsMain).Select(i => i.ImageUrl).FirstOrDefault() ??
                    p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault(),
                p.IsBestSeller,
                p.IsNew,
                p.IsFeatured,
                p.IsSeasonal,
                p.IsActive,
                p.Variants.Count(v => v.IsActive)))
            .ToListAsync(cancellationToken);

        return new PagedResult<ProductDto>(items, totalCount, pageIndex, pageSize);
    }

    public async Task<ProductDetailDto?> GetProductBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var product = await _db.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Include(p => p.Attributes)
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive, cancellationToken);

        return product == null ? null : MapToDetailDto(product);
    }

    public async Task<ProductDetailDto?> GetProductByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var product = await _db.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Include(p => p.Attributes)
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive, cancellationToken);

        return product == null ? null : MapToDetailDto(product);
    }

    public async Task<IReadOnlyList<ProductDto>> GetRelatedProductsAsync(Guid productId, int count = 4, CancellationToken cancellationToken = default)
    {
        var current = await _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == productId && p.IsActive, cancellationToken);
        if (current == null) return Array.Empty<ProductDto>();

        return await _db.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Where(p => p.Id != productId && p.CategoryId == current.CategoryId && p.IsActive)
            .OrderByDescending(p => p.IsBestSeller)
            .ThenByDescending(p => p.CreatedAtUtc)
            .Take(Math.Clamp(count, 1, 50))
            .Select(p => new ProductDto(
                p.Id,
                p.Name,
                p.Slug,
                p.ShortDescription,
                p.CategoryId,
                p.Category != null ? p.Category.Name : string.Empty,
                p.Category != null ? p.Category.Slug : string.Empty,
                p.BasePrice,
                p.DiscountPrice,
                p.StockQuantity,
                p.Sku,
                p.UnitInfo,
                p.Images.Where(i => i.IsMain).Select(i => i.ImageUrl).FirstOrDefault() ??
                    p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault(),
                p.IsBestSeller,
                p.IsNew,
                p.IsFeatured,
                p.IsSeasonal,
                p.IsActive,
                p.Variants.Count(v => v.IsActive)))
            .ToListAsync(cancellationToken);
    }

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var slug = string.IsNullOrWhiteSpace(request.Slug)
            ? SlugHelper.GenerateSlug(request.Name)
            : SlugHelper.GenerateSlug(request.Slug);

        // Benzersiz slug kontrolü
        if (await _db.Categories.AnyAsync(c => c.Slug == slug, cancellationToken))
            slug = $"{slug}-{Guid.NewGuid().ToString("n")[..4]}";

        var category = new Category(
            request.Name,
            slug,
            request.Description,
            request.ImageUrl,
            request.ParentCategoryId,
            request.DisplayOrder,
            request.IsActive);

        _db.Categories.Add(category);
        await _db.SaveChangesAsync(cancellationToken);

        return new CategoryDto(
            category.Id,
            category.Name,
            category.Slug,
            category.Description,
            category.ImageUrl,
            category.ParentCategoryId,
            category.DisplayOrder,
            category.IsActive,
            0);
    }

    public async Task<CategoryDto?> UpdateCategoryAsync(Guid id, UpdateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (category == null) return null;

        // Bir kategorinin kendisinin veya alt kategorilerinden birinin altına taşınması döngü yaratır.
        var parents = await _db.Categories.AsNoTracking()
            .Select(c => new { c.Id, c.ParentCategoryId })
            .ToDictionaryAsync(c => c.Id, c => c.ParentCategoryId, cancellationToken);
        var current = request.ParentCategoryId;
        var visited = new HashSet<Guid>();
        while (current.HasValue)
        {
            if (current.Value == id || !visited.Add(current.Value))
                throw new InvalidOperationException("Kategori hiyerarşisinde döngü oluşturulamaz.");
            if (!parents.TryGetValue(current.Value, out var parent))
                throw new InvalidOperationException("Üst kategori bulunamadı.");
            current = parent;
        }

        var slug = string.IsNullOrWhiteSpace(request.Slug)
            ? SlugHelper.GenerateSlug(request.Name)
            : SlugHelper.GenerateSlug(request.Slug);

        if (await _db.Categories.AnyAsync(c => c.Slug == slug && c.Id != id, cancellationToken))
            slug = $"{slug}-{Guid.NewGuid().ToString("n")[..4]}";

        category.Update(
            request.Name,
            slug,
            request.Description,
            request.ImageUrl,
            request.ParentCategoryId,
            request.DisplayOrder,
            request.IsActive);

        await _db.SaveChangesAsync(cancellationToken);

        var productCount = await _db.Products.CountAsync(p => p.CategoryId == id && p.IsActive, cancellationToken);

        return new CategoryDto(
            category.Id,
            category.Name,
            category.Slug,
            category.Description,
            category.ImageUrl,
            category.ParentCategoryId,
            category.DisplayOrder,
            category.IsActive,
            productCount);
    }

    public async Task<bool> DeleteCategoryAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (category == null) return false;

        // Kategoriye bağlı ürün veya alt kategori varsa silmeyi engelle
        var hasProducts = await _db.Products.AnyAsync(p => p.CategoryId == id, cancellationToken);
        var hasChildren = await _db.Categories.AnyAsync(c => c.ParentCategoryId == id, cancellationToken);

        if (hasProducts || hasChildren)
            throw new InvalidOperationException("Bu kategoriye bağlı ürünler veya alt kategoriler olduğu için silinemez. Önce ilişkili kayıtları kaldırın.");

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<ProductDetailDto> CreateProductAsync(CreateProductRequest request, CancellationToken cancellationToken = default)
    {
        var slug = string.IsNullOrWhiteSpace(request.Slug)
            ? SlugHelper.GenerateSlug(request.Name)
            : SlugHelper.GenerateSlug(request.Slug);

        if (await _db.Products.AnyAsync(p => p.Slug == slug, cancellationToken))
            slug = $"{slug}-{Guid.NewGuid().ToString("n")[..4]}";

        if (await _db.Products.AnyAsync(p => p.Sku == request.Sku, cancellationToken))
            throw new InvalidOperationException($"'{request.Sku}' stok koduna (SKU) sahip bir ürün zaten mevcut.");

        var product = new Product(
            request.Name,
            slug,
            request.ShortDescription,
            request.Description,
            request.CategoryId,
            request.BasePrice,
            request.DiscountPrice,
            request.StockQuantity,
            request.Sku,
            request.UnitInfo,
            request.Ingredients,
            request.Allergens,
            request.Origin,
            request.StorageConditions,
            request.ShelfLife,
            request.IsBestSeller,
            request.IsNew,
            request.IsFeatured,
            request.IsSeasonal,
            request.IsActive);

        // Görseller
        if (request.ImageUrls != null && request.ImageUrls.Count > 0)
        {
            for (int i = 0; i < request.ImageUrls.Count; i++)
            {
                product.Images.Add(new ProductImage(
                    product.Id,
                    request.ImageUrls[i],
                    product.Name,
                    i,
                    i == 0));
            }
        }

        // Varyantlar (500 gr, 1 kg vb.)
        if (request.Variants != null && request.Variants.Count > 0)
        {
            foreach (var v in request.Variants)
            {
                product.Variants.Add(new ProductVariant(
                    product.Id,
                    v.Name,
                    v.Sku,
                    v.Price,
                    v.DiscountPrice,
                    v.StockQuantity,
                    v.UnitInfo,
                    v.DisplayOrder,
                    v.IsActive));
            }
        }

        _db.Products.Add(product);
        await _db.SaveChangesAsync(cancellationToken);

        // Kategori bilgisini yükle
        await _db.Entry(product).Reference(p => p.Category).LoadAsync(cancellationToken);

        return MapToDetailDto(product);
    }

    public async Task<ProductDetailDto?> UpdateProductAsync(Guid id, UpdateProductRequest request, CancellationToken cancellationToken = default)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null) return null;

        var slug = string.IsNullOrWhiteSpace(request.Slug)
            ? SlugHelper.GenerateSlug(request.Name)
            : SlugHelper.GenerateSlug(request.Slug);

        if (await _db.Products.AnyAsync(p => p.Slug == slug && p.Id != id, cancellationToken))
            slug = $"{slug}-{Guid.NewGuid().ToString("n")[..4]}";

        if (await _db.Products.AnyAsync(p => p.Sku == request.Sku && p.Id != id, cancellationToken))
            throw new InvalidOperationException($"'{request.Sku}' stok koduna sahip başka bir ürün var.");

        product.Update(
            request.Name,
            slug,
            request.ShortDescription,
            request.Description,
            request.CategoryId,
            request.BasePrice,
            request.DiscountPrice,
            request.StockQuantity,
            request.Sku,
            request.UnitInfo,
            request.Ingredients,
            request.Allergens,
            request.Origin,
            request.StorageConditions,
            request.ShelfLife,
            request.IsBestSeller,
            request.IsNew,
            request.IsFeatured,
            request.IsSeasonal,
            request.IsActive);

        await _db.SaveChangesAsync(cancellationToken);

        await _db.Entry(product).Reference(p => p.Category).LoadAsync(cancellationToken);

        return MapToDetailDto(product);
    }

    public async Task<bool> DeleteProductAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (product == null) return false;

        _db.Products.Remove(product);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<ProductVariantDto> AddVariantAsync(Guid productId, CreateProductVariantRequest request, CancellationToken cancellationToken = default)
    {
        if (await _db.ProductVariants.AnyAsync(v => v.Sku == request.Sku, cancellationToken))
            throw new InvalidOperationException($"'{request.Sku}' kodlu varyant SKU zaten kullanımda.");

        var variant = new ProductVariant(
            productId,
            request.Name,
            request.Sku,
            request.Price,
            request.DiscountPrice,
            request.StockQuantity,
            request.UnitInfo,
            request.DisplayOrder,
            request.IsActive);

        _db.ProductVariants.Add(variant);
        await _db.SaveChangesAsync(cancellationToken);

        return new ProductVariantDto(
            variant.Id,
            variant.ProductId,
            variant.Name,
            variant.Sku,
            variant.Price,
            variant.DiscountPrice,
            variant.StockQuantity,
            variant.UnitInfo,
            variant.DisplayOrder,
            variant.IsActive);
    }

    public async Task<ProductVariantDto?> UpdateVariantAsync(Guid variantId, UpdateProductVariantRequest request, CancellationToken cancellationToken = default)
    {
        var variant = await _db.ProductVariants.FirstOrDefaultAsync(v => v.Id == variantId, cancellationToken);
        if (variant == null) return null;

        if (await _db.ProductVariants.AnyAsync(v => v.Sku == request.Sku && v.Id != variantId, cancellationToken))
            throw new InvalidOperationException($"'{request.Sku}' kodlu varyant SKU zaten kullanımda.");

        variant.Update(
            request.Name,
            request.Sku,
            request.Price,
            request.DiscountPrice,
            request.StockQuantity,
            request.UnitInfo,
            request.DisplayOrder,
            request.IsActive);

        await _db.SaveChangesAsync(cancellationToken);

        return new ProductVariantDto(
            variant.Id,
            variant.ProductId,
            variant.Name,
            variant.Sku,
            variant.Price,
            variant.DiscountPrice,
            variant.StockQuantity,
            variant.UnitInfo,
            variant.DisplayOrder,
            variant.IsActive);
    }

    public async Task<bool> DeleteVariantAsync(Guid variantId, CancellationToken cancellationToken = default)
    {
        var variant = await _db.ProductVariants.FirstOrDefaultAsync(v => v.Id == variantId, cancellationToken);
        if (variant == null) return false;

        _db.ProductVariants.Remove(variant);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<ProductImageDto> AddImageAsync(Guid productId, string imageUrl, string? altText, int displayOrder, bool isMain, CancellationToken cancellationToken = default)
    {
        if (isMain)
        {
            var oldMains = await _db.ProductImages.Where(i => i.ProductId == productId && i.IsMain).ToListAsync(cancellationToken);
            foreach (var img in oldMains) img.SetMain(false);
        }

        var image = new ProductImage(productId, imageUrl, altText, displayOrder, isMain);
        _db.ProductImages.Add(image);
        await _db.SaveChangesAsync(cancellationToken);

        return new ProductImageDto(image.Id, image.ImageUrl, image.AltText, image.DisplayOrder, image.IsMain);
    }

    public async Task<bool> DeleteImageAsync(Guid imageId, CancellationToken cancellationToken = default)
    {
        var image = await _db.ProductImages.FirstOrDefaultAsync(i => i.Id == imageId, cancellationToken);
        if (image == null) return false;

        _db.ProductImages.Remove(image);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static ProductDetailDto MapToDetailDto(Product product)
    {
        return new ProductDetailDto(
            product.Id,
            product.Name,
            product.Slug,
            product.ShortDescription,
            product.Description,
            product.CategoryId,
            product.Category != null ? product.Category.Name : string.Empty,
            product.Category != null ? product.Category.Slug : string.Empty,
            product.BasePrice,
            product.DiscountPrice,
            product.StockQuantity,
            product.Sku,
            product.UnitInfo,
            product.Ingredients,
            product.Allergens,
            product.Origin,
            product.StorageConditions,
            product.ShelfLife,
            product.IsBestSeller,
            product.IsNew,
            product.IsFeatured,
            product.IsSeasonal,
            product.IsActive,
            product.Images.OrderBy(i => i.DisplayOrder).Select(i => new ProductImageDto(i.Id, i.ImageUrl, i.AltText, i.DisplayOrder, i.IsMain)).ToList(),
            product.Variants.Where(v => v.IsActive).OrderBy(v => v.DisplayOrder).Select(v => new ProductVariantDto(v.Id, v.ProductId, v.Name, v.Sku, v.Price, v.DiscountPrice, v.StockQuantity, v.UnitInfo, v.DisplayOrder, v.IsActive)).ToList(),
            product.Attributes.OrderBy(a => a.DisplayOrder).ThenBy(a => a.Name).Select(a => new ProductAttributeDto(a.Name, a.Value, a.DisplayOrder)).ToList());
    }
}
