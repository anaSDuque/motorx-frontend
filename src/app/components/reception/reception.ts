import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReceptionService } from '../../services/reception.service';

@Component({
  selector: 'app-reception',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './reception.html',
  styleUrl: './reception.css',
})
export class Reception {
  private readonly fb = inject(FormBuilder);
  private readonly receptionService = inject(ReceptionService);

  protected readonly initiateForm = this.fb.group({
    appointmentId: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  protected readonly confirmForm = this.fb.group({
    licensePlate: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{5,8}$/)]],
    verificationCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
  });

  protected readonly loadingInitiate = signal(false);
  protected readonly loadingConfirm = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected initiateReception(): void {
    this.initiateForm.markAllAsTouched();
    if (this.initiateForm.invalid) {
      this.error.set('Debes ingresar un ID de cita válido.');
      return;
    }

    const appointmentId = Number(this.initiateForm.controls.appointmentId.value);

    this.loadingInitiate.set(true);
    this.error.set('');
    this.success.set('');

    this.receptionService.initiateReception(appointmentId).subscribe({
      next: (res) => {
        this.loadingInitiate.set(false);
        this.success.set(res.message || 'Recepción iniciada correctamente');
      },
      error: (err) => {
        this.loadingInitiate.set(false);
        this.error.set(err.error?.message ?? 'Error al iniciar la recepción');
      },
    });
  }

  protected confirmReception(): void {
    this.confirmForm.markAllAsTouched();
    if (this.confirmForm.invalid) {
      this.error.set('Debes ingresar placa válida y código de 4 dígitos.');
      return;
    }

    const raw = this.confirmForm.getRawValue();
    const licensePlate = raw.licensePlate?.trim().toUpperCase() ?? '';
    const verificationCode = raw.verificationCode?.trim() ?? '';

    this.loadingConfirm.set(true);
    this.error.set('');
    this.success.set('');

    this.receptionService
      .confirmReception({
        licensePlate,
        verificationCode,
      })
      .subscribe({
        next: (res) => {
          this.loadingConfirm.set(false);
          this.success.set(res.message || 'Recepción confirmada correctamente');
          this.confirmForm.reset({ licensePlate: '', verificationCode: '' });
        },
        error: (err) => {
          this.loadingConfirm.set(false);
          this.error.set(err.error?.message ?? 'Error al confirmar la recepción');
        },
      });
  }

  protected hasInitiateError(controlName: 'appointmentId', errorName: string): boolean {
    const control = this.initiateForm.controls[controlName];
    return control.touched && control.hasError(errorName);
  }

  protected hasConfirmError(controlName: 'licensePlate' | 'verificationCode', errorName: string): boolean {
    const control = this.confirmForm.controls[controlName];
    return control.touched && control.hasError(errorName);
  }
}
