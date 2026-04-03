namespace LibrarySystem.Api.Domain;

public class Book
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Isbn { get; set; } = string.Empty;
    public int PublicationYear { get; set; }

    public ICollection<Loan> Loans { get; set; } = new List<Loan>();
}
