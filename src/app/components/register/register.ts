import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationService } from '../../services/notification.service';
import { LanguageService } from '../../services/language.service';
import { MathCaptcha } from '../math-captcha/math-captcha';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, MathCaptcha],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  protected readonly name = signal('');
  protected readonly dni = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly phone = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly acceptDataTreatment = signal(false);
  protected readonly captchaSolved = signal(false);
  protected readonly showPassword = signal(false);

  protected toggleShowPassword(): void {
    this.showPassword.update((val) => !val);
  }

  protected onRegister(): void {
    this.loading.set(true);
    this.error.set('');
    this.fieldErrors.set({});

    if (!this.acceptDataTreatment()) {
      this.error.set('Debe aceptar el tratamiento de sus datos para continuar.');
      this.loading.set(false);
      return;
    }

    this.authService
      .register({
        name: this.name(),
        dni: this.dni(),
        email: this.email(),
        password: this.password(),
        phone: this.phone(),
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
