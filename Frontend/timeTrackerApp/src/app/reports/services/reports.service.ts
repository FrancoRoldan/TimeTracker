import { HttpClient, HttpParams } from '@angular/common/http';
import { TelemetryService } from '../../shared/services/telemetry.service';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserReport, ProjectReport, CompanyReport } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private http = inject(HttpClient);
  private telemetry = inject(TelemetryService);
  private baseUrl = `${environment.baseUrl}/reports`;

  /**
   * Get report for the current user
   * @param dateFrom Optional start date for the report
   * @param dateTo Optional end date for the report
   * @returns Observable of UserReport
   */
  getUserReport(dateFrom?: string, dateTo?: string): Observable<UserReport> {
    let params = new HttpParams();
    if (dateFrom) {
      params = params.set('dateFrom', dateFrom);
    }
    if (dateTo) {
      params = params.set('dateTo', dateTo);
    }

    this.reportarConsulta('user', dateFrom, dateTo);
    return this.http.get<UserReport>(`${this.baseUrl}/user`, { params });
  }

  /**
   * Get report for a specific user (requires appropriate permissions)
   * @param userId ID of the user
   * @param dateFrom Optional start date for the report
   * @param dateTo Optional end date for the report
   * @returns Observable of UserReport
   */
  getUserReportById(userId: number, dateFrom?: string, dateTo?: string): Observable<UserReport> {
    let params = new HttpParams();
    if (dateFrom) {
      params = params.set('dateFrom', dateFrom);
    }
    if (dateTo) {
      params = params.set('dateTo', dateTo);
    }

    this.reportarConsulta('user_by_id', dateFrom, dateTo);
    return this.http.get<UserReport>(`${this.baseUrl}/user/${userId}`, { params });
  }

  /**
   * Get report for a specific project
   * @param projectId ID of the project
   * @param dateFrom Optional start date for the report
   * @param dateTo Optional end date for the report
   * @returns Observable of ProjectReport
   */
  getProjectReport(projectId: number, dateFrom?: string, dateTo?: string): Observable<ProjectReport> {
    let params = new HttpParams();
    if (dateFrom) {
      params = params.set('dateFrom', dateFrom);
    }
    if (dateTo) {
      params = params.set('dateTo', dateTo);
    }

    this.reportarConsulta('project', dateFrom, dateTo);
    return this.http.get<ProjectReport>(`${this.baseUrl}/project/${projectId}`, { params });
  }

  /**
   * Get report for a specific company (Admin/Manager only)
   * @param companyId ID of the company
   * @param dateFrom Optional start date for the report
   * @param dateTo Optional end date for the report
   * @returns Observable of CompanyReport
   */
  getCompanyReport(companyId: number, dateFrom?: string, dateTo?: string): Observable<CompanyReport> {
    let params = new HttpParams();
    if (dateFrom) {
      params = params.set('dateFrom', dateFrom);
    }
    if (dateTo) {
      params = params.set('dateTo', dateTo);
    }

    this.reportarConsulta('company', dateFrom, dateTo);
    return this.http.get<CompanyReport>(`${this.baseUrl}/company/${companyId}`, { params });
  }

  /**
   * Registra la consulta de un reporte (§23). El tipo y la presencia de rango van
   * como propiedades, de modo que un solo evento cubre report_viewed,
   * report_type_changed y report_range_changed del catálogo.
   */
  private reportarConsulta(tipo: string, dateFrom?: string, dateTo?: string): void {
    this.telemetry.trackEvent('report_viewed', {
      reportType: tipo,
      conRango: String(Boolean(dateFrom || dateTo))
    });
  }

}
