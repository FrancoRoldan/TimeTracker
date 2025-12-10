import { UserRole } from '../../core/enums';

export interface CompanyUser {
  userId: number;
  userName: string;
  userEmail: string;
  role: UserRole;
  hourlyRate: number | null;
  joinedAt: string;
}
