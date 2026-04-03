using LibrarySystem.Api.Common;
using LibrarySystem.Api.Domain;
using LibrarySystem.Api.Services;
using LibrarySystem.Api.Tests.TestHelpers;
using Xunit;

namespace LibrarySystem.Api.Tests.Services;

public class LoanServiceTests
{
    [Fact]
    public async Task BorrowAsync_ThrowsBookNotAvailableException_WhenBookAlreadyOnLoan()
    {
        using var context = TestDbContextFactory.Create();
        var book = new Book { Title = "Clean Code", Author = "Robert C. Martin", Isbn = "111", PublicationYear = 2008 };
        var member1 = new Member { FullName = "Member One", Email = "member1@test.com", JoinedDate = DateTime.UtcNow };
        var member2 = new Member { FullName = "Member Two", Email = "member2@test.com", JoinedDate = DateTime.UtcNow };
        context.Books.Add(book);
        context.Members.AddRange(member1, member2);
        await context.SaveChangesAsync();

        var memberService = new MemberService(context);
        var loanService = new LoanService(context, memberService);

        await loanService.BorrowAsync(book.Id, member1.Id);

        await Assert.ThrowsAsync<BookNotAvailableException>(
            () => loanService.BorrowAsync(book.Id, member2.Id));
    }

    [Fact]
    public async Task BorrowAsync_ThrowsLoanLimitExceededException_WhenMemberAtActiveLoanCap()
    {
        using var context = TestDbContextFactory.Create();
        var member = new Member { FullName = "Prolific Reader", Email = "reader@test.com", JoinedDate = DateTime.UtcNow };
        context.Members.Add(member);

        var books = new List<Book>();
        for (var i = 0; i < 6; i++)
        {
            books.Add(new Book { Title = $"Book {i}", Author = "Author", Isbn = $"222-{i}", PublicationYear = 2000 });
        }

        context.Books.AddRange(books);
        await context.SaveChangesAsync();

        var memberService = new MemberService(context);
        var loanService = new LoanService(context, memberService);

        for (var i = 0; i < 5; i++)
        {
            await loanService.BorrowAsync(books[i].Id, member.Id);
        }

        await Assert.ThrowsAsync<LoanLimitExceededException>(
            () => loanService.BorrowAsync(books[5].Id, member.Id));
    }

    [Fact]
    public async Task BorrowAsync_SetsDueDate_14DaysFromBorrowedDate()
    {
        using var context = TestDbContextFactory.Create();
        var book = new Book { Title = "Refactoring", Author = "Martin Fowler", Isbn = "333", PublicationYear = 1999 };
        var member = new Member { FullName = "Due Date Tester", Email = "duedate@test.com", JoinedDate = DateTime.UtcNow };
        context.Books.Add(book);
        context.Members.Add(member);
        await context.SaveChangesAsync();

        var memberService = new MemberService(context);
        var loanService = new LoanService(context, memberService);

        var loan = await loanService.BorrowAsync(book.Id, member.Id);

        var expectedDueDate = loan.BorrowedDate.AddDays(14);
        Assert.Equal(expectedDueDate, loan.DueDate);
    }

    [Fact]
    public async Task GetOverdueAsync_ReturnsLoan_WhenPastDueDateAndNotReturned()
    {
        using var context = TestDbContextFactory.Create();
        var book = new Book { Title = "Overdue Book", Author = "Author", Isbn = "444", PublicationYear = 2000 };
        var member = new Member { FullName = "Late Reader", Email = "late@test.com", JoinedDate = DateTime.UtcNow };
        context.Books.Add(book);
        context.Members.Add(member);
        await context.SaveChangesAsync();

        context.Loans.Add(new Loan
        {
            BookId = book.Id,
            MemberId = member.Id,
            BorrowedDate = DateTime.UtcNow.AddDays(-20),
            DueDate = DateTime.UtcNow.AddDays(-6),
            ReturnedDate = null,
        });
        await context.SaveChangesAsync();

        var memberService = new MemberService(context);
        var loanService = new LoanService(context, memberService);

        var overdueLoans = await loanService.GetOverdueAsync();

        Assert.Single(overdueLoans);
    }

    [Fact]
    public async Task GetOverdueAsync_ExcludesLoan_WhenAlreadyReturned()
    {
        using var context = TestDbContextFactory.Create();
        var book = new Book { Title = "Returned Book", Author = "Author", Isbn = "555", PublicationYear = 2000 };
        var member = new Member { FullName = "Punctual Reader", Email = "punctual@test.com", JoinedDate = DateTime.UtcNow };
        context.Books.Add(book);
        context.Members.Add(member);
        await context.SaveChangesAsync();

        context.Loans.Add(new Loan
        {
            BookId = book.Id,
            MemberId = member.Id,
            BorrowedDate = DateTime.UtcNow.AddDays(-20),
            DueDate = DateTime.UtcNow.AddDays(-6),
            ReturnedDate = DateTime.UtcNow.AddDays(-10),
        });
        await context.SaveChangesAsync();

        var memberService = new MemberService(context);
        var loanService = new LoanService(context, memberService);

        var overdueLoans = await loanService.GetOverdueAsync();

        Assert.Empty(overdueLoans);
    }
}
