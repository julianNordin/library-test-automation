using LibrarySystem.Api.DTOs;
using LibrarySystem.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace LibrarySystem.Api.Controllers;

/// <summary>
/// Borrowing, returning, and querying loans.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class LoansController : ControllerBase
{
    private readonly ILoanService _loanService;

    public LoansController(ILoanService loanService)
    {
        _loanService = loanService;
    }

    /// <summary>Gets every loan (active and returned).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<LoanReadDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<LoanReadDto>>> GetAll()
    {
        var loans = await _loanService.GetAllAsync();
        return Ok(loans.Select(l => l.ToReadDto()));
    }

    /// <summary>Gets a single loan by id.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(LoanReadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LoanReadDto>> GetById(int id)
    {
        var loan = await _loanService.GetByIdAsync(id);
        if (loan is null)
        {
            return NotFound();
        }

        return Ok(loan.ToReadDto());
    }

    /// <summary>Gets every loan that is past its due date and not yet returned.</summary>
    [HttpGet("overdue")]
    [ProducesResponseType(typeof(IEnumerable<LoanReadDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<LoanReadDto>>> GetOverdue()
    {
        var loans = await _loanService.GetOverdueAsync();
        return Ok(loans.Select(l => l.ToReadDto()));
    }

    /// <summary>Gets every loan (active and returned) for one member.</summary>
    [HttpGet("member/{memberId:int}")]
    [ProducesResponseType(typeof(IEnumerable<LoanReadDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<LoanReadDto>>> GetByMember(int memberId)
    {
        var loans = await _loanService.GetByMemberAsync(memberId);
        return Ok(loans.Select(l => l.ToReadDto()));
    }

    /// <summary>
    /// Borrows a book for a member. Rejected if the book is already on loan or the
    /// member is at their active-loan cap.
    /// </summary>
    [HttpPost("borrow")]
    [ProducesResponseType(typeof(LoanReadDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<LoanReadDto>> Borrow(BorrowRequestDto dto)
    {
        var loan = await _loanService.BorrowAsync(dto.BookId, dto.MemberId);
        var readDto = (await _loanService.GetByIdAsync(loan.Id))!.ToReadDto();
        return CreatedAtAction(nameof(GetById), new { id = loan.Id }, readDto);
    }

    /// <summary>Returns a borrowed book. Rejected if the loan was already returned.</summary>
    [HttpPost("{id:int}/return")]
    [ProducesResponseType(typeof(LoanReadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<LoanReadDto>> Return(int id)
    {
        var loan = await _loanService.ReturnAsync(id);
        var readDto = (await _loanService.GetByIdAsync(loan.Id))!.ToReadDto();
        return Ok(readDto);
    }
}
