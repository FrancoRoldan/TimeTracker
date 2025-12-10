// Daily breakdown interface
export interface DailyBreakdown {
  date: string;
  totalHours: number;
  totalMinutes: number;
  entriesCount: number;
}

// Project breakdown interface
export interface ProjectBreakdown {
  projectId: number;
  projectName: string;
  totalHours: number;
  totalMinutes: number;
  entriesCount: number;
}

// Issue breakdown interface
export interface IssueBreakdown {
  issueId: number;
  issueTitle: string;
  projectName: string;
  totalHours: number;
  totalMinutes: number;
  entriesCount: number;
}

// User breakdown interface (for company/project reports)
export interface UserBreakdown {
  userId: number;
  userName: string;
  totalHours: number;
  totalMinutes: number;
  entriesCount: number;
}

// Issue type breakdown interface
export interface IssueTypeBreakdown {
  type: string;
  totalHours: number;
  totalMinutes: number;
  entriesCount: number;
}
