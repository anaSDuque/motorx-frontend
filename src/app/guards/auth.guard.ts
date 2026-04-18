import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models';

function isStaffRole(role: Role | null): boolean {
  return (
    role === Role.RECEPTIONIST ||
    role === Role.WARE_HOUSE_WORKER ||
    role === Role.TECHNICIAN ||
    role === Role.EMPLOYEE
  );
}

function isWarehouseRole(role: Role | null): boolean {
  return role === Role.WARE_HOUSE_WORKER;
}

function isReceptionRole(role: Role | null): boolean {
  return role === Role.RECEPTIONIST || role === Role.EMPLOYEE;
}

function redirectToRoleHome(router: Router, role: Role | null): void {
  if (role === Role.ADMIN) {
    router.navigate(['/admin/dashboard']);
    return;
  }

  if (isWarehouseRole(role)) {
    router.navigate(['/warehouse/home']);
    return;
  }

  if (isReceptionRole(role)) {
    router.navigate(['/reception']);
    return;
  }
  router.navigate(['/dashboard']);
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

  if (authService.isLoggedIn() && authService.getStoredRole() === Role.ADMIN) {
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
  redirectToRoleHome(router, role);
  return false;
};

export const staffGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.getStoredRole();
  if (authService.isLoggedIn() && (role === Role.ADMIN || isStaffRole(role))) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

export const warehouseGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const role = authService.getStoredRole();

  if (authService.isLoggedIn() && (role === Role.ADMIN || isWarehouseRole(role))) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

export const receptionGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const role = authService.getStoredRole();

  if (authService.isLoggedIn() && (role === Role.ADMIN || isReceptionRole(role))) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

