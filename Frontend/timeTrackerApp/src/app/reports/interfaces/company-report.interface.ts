import { DailyBreakdown, UserBreakdown, ProjectBreakdown } from './breakdown.interface';

export interface CompanyReport {
  companyId: number;
  companyName: string;
  totalHours: number;
  totalMinutes: number;
  dateFrom: string;
  dateTo: string;
  userBreakdown: UserBreakdown[];
  projectBreakdown: ProjectBreakdown[];
  dailyBreakdown: DailyBreakdown[];
}
