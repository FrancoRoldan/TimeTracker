import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { UserRole } from '../core/enums';

export const RoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as UserRole[];

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const hasRequiredRole = authService.hasRole(requiredRoles);

  if (!hasRequiredRole) {
    console.warn('Access denied: User does not have required role');
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
