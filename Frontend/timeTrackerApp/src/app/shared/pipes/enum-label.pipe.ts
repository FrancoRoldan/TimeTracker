import { Pipe, PipeTransform } from '@angular/core';
import { IssueStatus, IssuePriority, IssueType, ProjectStatus, UserRole } from '../../core/enums';

@Pipe({
  name: 'enumLabel',
  standalone: true
})
export class EnumLabelPipe implements PipeTransform {
  private labels: Record<string, Record<number, string>> = {
    ProjectStatus: {
      [ProjectStatus.Active]: 'Activo',
      [ProjectStatus.OnHold]: 'En Espera',
      [ProjectStatus.Completed]: 'Completado',
      [ProjectStatus.Cancelled]: 'Cancelado'
    },
    IssueStatus: {
      [IssueStatus.ToDo]: 'En análisis',
      [IssueStatus.InProgress]: 'En progreso',
      [IssueStatus.Testing]: 'En pruebas',
      [IssueStatus.Done]: 'Hecho'
    },
    IssuePriority: {
      [IssuePriority.Low]: 'Baja',
      [IssuePriority.Medium]: 'Media',
      [IssuePriority.High]: 'Alta',
      [IssuePriority.Critical]: 'Crítica'
    },
    IssueType: {
      [IssueType.UserStory]: 'Historia de Usuario',
      [IssueType.Bug]: 'Bug',
      [IssueType.Task]: 'Tarea'
    },
    UserRole: {
      [UserRole.Admin]: 'Administrador',
      [UserRole.Manager]: 'Gerente',
      [UserRole.Developer]: 'Desarrollador',
      [UserRole.Viewer]: 'Espectador'
    }
  };

  transform(value: number, enumType: string): string {
    return this.labels[enumType]?.[value] || 'Unknown';
  }
}
