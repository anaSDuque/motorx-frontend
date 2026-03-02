import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PasswordResetService } from '../../services/password-reset.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private readonly passwordResetService = inject(PasswordResetService);
  private readonly router = inject(Router);

  protected readonly token = signal('');
  protected readonly newPassword = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal(false);

  protected onSubmit(): void {
    this.loading.set(true);
    this.error.set('');

    this.passwordResetService
      .resetPassword({ token: this.token(), newPassword: this.newPassword() })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.success.set(true);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? 'Token inválido o expirado');
        },
      });
  }
}
