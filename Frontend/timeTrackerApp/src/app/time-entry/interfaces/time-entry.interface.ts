export interface TimeEntry {
  id: number;
  issueId: number;
  issueTitle: string;
  projectName: string;
  userId: number;
  userName: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}
