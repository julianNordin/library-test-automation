using LibrarySystem.Api.Common;
using LibrarySystem.Api.Data;
using LibrarySystem.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace LibrarySystem.Api.Services;

public class LoanService : ILoanService
{
    private const int LoanPeriodDays = 14;
    private const int MaxActiveLoansPerMember = 5;

    private readonly AppDbContext _context;
    private readonly IMemberService _memberService;

    public LoanService(AppDbContext context, IMemberService memberService)
    {
        _context = context;
        _memberService = memberService;
    }

    public async Task<IEnumerable<Loan>> GetAllAsync()
    {
        return await _context.Loans
            .Include(l => l.Book)
            .Include(l => l.Member)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Loan?> GetByIdAsync(int id)
    {
        return await _context.Loans
            .Include(l => l.Book)
            .Include(l => l.Member)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id);
    }

    public async Task<IEnumerable<Loan>> GetByMemberAsync(int memberId)
    {
        return await _context.Loans
            .Include(l => l.Book)
            .Include(l => l.Member)
            .Where(l => l.MemberId == memberId)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<IEnumerable<Loan>> GetOverdueAsync()
    {
        var now = DateTime.UtcNow;
        return await _context.Loans
            .Include(l => l.Book)
            .Include(l => l.Member)
            .Where(l => l.ReturnedDate == null && l.DueDate < now)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Loan> BorrowAsync(int bookId, int memberId)
    {
        var book = await _context.Books.FirstOrDefaultAsync(b => b.Id == bookId)
            ?? throw new NotFoundException($"Book {bookId} not found.");

        var member = await _context.Members.FirstOrDefaultAsync(m => m.Id == memberId)
            ?? throw new NotFoundException($"Member {memberId} not found.");

        var bookHasActiveLoan = await _context.Loans
            .AnyAsync(l => l.BookId == bookId && l.ReturnedDate == null);
        if (bookHasActiveLoan)
        {
            throw new BookNotAvailableException($"Book {bookId} is already on loan.");
        }

        var activeLoanCount = await _memberService.GetActiveLoanCountAsync(memberId);
        if (activeLoanCount >= MaxActiveLoansPerMember)
        {
            throw new LoanLimitExceededException(
                $"Member {memberId} already has {MaxActiveLoansPerMember} active loans.");
        }

        var borrowedDate = DateTime.UtcNow;
        var loan = new Loan
        {
            BookId = book.Id,
            MemberId = member.Id,
            BorrowedDate = borrowedDate,
            DueDate = borrowedDate.AddDays(LoanPeriodDays),
        };

        _context.Loans.Add(loan);
        await _context.SaveChangesAsync();
        return loan;
    }

    public async Task<Loan> ReturnAsync(int loanId)
    {
        var loan = await _context.Loans.FirstOrDefaultAsync(l => l.Id == loanId)
            ?? throw new NotFoundException($"Loan {loanId} not found.");

        if (loan.ReturnedDate is not null)
        {
            throw new LoanAlreadyReturnedException($"Loan {loanId} was already returned.");
        }

        loan.ReturnedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return loan;
    }
}
