import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PasswordResetService } from '../../services/password-reset.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private readonly passwordResetService = inject(PasswordResetService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  protected readonly token = signal('');
  protected readonly newPassword = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal(false);
  protected readonly showPassword = signal(false);

  protected toggleShowPassword(): void {
    this.showPassword.update((val) => !val);
  }

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
          this.error.set(this.notificationService.handleHttpError(err));
        },
      });
  }
}
