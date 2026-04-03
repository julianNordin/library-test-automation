using FluentValidation;

namespace LibrarySystem.Api.DTOs.Validators;

public class BorrowRequestDtoValidator : AbstractValidator<BorrowRequestDto>
{
    public BorrowRequestDtoValidator()
    {
        RuleFor(r => r.BookId).GreaterThan(0);
        RuleFor(r => r.MemberId).GreaterThan(0);
    }
}
