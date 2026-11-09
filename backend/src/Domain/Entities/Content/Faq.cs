namespace Domain.Entities.Content;

public class Faq
{
    public Guid Id { get; private set; }
    public string Question { get; private set; } = default!;
    public string Answer { get; private set; } = default!;
    public string? Category { get; private set; } // Teslimat, Ürünler, İade vb.
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; }

    private Faq() { }

    public Faq(
        string question,
        string answer,
        string? category = null,
        int displayOrder = 0,
        bool isActive = true,
        Guid? id = null)
    {
        Id = id ?? Guid.NewGuid();
        Question = question;
        Answer = answer;
        Category = category;
        DisplayOrder = displayOrder;
        IsActive = isActive;
    }

    public void Update(string question, string answer, string? category, int displayOrder, bool isActive)
    {
        Question = question;
        Answer = answer;
        Category = category;
        DisplayOrder = displayOrder;
        IsActive = isActive;
    }
}
