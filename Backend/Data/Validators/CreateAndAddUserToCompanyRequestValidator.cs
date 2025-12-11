using Data.Dtos.Company;
using FluentValidation;

namespace Data.Validators
{
    public class CreateAndAddUserToCompanyRequestValidator : AbstractValidator<CreateAndAddUserToCompanyRequest>
    {
        public CreateAndAddUserToCompanyRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required")
                .MaximumLength(200).WithMessage("Name cannot exceed 200 characters");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .MaximumLength(200).WithMessage("Email cannot exceed 200 characters");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(6).WithMessage("Password must be at least 6 characters");

            RuleFor(x => x.Role)
                .IsInEnum().WithMessage("Invalid role");

            RuleFor(x => x.HourlyRate)
                .GreaterThan(0).When(x => x.HourlyRate.HasValue)
                .WithMessage("Hourly rate must be greater than 0");
        }
    }
}
