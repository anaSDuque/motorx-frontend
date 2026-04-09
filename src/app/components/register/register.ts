import { Component, signal, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationService } from '../../services/notification.service';
import { MathCaptcha } from '../math-captcha/math-captcha';
import { AboutUs } from '../about-us/about-us';

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '') as string;
  const hasUppercase = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(value);
  const minLength = value.length >= 8;
  return hasUppercase && hasNumber && hasSpecial && minLength ? null : { passwordStrength: true };
}

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordsMismatch: true };

}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, MathCaptcha, AboutUs],
  templateUrl: './register.html',
  styleUrls: ['./register.css'], 
})
export class Register { 
  private static readonly DNI_REGEX = /^\d{6,12}$/;
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  private static readonly PHONE_REGEX = /^\d{7,10}$/;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  protected readonly registerForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    dni: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(Register.DNI_REGEX)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(Register.PHONE_REGEX)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8), passwordStrengthValidator] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    acceptDataTreatment: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  }, { validators: passwordsMatchValidator });

  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly captchaSolved = signal(false);
  protected readonly showDataTreatmentModal = signal(false);
  protected readonly showAboutUsModal = signal(false);

  constructor() {
    this.dniControl.valueChanges.subscribe((value) => {
      const str = value == null ? '' : String(value);
      const sanitized = str.replace(/\D/g, '').slice(0, 12);
      if (sanitized !== str) this.dniControl.setValue(sanitized, { emitEvent: false });
    });
    this.phoneControl.valueChanges.subscribe((value) => {
      const str = value == null ? '' : String(value);
      const sanitized = str.replace(/\D/g, '').slice(0, 10);
      if (sanitized !== str) this.phoneControl.setValue(sanitized, { emitEvent: false });
    });
  }

  protected openAboutUsModal(): void {
    this.showAboutUsModal.set(true);
  }

  protected closeAboutUsModal(): void {
    this.showAboutUsModal.set(false);
  }

  protected openDataTreatmentModal(): void {
    this.showDataTreatmentModal.set(true);
  }

  protected closeDataTreatmentModal(): void {
    this.showDataTreatmentModal.set(false);
  }

  protected toggleShowPassword(): void {
    this.showPassword.update((val) => !val);
  }

  // Password visibility
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  protected toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  // Password validation
  protected readonly pwdHasUppercase = computed(() => /[A-Z]/.test(this.passwordControl.value));
  protected readonly pwdHasNumber = computed(() => /[0-9]/.test(this.passwordControl.value));
  protected readonly pwdHasSpecial = computed(() => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.passwordControl.value));
  protected readonly pwdHasMinLength = computed(() => this.passwordControl.value.length >= 8);
  protected readonly pwdValid = computed(
    () => this.pwdHasUppercase() && this.pwdHasNumber() && this.pwdHasSpecial() && this.pwdHasMinLength()
  );
  protected readonly passwordsMatch = computed(
    () => this.passwordControl.value === this.confirmPasswordControl.value && this.confirmPasswordControl.value.length > 0
  );
  protected readonly dniValid = computed(() => Register.DNI_REGEX.test(this.dniControl.value));
  protected readonly emailValid = computed(() => Register.EMAIL_REGEX.test(this.emailControl.value));
  protected readonly phoneValid = computed(() => Register.PHONE_REGEX.test(this.phoneControl.value));

  protected get nameControl(): FormControl<string> {
    return this.registerForm.controls.name;
  }

  protected get dniControl(): FormControl<string> {
    return this.registerForm.controls.dni;
  }

  protected get emailControl(): FormControl<string> {
    return this.registerForm.controls.email;
  }

  protected get phoneControl(): FormControl<string> {
    return this.registerForm.controls.phone;
  }

  protected get passwordControl(): FormControl<string> {
    return this.registerForm.controls.password;
  }

  protected get confirmPasswordControl(): FormControl<string> {
    return this.registerForm.controls.confirmPassword;
  }

  protected get acceptDataTreatmentControl(): FormControl<boolean> {
    return this.registerForm.controls.acceptDataTreatment;
  }

  protected sanitizeDni(value: string): void {
    this.dniControl.setValue(value.replace(/\D/g, '').slice(0, 12), { emitEvent: false });
  }

  protected sanitizePhone(value: string): void {
    this.phoneControl.setValue(value.replace(/\D/g, '').slice(0, 10), { emitEvent: false });
  }

  protected onRegister(): void {
    this.registerForm.markAllAsTouched();

    const normalizedName = this.nameControl.value.trim().replace(/\s+/g, ' ');
    const normalizedDni = this.dniControl.value.replace(/\D/g, '');
    const normalizedEmail = this.emailControl.value.trim().toLowerCase();
    const normalizedPhone = this.phoneControl.value.replace(/\D/g, '');

    this.nameControl.setValue(normalizedName, { emitEvent: false });
    this.dniControl.setValue(normalizedDni, { emitEvent: false });
    this.emailControl.setValue(normalizedEmail, { emitEvent: false });
    this.phoneControl.setValue(normalizedPhone, { emitEvent: false });

    if (!normalizedName || !normalizedDni || !normalizedEmail || !this.passwordControl.value.trim() || !normalizedPhone) {
      this.error.set('Completa todos los campos del formulario');
      return;
    }
    if (!this.dniValid()) {
      this.error.set('El número de identificación debe contener solo números (6 a 12 dígitos)');
      return;
    }
    if (!this.emailValid()) {
      this.error.set('Ingresa un correo electrónico válido');
      return;
    }
    if (!this.phoneValid()) {
      this.error.set('Ingresa un número de teléfono válido (7 a 10 dígitos)');
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
    this.fieldErrors.set({});

    if (!this.acceptDataTreatmentControl.value) {
      this.error.set('Debe aceptar el tratamiento de sus datos para continuar.');
      this.loading.set(false);
      return;
    }
    const fullPhone = '+57' + normalizedPhone;

    this.authService
      .register({
        name: normalizedName,
        dni: normalizedDni,
        email: normalizedEmail,
        password: this.passwordControl.value,
        phone: fullPhone,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          if (err.error?.details) {
            this.fieldErrors.set(err.error.details);
          }
          this.error.set(this.notificationService.handleHttpError(err));
        },
      });
  }
}
