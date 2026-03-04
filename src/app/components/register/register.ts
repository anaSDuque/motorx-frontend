import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly name = signal('');
  protected readonly dni = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly phone = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly fieldErrors = signal<Record<string, string>>({});

  // Touched states
  protected readonly nameTouched = signal(false);
  protected readonly dniTouched = signal(false);
  protected readonly emailTouched = signal(false);
  protected readonly passwordTouched = signal(false);
  protected readonly confirmPasswordTouched = signal(false);
  protected readonly phoneTouched = signal(false);

  // Password visibility
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  // Password validation
  protected readonly pwdHasUppercase = computed(() => /[A-Z]/.test(this.password()));
  protected readonly pwdHasNumber = computed(() => /[0-9]/.test(this.password()));
  protected readonly pwdHasSpecial = computed(() => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.password()));
  protected readonly pwdHasMinLength = computed(() => this.password().length >= 8);
  protected readonly pwdValid = computed(
    () => this.pwdHasUppercase() && this.pwdHasNumber() && this.pwdHasSpecial() && this.pwdHasMinLength()
  );
  protected readonly passwordsMatch = computed(
    () => this.password() === this.confirmPassword() && this.confirmPassword().length > 0
  );

  protected onRegister(): void {
    this.nameTouched.set(true);
    this.dniTouched.set(true);
    this.emailTouched.set(true);
    this.passwordTouched.set(true);
    this.confirmPasswordTouched.set(true);
    this.phoneTouched.set(true);

    if (!this.name().trim() || !this.dni().trim() || !this.email().trim() || !this.password() || !this.phone().trim()) {
      this.error.set('Completa todos los campos del formulario');
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

    const fullPhone = '+57' + this.phone().replace(/\s/g, '');

    this.authService
      .register({
        name: this.name(),
        dni: this.dni(),
        email: this.email(),
        password: this.password(),
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
          this.error.set(err.error?.message ?? 'Error al registrarse');
        },
      });
  }
}
