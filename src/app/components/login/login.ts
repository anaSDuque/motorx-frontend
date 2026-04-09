import { Component, signal, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationService } from '../../services/notification.service';
import { MathCaptcha } from '../math-captcha/math-captcha';
import { AboutUs } from '../about-us/about-us';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, MathCaptcha, AboutUs],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; 

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  protected readonly loginForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly code2FA = signal('');
  // 2FA code as six separate boxes
  protected readonly codeDigits = signal<string[]>(['', '', '', '', '', '']);
  protected readonly fullCode = computed(() => this.codeDigits().join(''));
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly needs2FA = signal(false);
  protected readonly captchaSolved = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly showAboutUsModal = signal(false);

  protected openAboutUsModal(): void {
    this.showAboutUsModal.set(true);
  }

  protected closeAboutUsModal(): void {
    this.showAboutUsModal.set(false);
  }

  protected toggleShowPassword(): void {
    this.showPassword.update((val) => !val);
  }

  protected readonly emailValid = computed(() => Login.EMAIL_REGEX.test(this.emailControl.value.trim().toLowerCase()));
  protected readonly passwordValid = computed(() => this.passwordControl.value.trim().length > 0);

  protected get emailControl(): FormControl<string> {
    return this.loginForm.controls.email;
  }

  protected get passwordControl(): FormControl<string> {
    return this.loginForm.controls.password;
  }

  protected onLogin(): void {
    this.loginForm.markAllAsTouched();

    const normalizedEmail = this.emailControl.value.trim().toLowerCase();
    this.emailControl.setValue(normalizedEmail, { emitEvent: false });

    if (this.loginForm.invalid) {
      this.error.set('Completa todos los campos del formulario');
      return;
    }
    if (!this.emailValid()) {
      this.error.set('Ingresa un correo electrónico válido');
      return;
    }
    if (!this.captchaSolved()) {
      this.error.set('Completa el captcha para continuar');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.login({ email: normalizedEmail, password: this.passwordControl.value }).subscribe({
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
    if (!/^\d{6}$/.test(this.fullCode())) {
      this.error.set('Ingresa el código de verificación de 6 dígitos');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    // Use the joined digits as the verification code
    this.authService.verify2FA({ email: this.emailControl.value.trim().toLowerCase(), code: this.fullCode() }).subscribe({
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

  protected onCodeInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const digits = [...this.codeDigits()];

    if (value.length === 1 && /\d/.test(value)) {
      digits[index] = value;
      this.codeDigits.set(digits);
      const parent = input.parentElement;
      if (parent && index < 5) {
        const nextInput = parent.querySelectorAll<HTMLInputElement>('.code-input')[index + 1];
        nextInput?.focus();
      }
    } else if (value.length > 1) {
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

  private navigateByRole(role: Role | string): void {
    if (role === Role.ADMIN) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
