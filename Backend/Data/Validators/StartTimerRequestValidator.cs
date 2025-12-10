using Data.Dtos.TimeEntry;
using FluentValidation;

namespace Data.Validators
{
    public class StartTimerRequestValidator : AbstractValidator<StartTimerRequest>
    {
        public StartTimerRequestValidator()
        {
            // Either IssueId OR ProjectId must be provided
            RuleFor(x => x)
                .Must(x => x.IssueId.HasValue || x.ProjectId.HasValue)
                .WithMessage("Either IssueId or ProjectId must be provided");

            RuleFor(x => x.IssueId)
                .GreaterThan(0).WithMessage("Valid issue ID is required")
                .When(x => x.IssueId.HasValue);

            RuleFor(x => x.ProjectId)
                .GreaterThan(0).WithMessage("Valid project ID is required")
                .When(x => x.ProjectId.HasValue);

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));
        }
    }
}
