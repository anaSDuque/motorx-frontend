import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
})
export class Layout {
  protected readonly authService = inject(AuthService);

  protected get userName(): string {
    return this.authService.currentUser()?.name ?? this.authService.getStoredUserName() ?? 'Usuario';
  }

  protected get isAdmin(): boolean {
    return this.authService.getStoredRole() === 'ADMIN';
  }

  protected get isEmployee(): boolean {
    return this.authService.getStoredRole() === 'EMPLOYEE';
  }

  protected get isClient(): boolean {
    return !this.isAdmin && !this.isEmployee;
  }

  protected get canAccessStaffModules(): boolean {
    return this.isAdmin || this.isEmployee;
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  protected onLogout(): void {
    this.authService.logout().subscribe({
      next: () => { },
      error: () => this.authService.clearSession(),
    });
  }
}
