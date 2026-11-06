using Application.Content.DTOs;
using FluentValidation;

namespace Application.Content.Validators;

public class CreateBannerValidator : AbstractValidator<CreateBannerRequest>
{
    public CreateBannerValidator()
    {
        RuleFor(x => x.Title).NotEmpty().WithMessage("Banner başlığı zorunludur.").MaximumLength(200);
        RuleFor(x => x.ImageUrl).NotEmpty().WithMessage("Banner görsel URL'si zorunludur.");
    }
}

public class CreateFaqValidator : AbstractValidator<CreateFaqRequest>
{
    public CreateFaqValidator()
    {
        RuleFor(x => x.Question).NotEmpty().WithMessage("Soru metni zorunludur.").MaximumLength(300);
        RuleFor(x => x.Answer).NotEmpty().WithMessage("Cevap metni zorunludur.");
    }
}
