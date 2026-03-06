import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationService } from '../../services/notification.service';
import { MathCaptcha } from '../math-captcha/math-captcha';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, MathCaptcha],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly code2FA = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly needs2FA = signal(false);
  protected readonly captchaSolved = signal(false);
  protected readonly showPassword = signal(false);

  protected toggleShowPassword(): void {
    this.showPassword.update((val) => !val);
  }

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
        this.error.set(this.notificationService.handleHttpError(err));
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
        this.error.set(this.notificationService.handleHttpError(err));
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
