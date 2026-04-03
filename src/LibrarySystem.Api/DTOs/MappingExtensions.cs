using LibrarySystem.Api.Domain;

namespace LibrarySystem.Api.DTOs;

public static class MappingExtensions
{
    public static BookReadDto ToReadDto(this Book book) => new()
    {
        Id = book.Id,
        Title = book.Title,
        Author = book.Author,
        Isbn = book.Isbn,
        PublicationYear = book.PublicationYear,
    };

    public static Book ToEntity(this BookCreateDto dto) => new()
    {
        Title = dto.Title,
        Author = dto.Author,
        Isbn = dto.Isbn,
        PublicationYear = dto.PublicationYear,
    };

    public static Book ToEntity(this BookUpdateDto dto) => new()
    {
        Title = dto.Title,
        Author = dto.Author,
        Isbn = dto.Isbn,
        PublicationYear = dto.PublicationYear,
    };

    public static MemberReadDto ToReadDto(this Member member) => new()
    {
        Id = member.Id,
        FullName = member.FullName,
        Email = member.Email,
        JoinedDate = member.JoinedDate,
    };

    public static Member ToEntity(this MemberCreateDto dto) => new()
    {
        FullName = dto.FullName,
        Email = dto.Email,
        JoinedDate = DateTime.UtcNow,
    };

    public static Member ToEntity(this MemberUpdateDto dto) => new()
    {
        FullName = dto.FullName,
        Email = dto.Email,
    };

    public static LoanReadDto ToReadDto(this Loan loan) => new()
    {
        Id = loan.Id,
        BookId = loan.BookId,
        BookTitle = loan.Book?.Title ?? string.Empty,
        MemberId = loan.MemberId,
        MemberFullName = loan.Member?.FullName ?? string.Empty,
        BorrowedDate = loan.BorrowedDate,
        DueDate = loan.DueDate,
        ReturnedDate = loan.ReturnedDate,
        IsOverdue = loan.ReturnedDate is null && loan.DueDate < DateTime.UtcNow,
    };
}
