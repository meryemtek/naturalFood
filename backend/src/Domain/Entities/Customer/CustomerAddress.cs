namespace Domain.Entities.Customer;

/// <summary>
/// Müşterinin kayıtlı teslimat/fatura adresi.
/// </summary>
public class CustomerAddress
{
    public Guid Id { get; private set; }
    public Guid CustomerId { get; private set; }
    public string Title { get; private set; } = default!;
    public string RecipientName { get; private set; } = default!;
    public string Phone { get; private set; } = default!;
    public string City { get; private set; } = default!;
    public string District { get; private set; } = default!;
    public string? Neighborhood { get; private set; }
    public string FullAddress { get; private set; } = default!;
    public string? PostalCode { get; private set; }
    public bool IsDefault { get; private set; }
    public bool IsBillingAddress { get; private set; }

    // Kurumsal fatura bilgileri (opsiyonel)
    public string? CompanyName { get; private set; }
    public string? TaxOffice { get; private set; }
    public string? TaxNumber { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? UpdatedAtUtc { get; private set; }

    // Navigation
    public Customer? Customer { get; private set; }

    private CustomerAddress() { }

    public CustomerAddress(
        Guid customerId,
        string title,
        string recipientName,
        string phone,
        string city,
        string district,
        string? neighborhood,
        string fullAddress,
        string? postalCode = null,
        bool isDefault = false,
        bool isBillingAddress = false,
        string? companyName = null,
        string? taxOffice = null,
        string? taxNumber = null,
        Guid? id = null)
    {
        Id = id ?? Guid.NewGuid();
        CustomerId = customerId;
        Title = title.Trim();
        RecipientName = recipientName.Trim();
        Phone = phone.Trim();
        City = city.Trim();
        District = district.Trim();
        Neighborhood = neighborhood?.Trim();
        FullAddress = fullAddress.Trim();
        PostalCode = postalCode?.Trim();
        IsDefault = isDefault;
        IsBillingAddress = isBillingAddress;
        CompanyName = companyName?.Trim();
        TaxOffice = taxOffice?.Trim();
        TaxNumber = taxNumber?.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void Update(
        string title,
        string recipientName,
        string phone,
        string city,
        string district,
        string? neighborhood,
        string fullAddress,
        string? postalCode,
        bool isDefault,
        bool isBillingAddress,
        string? companyName,
        string? taxOffice,
        string? taxNumber)
    {
        Title = title.Trim();
        RecipientName = recipientName.Trim();
        Phone = phone.Trim();
        City = city.Trim();
        District = district.Trim();
        Neighborhood = neighborhood?.Trim();
        FullAddress = fullAddress.Trim();
        PostalCode = postalCode?.Trim();
        IsDefault = isDefault;
        IsBillingAddress = isBillingAddress;
        CompanyName = companyName?.Trim();
        TaxOffice = taxOffice?.Trim();
        TaxNumber = taxNumber?.Trim();
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetAsDefault()
    {
        IsDefault = true;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void UnsetDefault()
    {
        IsDefault = false;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
