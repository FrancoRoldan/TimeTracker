export interface CreateTimeEntryRequest {
  issueId: number;
  description?: string;
  startTime: string;
  endTime?: string;
}
