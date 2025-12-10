import { IssueStatus, IssueType, IssuePriority } from '../../core/enums';

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
  priority?: IssuePriority;
  estimatedHours?: number;
  assignedUserId?: number;
}
