import { UserRole } from '../../core/enums';

export interface UpdateUserInCompanyRequest {
  role: UserRole;
  hourlyRate: number | null;
}
