import { IssueStatus, IssueType, IssuePriority } from '../../core/enums';

export interface Issue {
  id: number;
  projectId: number;
  projectName: string;
  title: string;
  description: string | null;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  estimatedHours: number | null;
  assignedUserId: number | null;
  assignedUserName: string | null;
  createdAt: string;
  updatedAt: string;
}
