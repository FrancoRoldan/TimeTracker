using Data.Dtos.Issue;
using FluentValidation;

namespace Data.Validators
{
    public class CreateIssueRequestValidator : AbstractValidator<CreateIssueRequest>
    {
        public CreateIssueRequestValidator()
        {
            RuleFor(x => x.ProjectId)
                .GreaterThan(0).WithMessage("Valid project ID is required");

            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Issue title is required")
                .MaximumLength(500).WithMessage("Issue title cannot exceed 500 characters");

            RuleFor(x => x.Description)
                .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.EstimatedHours)
                .GreaterThan(0).WithMessage("Estimated hours must be greater than 0")
                .When(x => x.EstimatedHours.HasValue);
        }
    }
}
