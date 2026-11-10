using Application.Customer.DTOs;
using FluentValidation;

namespace Application.Customer.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-posta adresi zorunludur.")
            .MaximumLength(256).WithMessage("E-posta adresi en fazla 256 karakter olabilir.")
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Şifre zorunludur.")
            .MinimumLength(8).WithMessage("Şifre en az 8 karakter olmalıdır.")
            .Matches(@"[A-Z]").WithMessage("Şifre en az bir büyük harf içermelidir.")
            .Matches(@"[a-z]").WithMessage("Şifre en az bir küçük harf içermelidir.")
            .Matches(@"\d").WithMessage("Şifre en az bir rakam içermelidir.");

        RuleFor(x => x.PasswordConfirm)
            .NotEmpty().WithMessage("Şifre tekrarı zorunludur.")
            .Equal(x => x.Password).WithMessage("Şifreler eşleşmiyor.");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Ad zorunludur.")
            .MaximumLength(100).WithMessage("Ad en fazla 100 karakter olabilir.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Soyad zorunludur.")
            .MaximumLength(100).WithMessage("Soyad en fazla 100 karakter olabilir.");

        RuleFor(x => x.Phone)
            .MaximumLength(20).WithMessage("Telefon numarası en fazla 20 karakter olabilir.")
            .When(x => x.Phone != null);
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-posta adresi zorunludur.")
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Şifre zorunludur.");
    }
}

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Mevcut şifre zorunludur.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Yeni şifre zorunludur.")
            .MinimumLength(8).WithMessage("Yeni şifre en az 8 karakter olmalıdır.")
            .Matches(@"[A-Z]").WithMessage("Yeni şifre en az bir büyük harf içermelidir.")
            .Matches(@"[a-z]").WithMessage("Yeni şifre en az bir küçük harf içermelidir.")
            .Matches(@"\d").WithMessage("Yeni şifre en az bir rakam içermelidir.");

        RuleFor(x => x.NewPasswordConfirm)
            .NotEmpty().WithMessage("Yeni şifre tekrarı zorunludur.")
            .Equal(x => x.NewPassword).WithMessage("Yeni şifreler eşleşmiyor.");
    }
}

public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-posta adresi zorunludur.")
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.");
    }
}

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Sıfırlama token'ı zorunludur.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-posta adresi zorunludur.")
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Yeni şifre zorunludur.")
            .MinimumLength(8).WithMessage("Yeni şifre en az 8 karakter olmalıdır.")
            .Matches(@"[A-Z]").WithMessage("Yeni şifre en az bir büyük harf içermelidir.")
            .Matches(@"[a-z]").WithMessage("Yeni şifre en az bir küçük harf içermelidir.")
            .Matches(@"\d").WithMessage("Yeni şifre en az bir rakam içermelidir.");

        RuleFor(x => x.NewPasswordConfirm)
            .NotEmpty().WithMessage("Yeni şifre tekrarı zorunludur.")
            .Equal(x => x.NewPassword).WithMessage("Yeni şifreler eşleşmiyor.");
    }
}

public class AddressRequestValidator : AbstractValidator<AddressRequest>
{
    public AddressRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Adres başlığı zorunludur.")
            .MaximumLength(100).WithMessage("Adres başlığı en fazla 100 karakter olabilir.");

        RuleFor(x => x.RecipientName)
            .NotEmpty().WithMessage("Alıcı adı zorunludur.")
            .MaximumLength(200).WithMessage("Alıcı adı en fazla 200 karakter olabilir.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Telefon numarası zorunludur.")
            .MaximumLength(20).WithMessage("Telefon numarası en fazla 20 karakter olabilir.");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("Şehir zorunludur.")
            .MaximumLength(100).WithMessage("Şehir en fazla 100 karakter olabilir.");

        RuleFor(x => x.District)
            .NotEmpty().WithMessage("İlçe zorunludur.")
            .MaximumLength(100).WithMessage("İlçe en fazla 100 karakter olabilir.");

        RuleFor(x => x.FullAddress)
            .NotEmpty().WithMessage("Açık adres zorunludur.")
            .MaximumLength(500).WithMessage("Açık adres en fazla 500 karakter olabilir.");

        RuleFor(x => x.PostalCode)
            .MaximumLength(10).WithMessage("Posta kodu en fazla 10 karakter olabilir.")
            .When(x => x.PostalCode != null);

        RuleFor(x => x.TaxNumber)
            .MaximumLength(20).WithMessage("Vergi numarası en fazla 20 karakter olabilir.")
            .When(x => x.TaxNumber != null);
    }
}

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Ad zorunludur.")
            .MaximumLength(100).WithMessage("Ad en fazla 100 karakter olabilir.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Soyad zorunludur.")
            .MaximumLength(100).WithMessage("Soyad en fazla 100 karakter olabilir.");

        RuleFor(x => x.Phone)
            .MaximumLength(20).WithMessage("Telefon numarası en fazla 20 karakter olabilir.")
            .When(x => x.Phone != null);
    }
}
