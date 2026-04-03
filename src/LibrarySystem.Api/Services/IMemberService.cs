using LibrarySystem.Api.Domain;

namespace LibrarySystem.Api.Services;

public interface IMemberService
{
    Task<IEnumerable<Member>> GetAllAsync();
    Task<Member?> GetByIdAsync(int id);
    Task<Member> CreateAsync(Member member);
    Task<bool> UpdateAsync(int id, Member member);
    Task<bool> DeleteAsync(int id);
    Task<int> GetActiveLoanCountAsync(int memberId);
}
