using Application.Catalog.DTOs;
using FluentValidation;

namespace Application.Catalog.Validators;

public class CreateCategoryValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Kategori adı zorunludur.").MaximumLength(150);
        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0);
    }
}

public class UpdateCategoryValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Kategori adı zorunludur.").MaximumLength(150);
        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0);
    }
}

public class CreateProductValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Ürün adı zorunludur.").MaximumLength(250);
        RuleFor(x => x.ShortDescription).NotEmpty().WithMessage("Kısa açıklama zorunludur.").MaximumLength(500);
        RuleFor(x => x.CategoryId).NotEmpty().WithMessage("Kategori seçilmelidir.");
        RuleFor(x => x.BasePrice).GreaterThan(0).WithMessage("Normal fiyat 0'dan büyük olmalıdır.");
        RuleFor(x => x.DiscountPrice).GreaterThanOrEqualTo(0).When(x => x.DiscountPrice.HasValue);
        RuleFor(x => x.DiscountPrice)
            .LessThan(x => x.BasePrice)
            .When(x => x.DiscountPrice.HasValue)
            .WithMessage("İndirimli fiyat normal fiyattan düşük olmalıdır.");
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0).WithMessage("Stok miktarı negatif olamaz.");
        RuleForEach(x => x.Variants).SetValidator(new CreateProductVariantValidator()).When(x => x.Variants != null);
        RuleFor(x => x.Sku).NotEmpty().WithMessage("Stok kodu (SKU) zorunludur.").MaximumLength(100);
        RuleFor(x => x.UnitInfo).NotEmpty().WithMessage("Birim/Gramaj bilgisi zorunludur (örn. 1 kg, 500 gr).").MaximumLength(50);
    }
}

public class CreateProductVariantValidator : AbstractValidator<CreateProductVariantRequest>
{
    public CreateProductVariantValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Varyant adı zorunludur (örn. 1 kg Cam Kavanoz).").MaximumLength(150);
        RuleFor(x => x.Price).GreaterThan(0).WithMessage("Fiyat 0'dan büyük olmalıdır.");
        RuleFor(x => x.DiscountPrice).GreaterThanOrEqualTo(0).LessThan(x => x.Price).When(x => x.DiscountPrice.HasValue);
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0).WithMessage("Stok miktarı negatif olamaz.");
        RuleFor(x => x.Sku).NotEmpty().WithMessage("Varyant SKU zorunludur.").MaximumLength(100);
        RuleFor(x => x.UnitInfo).NotEmpty().WithMessage("Birim bilgisi zorunludur.").MaximumLength(50);
    }
}

public class UpdateProductValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(250);
        RuleFor(x => x.ShortDescription).NotEmpty().MaximumLength(500);
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.BasePrice).GreaterThan(0);
        RuleFor(x => x.DiscountPrice).GreaterThanOrEqualTo(0).LessThan(x => x.BasePrice).When(x => x.DiscountPrice.HasValue);
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Sku).NotEmpty().MaximumLength(100);
        RuleFor(x => x.UnitInfo).NotEmpty().MaximumLength(50);
    }
}

public class UpdateProductVariantValidator : AbstractValidator<UpdateProductVariantRequest>
{
    public UpdateProductVariantValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Sku).NotEmpty().MaximumLength(100);
        RuleFor(x => x.UnitInfo).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.DiscountPrice).GreaterThanOrEqualTo(0).LessThan(x => x.Price).When(x => x.DiscountPrice.HasValue);
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0);
        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0);
    }
}
