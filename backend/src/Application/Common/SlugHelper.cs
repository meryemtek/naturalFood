using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Application.Common;

public static class SlugHelper
{
    public static string GenerateSlug(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return Guid.NewGuid().ToString("n")[..8];

        text = text.Trim().ToLowerInvariant();

        // Türkçe karakter dönüşümü
        text = text.Replace("ç", "c")
                   .Replace("ğ", "g")
                   .Replace("ı", "i")
                   .Replace("i̇", "i")
                   .Replace("ö", "o")
                   .Replace("ş", "s")
                   .Replace("ü", "u");

        // Geçersiz karakterleri kaldır veya tireye çevir
        text = Regex.Replace(text, @"[^a-z0-9\s-]", "");
        text = Regex.Replace(text, @"\s+", "-").Trim('-');

        return string.IsNullOrWhiteSpace(text) ? Guid.NewGuid().ToString("n")[..8] : text;
    }
}
