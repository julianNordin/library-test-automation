using LibrarySystem.Api.Domain;

namespace LibrarySystem.Api.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        if (context.Books.Any() || context.Members.Any())
        {
            return;
        }

        var books = new List<Book>
        {
            new() { Title = "Clean Code", Author = "Robert C. Martin", Isbn = "9780132350884", PublicationYear = 2008 },
            new() { Title = "The Pragmatic Programmer", Author = "Andrew Hunt", Isbn = "9780201616224", PublicationYear = 1999 },
            new() { Title = "Design Patterns", Author = "Erich Gamma", Isbn = "9780201633610", PublicationYear = 1994 },
            new() { Title = "Domain-Driven Design", Author = "Eric Evans", Isbn = "9780321125217", PublicationYear = 2003 },
            new() { Title = "Refactoring", Author = "Martin Fowler", Isbn = "9780201485677", PublicationYear = 1999 },
        };

        var members = new List<Member>
        {
            new() { FullName = "Alice Johnson", Email = "alice.johnson@example.com", JoinedDate = DateTime.UtcNow.AddYears(-2) },
            new() { FullName = "Bob Smith", Email = "bob.smith@example.com", JoinedDate = DateTime.UtcNow.AddYears(-1) },
            new() { FullName = "Carol Davis", Email = "carol.davis@example.com", JoinedDate = DateTime.UtcNow.AddMonths(-6) },
        };

        context.Books.AddRange(books);
        context.Members.AddRange(members);
        context.SaveChanges();
    }
}
