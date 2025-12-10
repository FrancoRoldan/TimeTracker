import { DailyBreakdown, UserBreakdown, IssueBreakdown } from './breakdown.interface';

export interface ProjectReport {
  projectId: number;
  projectName: string;
  totalHours: number;
  totalMinutes: number;
  dateFrom: string;
  dateTo: string;
  userBreakdown: UserBreakdown[];
  issueBreakdown: IssueBreakdown[];
  dailyBreakdown: DailyBreakdown[];
}
