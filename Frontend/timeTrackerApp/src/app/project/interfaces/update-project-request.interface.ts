import { ProjectStatus } from '../../core/enums';

export interface UpdateProjectRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
}
