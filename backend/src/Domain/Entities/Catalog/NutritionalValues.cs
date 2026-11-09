namespace Domain.Entities.Catalog;

public class NutritionalValues
{
    public decimal EnergyKcal { get; set; }
    public decimal Fat { get; set; }
    public decimal SaturatedFat { get; set; }
    public decimal Carbohydrates { get; set; }
    public decimal Sugar { get; set; }
    public decimal Protein { get; set; }
    public decimal Salt { get; set; }

    public NutritionalValues() { }

    public NutritionalValues(
        decimal energyKcal,
        decimal fat,
        decimal saturatedFat,
        decimal carbohydrates,
        decimal sugar,
        decimal protein,
        decimal salt)
    {
        EnergyKcal = energyKcal;
        Fat = fat;
        SaturatedFat = saturatedFat;
        Carbohydrates = carbohydrates;
        Sugar = sugar;
        Protein = protein;
        Salt = salt;
    }
}
