using LibrarySystem.Api.Common;
using LibrarySystem.Api.Data;
using LibrarySystem.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace LibrarySystem.Api.Services;

public class BookService : IBookService
{
    private readonly AppDbContext _context;

    public BookService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Book>> GetAllAsync()
    {
        return await _context.Books.AsNoTracking().ToListAsync();
    }

    public async Task<Book?> GetByIdAsync(int id)
    {
        return await _context.Books.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<Book> CreateAsync(Book book)
    {
        _context.Books.Add(book);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            throw new DuplicateValueException($"A book with ISBN '{book.Isbn}' already exists.");
        }

        return book;
    }

    public async Task<bool> UpdateAsync(int id, Book book)
    {
        var existing = await _context.Books.FirstOrDefaultAsync(b => b.Id == id);
        if (existing is null)
        {
            return false;
        }

        existing.Title = book.Title;
        existing.Author = book.Author;
        existing.Isbn = book.Isbn;
        existing.PublicationYear = book.PublicationYear;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            throw new DuplicateValueException($"A book with ISBN '{book.Isbn}' already exists.");
        }

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _context.Books.FirstOrDefaultAsync(b => b.Id == id);
        if (existing is null)
        {
            return false;
        }

        _context.Books.Remove(existing);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            throw new DeleteConflictException($"Book {id} cannot be deleted because it has loan history.");
        }

        return true;
    }
}
