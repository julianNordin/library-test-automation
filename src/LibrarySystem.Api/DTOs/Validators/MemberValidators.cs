using FluentValidation;

namespace LibrarySystem.Api.DTOs.Validators;

public class MemberCreateDtoValidator : AbstractValidator<MemberCreateDto>
{
    public MemberCreateDtoValidator()
    {
        RuleFor(m => m.FullName).NotEmpty().MaximumLength(150);
        RuleFor(m => m.Email).NotEmpty().EmailAddress().MaximumLength(256);
    }
}

public class MemberUpdateDtoValidator : AbstractValidator<MemberUpdateDto>
{
    public MemberUpdateDtoValidator()
    {
        RuleFor(m => m.FullName).NotEmpty().MaximumLength(150);
        RuleFor(m => m.Email).NotEmpty().EmailAddress().MaximumLength(256);
    }
}
