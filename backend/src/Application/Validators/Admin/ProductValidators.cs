using Application.DTOs.Admin;
using FluentValidation;

namespace Application.Validators.Admin;

public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ürün adı boş olamaz.")
            .MaximumLength(250).WithMessage("Ürün adı en fazla 250 karakter olabilir.");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Kategori seçimi zorunludur.")
            .MaximumLength(150).WithMessage("Kategori adı en fazla 150 karakter olabilir.");

        RuleFor(x => x.SaleUnit)
            .NotEmpty().WithMessage("Satış birimi belirtilmelidir (Adet, Kg, Gramaj, Litre).")
            .MaximumLength(50).WithMessage("Satış birimi en fazla 50 karakter olabilir.");

        RuleFor(x => x.SellingPrice)
            .GreaterThan(0).WithMessage("Satış fiyatı 0'dan büyük olmalıdır.");

        RuleFor(x => x.BasePrice)
            .GreaterThanOrEqualTo(0).WithMessage("Maliyet/taban fiyatı negatif olamaz.");

        RuleFor(x => x.StockQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Stok miktarı negatif olamaz.");
    }
}

public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ürün adı boş olamaz.")
            .MaximumLength(250).WithMessage("Ürün adı en fazla 250 karakter olabilir.");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Kategori seçimi zorunludur.")
            .MaximumLength(150).WithMessage("Kategori adı en fazla 150 karakter olabilir.");

        RuleFor(x => x.SaleUnit)
            .NotEmpty().WithMessage("Satış birimi belirtilmelidir (Adet, Kg, Gramaj, Litre).")
            .MaximumLength(50).WithMessage("Satış birimi en fazla 50 karakter olabilir.");

        RuleFor(x => x.SellingPrice)
            .GreaterThan(0).WithMessage("Satış fiyatı 0'dan büyük olmalıdır.");

        RuleFor(x => x.BasePrice)
            .GreaterThanOrEqualTo(0).WithMessage("Maliyet/taban fiyatı negatif olamaz.");

        RuleFor(x => x.StockQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Stok miktarı negatif olamaz.");
    }
}
