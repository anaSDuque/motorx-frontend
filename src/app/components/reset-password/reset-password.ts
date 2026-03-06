import { Component, signal, computed, inject } from '@angular/core';
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

  // Code digits — 6 separate boxes
  protected readonly codeDigits = signal<string[]>(['', '', '', '', '', '']);
  protected readonly fullCode = computed(() => this.codeDigits().join(''));

  // Password fields
  protected readonly newPassword = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal(false);
  protected readonly showPassword = signal(false);

  protected toggleShowPassword(): void {
    this.showPassword.update((val) => !val);
  }

  // Touched state
  protected readonly passwordTouched = signal(false);
  protected readonly confirmPasswordTouched = signal(false);

  // Visibility toggles
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  // Password validation
  protected readonly pwdHasUppercase = computed(() => /[A-Z]/.test(this.newPassword()));
  protected readonly pwdHasNumber = computed(() => /[0-9]/.test(this.newPassword()));
  protected readonly pwdHasSpecial = computed(() => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.newPassword()));
  protected readonly pwdHasMinLength = computed(() => this.newPassword().length >= 8);
  protected readonly pwdValid = computed(
    () => this.pwdHasUppercase() && this.pwdHasNumber() && this.pwdHasSpecial() && this.pwdHasMinLength()
  );
  protected readonly passwordsMatch = computed(
    () => this.newPassword() === this.confirmPassword() && this.confirmPassword().length > 0
  );

  protected onCodeInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const digits = [...this.codeDigits()];

    if (value.length === 1 && /\d/.test(value)) {
      digits[index] = value;
      this.codeDigits.set(digits);
      // auto-focus next
      const parent = input.parentElement;
      if (parent && index < 5) {
        const nextInput = parent.querySelectorAll<HTMLInputElement>('.code-input')[index + 1];
        nextInput?.focus();
      }
    } else if (value.length > 1) {
      // Handle paste — distribute digits across boxes
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      for (let i = 0; i < 6; i++) {
        digits[i] = pasted[i] ?? '';
      }
      this.codeDigits.set(digits);
      const parent = input.parentElement;
      if (parent) {
        const inputs = parent.querySelectorAll<HTMLInputElement>('.code-input');
        const focusIdx = Math.min(pasted.length, 5);
        inputs[focusIdx]?.focus();
      }
    } else {
      digits[index] = '';
      this.codeDigits.set(digits);
    }
  }

  protected onCodeKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.codeDigits()[index]) {
      const input = event.target as HTMLInputElement;
      const parent = input.parentElement;
      if (parent && index > 0) {
        const prevInput = parent.querySelectorAll<HTMLInputElement>('.code-input')[index - 1];
        prevInput?.focus();
      }
    }
  }

  protected onSubmit(): void {
    this.passwordTouched.set(true);
    this.confirmPasswordTouched.set(true);

    if (this.fullCode().length !== 6) {
      this.error.set('Ingresa el código completo de 6 dígitos');
      return;
    }
    if (!this.pwdValid()) {
      this.error.set('La contraseña no cumple con los requisitos');
      return;
    }
    if (!this.passwordsMatch()) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.passwordResetService
      .resetPassword({ token: this.fullCode(), newPassword: this.newPassword() })
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
