using Data.Dtos.Company;
using FluentValidation;

namespace Data.Validators
{
    public class CreateCompanyRequestValidator : AbstractValidator<CreateCompanyRequest>
    {
        public CreateCompanyRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Company name is required")
                .MaximumLength(200).WithMessage("Company name cannot exceed 200 characters");

            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Company code is required")
                .MaximumLength(50).WithMessage("Company code cannot exceed 50 characters")
                .Matches("^[A-Z0-9_-]+$").WithMessage("Code must contain only uppercase letters, numbers, hyphens and underscores");
        }
    }
}
