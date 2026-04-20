import { Component, signal, computed, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PasswordResetService } from '../../services/password-reset.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationService } from '../../services/notification.service';

const CODE_VALIDITY_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 30;

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
})
export class ResetPassword implements OnInit, OnDestroy {
  private readonly passwordResetService = inject(PasswordResetService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService);
  private codeCountdownTimer: ReturnType<typeof setInterval> | null = null;
  private resendCountdownTimer: ReturnType<typeof setInterval> | null = null;

  // Code digits — 6 separate boxes
  protected readonly codeDigits = signal<string[]>(['', '', '', '', '', '']);
  protected readonly fullCode = computed(() => this.codeDigits().join(''));

  protected readonly form = new FormGroup({
    newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal(false);
  protected readonly resendLoading = signal(false);
  protected readonly resendMessage = signal('');
  protected readonly email = signal('');
  protected readonly codeRemainingSeconds = signal(CODE_VALIDITY_SECONDS);
  protected readonly resendCooldownSeconds = signal(0);
  protected readonly formattedCodeRemaining = computed(() => this.formatAsMinutesSeconds(this.codeRemainingSeconds()));
  protected readonly formattedResendCooldown = computed(() => this.formatAsMinutesSeconds(this.resendCooldownSeconds()));
  protected readonly canResend = computed(() => this.resendCooldownSeconds() === 0);

  ngOnInit(): void {
    const rawEmail = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.email.set(rawEmail.trim().toLowerCase());

    const sentAt = Number(this.route.snapshot.queryParamMap.get('sentAt') ?? 0);
    if (Number.isFinite(sentAt) && sentAt > 0) {
      const elapsedSeconds = Math.floor((Date.now() - sentAt) / 1000);
      const remainingCode = Math.max(CODE_VALIDITY_SECONDS - elapsedSeconds, 0);
      const remainingCooldown = Math.max(RESEND_COOLDOWN_SECONDS - elapsedSeconds, 0);

      this.startCodeCountdown(remainingCode);
      this.startResendCooldown(remainingCooldown);
      return;
    }

    this.startCodeCountdown(CODE_VALIDITY_SECONDS);
  }

  ngOnDestroy(): void {
    this.clearCodeCountdown();
    this.clearResendCountdown();
  }

  protected toggleShowPassword(): void {
    this.showPassword.update((val) => !val);
  }

  // Visibility toggles
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  // Password validation
  protected readonly pwdHasUppercase = computed(() => /[A-Z]/.test(this.newPasswordControl.value));
  protected readonly pwdHasNumber = computed(() => /[0-9]/.test(this.newPasswordControl.value));
  protected readonly pwdHasSpecial = computed(() => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.newPasswordControl.value));
  protected readonly pwdHasMinLength = computed(() => this.newPasswordControl.value.length >= 8);
  protected readonly pwdValid = computed(
    () => this.pwdHasUppercase() && this.pwdHasNumber() && this.pwdHasSpecial() && this.pwdHasMinLength()
  );
  protected readonly passwordsMatch = computed(
    () => this.newPasswordControl.value === this.confirmPasswordControl.value && this.confirmPasswordControl.value.length > 0
  );

  protected get newPasswordControl(): FormControl<string> {
    return this.form.controls.newPassword;
  }

  protected get confirmPasswordControl(): FormControl<string> {
    return this.form.controls.confirmPassword;
  }

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
    this.form.markAllAsTouched();

    if (!/^\d{6}$/.test(this.fullCode())) {
      this.error.set('Ingresa el código completo de 6 dígitos');
      return;
    }
    if (!this.newPasswordControl.value || !this.confirmPasswordControl.value) {
      this.error.set('Completa todos los campos obligatorios');
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
      .resetPassword({ token: this.fullCode(), newPassword: this.newPasswordControl.value })
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

  protected onResendCode(): void {
    if (!this.email()) {
      this.error.set('No se encontró el correo para reenviar el código. Vuelve al paso anterior.');
      return;
    }

    if (!this.canResend() || this.resendLoading()) {
      return;
    }

    this.resendLoading.set(true);
    this.error.set('');
    this.resendMessage.set('');
    this.startResendCooldown(RESEND_COOLDOWN_SECONDS);

    this.passwordResetService.requestReset({ email: this.email() }).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.codeDigits.set(['', '', '', '', '', '']);
        this.startCodeCountdown(CODE_VALIDITY_SECONDS);
        this.resendMessage.set('Código reenviado. Revisa tu correo.');

        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { sentAt: Date.now() },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      },
      error: (err) => {
        this.resendLoading.set(false);
        this.error.set(this.notificationService.handleHttpError(err));
      },
    });
  }

  private startCodeCountdown(seconds: number): void {
    this.clearCodeCountdown();
    this.codeRemainingSeconds.set(seconds);

    if (seconds <= 0) {
      return;
    }

    this.codeCountdownTimer = setInterval(() => {
      const next = this.codeRemainingSeconds() - 1;
      this.codeRemainingSeconds.set(Math.max(next, 0));

      if (next <= 0) {
        this.clearCodeCountdown();
      }
    }, 1000);
  }

  private startResendCooldown(seconds: number): void {
    this.clearResendCountdown();
    this.resendCooldownSeconds.set(seconds);

    if (seconds <= 0) {
      return;
    }

    this.resendCountdownTimer = setInterval(() => {
      const next = this.resendCooldownSeconds() - 1;
      this.resendCooldownSeconds.set(Math.max(next, 0));

      if (next <= 0) {
        this.clearResendCountdown();
      }
    }, 1000);
  }

  private clearCodeCountdown(): void {
    if (this.codeCountdownTimer) {
      clearInterval(this.codeCountdownTimer);
      this.codeCountdownTimer = null;
    }
  }

  private clearResendCountdown(): void {
    if (this.resendCountdownTimer) {
      clearInterval(this.resendCountdownTimer);
      this.resendCountdownTimer = null;
    }
  }

  private formatAsMinutesSeconds(totalSeconds: number): string {
    const safeSeconds = Math.max(totalSeconds, 0);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
