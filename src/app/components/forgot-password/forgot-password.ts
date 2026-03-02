import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PasswordResetService } from '../../services/password-reset.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly passwordResetService = inject(PasswordResetService);

  protected readonly email = signal('');
  protected readonly loading = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');

  protected onSubmit(): void {
    this.loading.set(true);
    this.error.set('');
    this.message.set('');

    this.passwordResetService.requestReset({ email: this.email() }).subscribe({
      next: (msg) => {
        this.loading.set(false);
        this.message.set('Si el correo existe, se ha enviado un código de recuperación.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Error al procesar la solicitud');
      },
    });
  }
}
