import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PasswordResetService } from '../../services/password-reset.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
})
export class ForgotPassword {
  private readonly passwordResetService = inject(PasswordResetService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly message = signal('');
  protected readonly emailTouched = signal(false);

  protected onSubmit(): void {
    this.emailTouched.set(true);

    if (!this.email().trim()) {
      this.error.set('Ingresa tu correo electrónico');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.passwordResetService.requestReset({ email: this.email() }).subscribe({
      next: () => {
        this.loading.set(false);
        this.message.set('Se envió el correo de restablecimiento. Revisa tu bandeja.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.notificationService.handleHttpError(err));
      },
    });
  }
}
