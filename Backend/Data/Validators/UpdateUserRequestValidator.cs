using Data.Dtos.User;
using FluentValidation;

namespace Data.Validators
{
    public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
    {
        public UpdateUserRequestValidator()
        {
            RuleFor(x => x.Id)
                .GreaterThan(0).WithMessage("Id must be greater than 0");

            RuleFor(x => x.Nombre)
                .NotEmpty().WithMessage("Nombre is required")
                .MaximumLength(200).WithMessage("Nombre must not exceed 200 characters");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .MaximumLength(255).WithMessage("Email must not exceed 255 characters");

            RuleFor(x => x.UsuarioActualizacion)
                .NotEmpty().WithMessage("UsuarioActualizacion is required");
        }
    }
}
