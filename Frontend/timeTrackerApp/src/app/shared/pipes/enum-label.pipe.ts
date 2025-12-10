import { Pipe, PipeTransform } from '@angular/core';
import { IssueStatus, IssuePriority, IssueType, ProjectStatus, UserRole } from '../../core/enums';

@Pipe({
  name: 'enumLabel',
  standalone: true
})
export class EnumLabelPipe implements PipeTransform {
  private labels: Record<string, Record<number, string>> = {
    ProjectStatus: {
      [ProjectStatus.Active]: 'Active',
      [ProjectStatus.OnHold]: 'On Hold',
      [ProjectStatus.Completed]: 'Completed',
      [ProjectStatus.Cancelled]: 'Cancelled'
    },
    IssueStatus: {
      [IssueStatus.ToDo]: 'To Do',
      [IssueStatus.InProgress]: 'In Progress',
      [IssueStatus.Testing]: 'Testing',
      [IssueStatus.Done]: 'Done'
    },
    IssuePriority: {
      [IssuePriority.Low]: 'Low',
      [IssuePriority.Medium]: 'Medium',
      [IssuePriority.High]: 'High',
      [IssuePriority.Critical]: 'Critical'
    },
    IssueType: {
      [IssueType.UserStory]: 'User Story',
      [IssueType.Bug]: 'Bug',
      [IssueType.Task]: 'Task'
    },
    UserRole: {
      [UserRole.Admin]: 'Admin',
      [UserRole.Manager]: 'Manager',
      [UserRole.Developer]: 'Developer',
      [UserRole.Viewer]: 'Viewer'
    }
  };

  transform(value: number, enumType: string): string {
    return this.labels[enumType]?.[value] || 'Unknown';
  }
}
