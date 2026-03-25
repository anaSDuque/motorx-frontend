import { Component, signal, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PasswordResetService } from '../../services/password-reset.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
})
export class ForgotPassword {
  private readonly passwordResetService = inject(PasswordResetService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  });
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly message = signal('');

  protected get emailControl(): FormControl<string> {
    return this.form.controls.email;
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();

    const normalizedEmail = this.emailControl.value.trim().toLowerCase();
    this.emailControl.setValue(normalizedEmail, { emitEvent: false });

    if (this.form.invalid) {
      this.error.set('Ingresa un correo electrónico válido');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.passwordResetService.requestReset({ email: normalizedEmail }).subscribe({
      next: () => {
        this.loading.set(false);
        this.message.set('Se envió el correo de restablecimiento. Revisa tu bandeja.');
        this.router.navigate(['/reset-password'], { queryParams: { email: normalizedEmail } });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.notificationService.handleHttpError(err));
      },
    });
  }
}
