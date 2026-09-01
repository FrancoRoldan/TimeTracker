export interface TimeEntry {
  id: number;
  projectId: number | null;
  projectName: string;
  issueId: number | null;
  issueTitle: string;
  userId: number;
  userName: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  registeredInDevOps: boolean;
  createdAt?: string;
  updatedAt?: string;
}
