import { DailyBreakdown, ProjectBreakdown, IssueBreakdown, IssueTypeBreakdown } from './breakdown.interface';

export interface UserReport {
  userId: number;
  userName: string;
  totalHours: number;
  totalMinutes: number;
  dateFrom: string;
  dateTo: string;
  dailyBreakdown: DailyBreakdown[];
  projectBreakdown: ProjectBreakdown[];
  issueBreakdown: IssueBreakdown[];
  issueTypeBreakdown?: IssueTypeBreakdown[];
}
