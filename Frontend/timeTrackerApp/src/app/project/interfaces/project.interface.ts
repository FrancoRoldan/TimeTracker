import { ProjectStatus } from '../../core/enums';

export interface Project {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  status: ProjectStatus;
  companyId: number;
  createdAt: string;
  // Optional computed fields
  companyName?: string;
}
