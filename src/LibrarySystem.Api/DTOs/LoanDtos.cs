namespace LibrarySystem.Api.DTOs;

public class BorrowRequestDto
{
    public int BookId { get; set; }
    public int MemberId { get; set; }
}

public class LoanReadDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public string BookTitle { get; set; } = string.Empty;
    public int MemberId { get; set; }
    public string MemberFullName { get; set; } = string.Empty;
    public DateTime BorrowedDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ReturnedDate { get; set; }
    public bool IsOverdue { get; set; }
}
