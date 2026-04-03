using FluentValidation;

namespace LibrarySystem.Api.DTOs.Validators;

public class BookCreateDtoValidator : AbstractValidator<BookCreateDto>
{
    public BookCreateDtoValidator()
    {
        RuleFor(b => b.Title).NotEmpty().MaximumLength(200);
        RuleFor(b => b.Author).NotEmpty().MaximumLength(150);
        RuleFor(b => b.Isbn).NotEmpty().MaximumLength(20);
        RuleFor(b => b.PublicationYear).InclusiveBetween(1450, DateTime.UtcNow.Year);
    }
}

public class BookUpdateDtoValidator : AbstractValidator<BookUpdateDto>
{
    public BookUpdateDtoValidator()
    {
        RuleFor(b => b.Title).NotEmpty().MaximumLength(200);
        RuleFor(b => b.Author).NotEmpty().MaximumLength(150);
        RuleFor(b => b.Isbn).NotEmpty().MaximumLength(20);
        RuleFor(b => b.PublicationYear).InclusiveBetween(1450, DateTime.UtcNow.Year);
    }
}
