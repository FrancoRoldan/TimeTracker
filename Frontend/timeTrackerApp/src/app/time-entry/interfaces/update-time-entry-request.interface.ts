export interface UpdateTimeEntryRequest {
  projectId?: number;
  issueId?: number;
  description?: string;
  startTime?: string;
  endTime?: string;
}
