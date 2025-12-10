import { ProjectStatus } from '../../core/enums';

export interface CreateProjectRequest {
  name: string;
  startDate: string;
  endDate?: string;
  status: ProjectStatus;
  companyId: number;
}
