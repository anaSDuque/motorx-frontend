import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReceptionService } from '../../services/reception.service';
import { AdminAppointmentService } from '../../services/admin-appointment.service';
import { AppointmentResponseDTO, AppointmentStatus } from '../../models';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-reception',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './reception.html',
  styleUrl: './reception.css',
})
export class Reception implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly receptionService = inject(ReceptionService);
  private readonly appointmentService = inject(AdminAppointmentService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly initiateForm = this.fb.group({
    appointmentId: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  protected readonly confirmForm = this.fb.group({
    licensePlate: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{5,8}$/)]],
    verificationCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
  });

  protected readonly loadingInitiate = signal(false);
  protected readonly loadingConfirm = signal(false);
  protected readonly loadingAppointments = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly upcomingAppointments = signal<AppointmentResponseDTO[]>([]);

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const appointmentId = Number(params.get('appointmentId') ?? 0);
      if (appointmentId > 0) {
        this.initiateForm.controls.appointmentId.setValue(appointmentId);
      }
    });
  }

  ngOnInit(): void {
    this.loadUpcomingAppointments();
  }

  protected loadUpcomingAppointments(): void {
    this.loadingAppointments.set(true);
    this.error.set('');

    const dates = this.getReceptionDates();
    const requests = dates.map((date) => this.appointmentService.getAgenda(date));

    forkJoin(requests).subscribe({
      next: (results) => {
        const flattened = results.flat();
        const filtered = flattened.filter((apt) => this.isReceptionRangeStatus(apt.status));
        const sorted = filtered.sort((a, b) => {
          const dateA = `${a.appointmentDate}T${a.startTime}`;
          const dateB = `${b.appointmentDate}T${b.startTime}`;
          return dateA.localeCompare(dateB);
        });
        this.upcomingAppointments.set(sorted);
        this.loadingAppointments.set(false);
      },
      error: (err) => {
        this.loadingAppointments.set(false);
        this.error.set(err.error?.message ?? 'Error al cargar las citas próximas');
      },
    });
  }

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

  protected goToReception(appointmentId: number): void {
    this.router.navigate(['/reception'], {
      queryParams: { appointmentId },
      queryParamsHandling: 'merge',
    });
  }

  protected getAppointmentLabel(apt: AppointmentResponseDTO): string {
    return `${apt.appointmentDate} ${apt.startTime} - ${apt.vehiclePlate} - ${apt.clientFullName}`;
  }

  private getReceptionDates(): string[] {
    const today = new Date();
    const dates = [0, 1, 2].map((offset) => {
      const next = new Date(today);
      next.setDate(today.getDate() + offset);
      return next.toISOString().split('T')[0];
    });
    return dates;
  }

  private isReceptionRangeStatus(status: AppointmentStatus): boolean {
    return [AppointmentStatus.SCHEDULED, AppointmentStatus.AWAITING_CONFIRMATION, AppointmentStatus.IN_PROGRESS].includes(status);
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
