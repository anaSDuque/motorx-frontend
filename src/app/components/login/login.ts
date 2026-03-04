import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly code2FA = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly needs2FA = signal(false);

  protected readonly emailTouched = signal(false);
  protected readonly passwordTouched = signal(false);

  protected onLogin(): void {
    this.emailTouched.set(true);
    this.passwordTouched.set(true);

    if (!this.email().trim() || !this.password()) {
      this.error.set('Completa todos los campos del formulario');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.login({ email: this.email(), password: this.password() }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if ('token' in res && res.token) {
          this.authService.handleAuthResponse(res);
          this.navigateByRole(res.role);
        } else {
          this.needs2FA.set(true);
        }
      },
      error: (err) => {
        this.loading.set(false);
        let msg = 'Credenciales inválidas';
        if (typeof err.error === 'string') {
          try {
            const parsed = JSON.parse(err.error);
            msg = parsed.message ?? msg;
          } catch {
            msg = err.error || msg;
          }
        } else if (err.error?.message) {
          msg = err.error.message;
        }
        this.error.set(msg);
      },
    });
  }

  protected onVerify2FA(): void {
    this.loading.set(true);
    this.error.set('');

    this.authService.verify2FA({ email: this.email(), code: this.code2FA() }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.navigateByRole(res.role);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Código inválido o expirado');
      },
    });
  }

  private navigateByRole(role: Role | string): void {
    if (role === Role.ADMIN) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
