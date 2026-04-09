import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReceptionService } from '../../services/reception.service';

@Component({
  selector: 'app-reception',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reception.html',
  styleUrl: './reception.css',
})
export class Reception {
  private readonly receptionService = inject(ReceptionService);

  protected readonly appointmentId = signal<number | null>(null);
  protected readonly licensePlate = signal('');
  protected readonly verificationCode = signal('');

  protected readonly loadingInitiate = signal(false);
  protected readonly loadingConfirm = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected initiateReception(): void {
    const appointmentId = this.appointmentId();
    if (!appointmentId) {
      this.error.set('Debes ingresar un ID de cita válido');
      return;
    }

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
    if (!this.licensePlate() || !this.verificationCode()) {
      this.error.set('Debes ingresar placa y código de verificación');
      return;
    }

    this.loadingConfirm.set(true);
    this.error.set('');
    this.success.set('');

    this.receptionService
      .confirmReception({
        licensePlate: this.licensePlate(),
        verificationCode: this.verificationCode(),
      })
      .subscribe({
        next: (res) => {
          this.loadingConfirm.set(false);
          this.success.set(res.message || 'Recepción confirmada correctamente');
          this.licensePlate.set('');
          this.verificationCode.set('');
        },
        error: (err) => {
          this.loadingConfirm.set(false);
          this.error.set(err.error?.message ?? 'Error al confirmar la recepción');
        },
      });
  }
}
