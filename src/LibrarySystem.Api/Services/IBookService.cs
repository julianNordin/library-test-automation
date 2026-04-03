using LibrarySystem.Api.Domain;

namespace LibrarySystem.Api.Services;

// No IBookRepository here by design: implementations talk to AppDbContext directly.
// DbContext already is a Unit-of-Work/Repository; with 3 entities and one data store,
// a repository layer would just be ceremony wrapping ceremony.
public interface IBookService
{
    Task<IEnumerable<Book>> GetAllAsync();
    Task<Book?> GetByIdAsync(int id);
    Task<Book> CreateAsync(Book book);
    Task<bool> UpdateAsync(int id, Book book);
    Task<bool> DeleteAsync(int id);
}
