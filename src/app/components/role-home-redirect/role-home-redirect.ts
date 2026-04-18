import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models';

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

    if (role === Role.ADMIN) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    if (role === Role.WARE_HOUSE_WORKER) {
      this.router.navigate(['/warehouse/home']);
      return;
    }

    if (role === Role.RECEPTIONIST || role === Role.EMPLOYEE) {
      this.router.navigate(['/reception']);
      return;
    }

    this.router.navigate(['/dashboard']);
  }
}

