import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);

  protected get userName(): string {
    return this.authService.currentUser()?.name ?? this.authService.getStoredUserName() ?? 'Usuario';
  }

  protected get isAdmin(): boolean {
    return this.authService.getStoredRole() === 'ADMIN';
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  protected onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {},
      error: () => this.authService.clearSession(),
    });
  }
}
