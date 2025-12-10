import { UserRole } from '../../core/enums';

export interface User {
    id: number;
    nombre: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    // Multi-tenant role management
    currentCompanyId?: number;
    currentRole?: UserRole;
}
