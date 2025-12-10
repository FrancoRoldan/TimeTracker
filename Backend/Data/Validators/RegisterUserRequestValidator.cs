using Data.Dtos.Auth;
using Data.Enums;
using FluentValidation;

namespace Data.Validators
{
    public class RegisterUserRequestValidator : AbstractValidator<RegisterUserRequest>
    {
        public RegisterUserRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required")
                .MaximumLength(200).WithMessage("Name must not exceed 200 characters");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .MaximumLength(255).WithMessage("Email must not exceed 255 characters");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(6).WithMessage("Password must be at least 6 characters")
                .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter")
                .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter")
                .Matches(@"[0-9]").WithMessage("Password must contain at least one number");

            //RuleFor(x => x.CompanyId)
            //    .GreaterThan(0).WithMessage("CompanyId must be greater than 0");

            RuleFor(x => x.Role)
                .NotEmpty().WithMessage("Role is required")
                .Must(BeAValidRole).WithMessage("Invalid role. Valid roles are: Admin, Manager, Developer, Viewer");

            RuleFor(x => x.HourlyRate)
                .GreaterThanOrEqualTo(0).When(x => x.HourlyRate.HasValue)
                .WithMessage("HourlyRate must be greater than or equal to 0");
        }

        private bool BeAValidRole(string role)
        {
            return Enum.TryParse<UserRole>(role, true, out _);
        }
    }
}
