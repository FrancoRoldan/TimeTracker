export interface RegisterRequest {
    Name: string;
    Email: string;
    Password: string;
    CompanyId: number;
    Role: string;
    HourlyRate: number | null;
}
