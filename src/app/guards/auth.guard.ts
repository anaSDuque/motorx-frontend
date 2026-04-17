import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { EmployeePosition } from '../models';

function isEmployeeWithPositionOrFallback(
  authService: AuthService,
  allowedPositions: EmployeePosition[]
): boolean {
  const role = authService.getStoredRole();
  if (role === 'ADMIN') return true;
  if (role !== 'EMPLOYEE') return false;

  const position = authService.getStoredEmployeePosition();
  // Compatibilidad: si el token aún no expone posición, se mantiene acceso por rol EMPLOYEE.
  if (!position) return true;

  return allowedPositions.includes(position);
}

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.getStoredRole() === 'ADMIN') {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }
  const role = authService.getStoredRole();
  const position = authService.getStoredEmployeePosition();
  if (role === 'ADMIN') {
    router.navigate(['/admin/dashboard']);
  } else if (role === 'EMPLOYEE' && position === EmployeePosition.WAREHOUSE_WORKER) {
    router.navigate(['/warehouse/home']);
  } else if (role === 'EMPLOYEE') {
    router.navigate(['/reception']);
  } else {
    router.navigate(['/dashboard']);
  }
  return false;
};

export const staffGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.getStoredRole();
  if (authService.isLoggedIn() && (role === 'ADMIN' || role === 'EMPLOYEE')) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

export const warehouseGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (
    authService.isLoggedIn() &&
    isEmployeeWithPositionOrFallback(authService, [EmployeePosition.WAREHOUSE_WORKER])
  ) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

export const receptionGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (
    authService.isLoggedIn() &&
    isEmployeeWithPositionOrFallback(authService, [EmployeePosition.RECEPCIONISTA])
  ) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

