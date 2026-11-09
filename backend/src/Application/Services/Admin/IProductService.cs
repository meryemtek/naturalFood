using Application.DTOs.Admin;

namespace Application.Services.Admin;

public interface IProductService
{
    Task<PaginatedList<ProductDto>> GetProductsAsync(
        int page = 1,
        int pageSize = 10,
        string? search = null,
        string? category = null,
        string? unit = null,
        CancellationToken cancellationToken = default);

    Task<ProductDto?> GetProductByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ProductDto> CreateProductAsync(CreateProductRequest req, CancellationToken cancellationToken = default);
    Task<ProductDto?> UpdateProductAsync(Guid id, UpdateProductRequest req, CancellationToken cancellationToken = default);
    Task<bool> DeleteProductAsync(Guid id, CancellationToken cancellationToken = default);
}
