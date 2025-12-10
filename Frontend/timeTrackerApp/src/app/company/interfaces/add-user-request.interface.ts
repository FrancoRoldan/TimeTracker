import { UserRole } from '../../core/enums';

export interface AddUserToCompanyRequest {
  userId: number;
  companyId: number;
  role: UserRole;
  hourlyRate?: number;
}

export interface AddUserToCompanyResponse {
  userId: number;
  companyId: number;
  role: UserRole;
  hourlyRate: number | null;
  joinedAt: string;
}
