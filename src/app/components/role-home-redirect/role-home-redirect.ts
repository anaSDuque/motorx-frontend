import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmployeePosition, Role } from '../../models';

@Component({
  selector: 'app-role-home-redirect',
  standalone: true,
  template: '',
})
export class RoleHomeRedirect implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const role = this.authService.getStoredRole();
    const position = this.authService.getStoredEmployeePosition();

    if (role === Role.ADMIN) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    if (role === Role.EMPLOYEE && position === EmployeePosition.WAREHOUSE_WORKER) {
      this.router.navigate(['/warehouse/home']);
      return;
    }

    if (role === Role.EMPLOYEE) {
      this.router.navigate(['/reception']);
      return;
    }

    this.router.navigate(['/dashboard']);
  }
}

