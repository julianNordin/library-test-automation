using LibrarySystem.Api.Domain;

namespace LibrarySystem.Api.Services;

public interface ILoanService
{
    Task<IEnumerable<Loan>> GetAllAsync();
    Task<Loan?> GetByIdAsync(int id);
    Task<IEnumerable<Loan>> GetByMemberAsync(int memberId);
    Task<IEnumerable<Loan>> GetOverdueAsync();
    Task<Loan> BorrowAsync(int bookId, int memberId);
    Task<Loan> ReturnAsync(int loanId);
}
