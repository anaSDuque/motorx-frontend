import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
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
        this.router.navigate(['/reset-password']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Error al procesar la solicitud');
      },
    });
  }
}
