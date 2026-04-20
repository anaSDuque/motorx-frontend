import { Component, inject, signal, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserAppointmentService } from '../../services/user-appointment.service';
import { UserVehicleService } from '../../services/user-vehicle.service';
import {
  VehicleResponseDTO,
  AvailableSlotDTO,
  LicensePlateRestrictionResponseDTO,
  AppointmentType,
} from '../../models';

@Component({
  selector: 'app-create-appointment',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './create-appointment.html',
  styleUrls: ['./create-appointment.css'],
})
export class CreateAppointment implements OnInit {
  private readonly appointmentService = inject(UserAppointmentService);
  private readonly vehicleService = inject(UserVehicleService);
  private readonly router = inject(Router);

  protected readonly vehicles = signal<VehicleResponseDTO[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  // Step tracking
  protected readonly step = signal(1);

  // Step 1: Select vehicle & type
  protected readonly selectedVehicleId = signal<number | null>(null);
  protected readonly selectedType = signal<AppointmentType | ''>('');
  protected readonly appointmentDate = signal('');

  // Pico y placa
  protected readonly plateRestriction = signal<LicensePlateRestrictionResponseDTO | null>(null);
  protected readonly checkingPlate = signal(false);
  protected readonly plateOk = signal(false);

  // Rework info
  protected readonly showReworkInfo = signal(false);
  protected readonly reworkInfo = signal<{ message: string; whatsappLink: string; phoneNumber: string; businessHours: string } | null>(null);

  // Step 2: Select slot
  protected readonly availableSlots = signal<AvailableSlotDTO[]>([]);
  protected readonly loadingSlots = signal(false);
  protected readonly selectedSlot = signal<AvailableSlotDTO | null>(null);

  // Step 3: Details
  protected readonly currentMileage = signal<number>(0);
  protected readonly currentMileageTouched = signal(false);
  protected readonly clientNotes = signal('');

  protected readonly selectedVehicleControl = new FormControl<number | null>(null);
  protected readonly selectedTypeControl = new FormControl<AppointmentType | ''>('', { nonNullable: true });
  protected readonly appointmentDateControl = new FormControl('', { nonNullable: true });
  protected readonly currentMileageControl = new FormControl(0, { nonNullable: true });
  protected readonly clientNotesControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.selectedVehicleControl.valueChanges.subscribe((value) => this.selectedVehicleId.set(value));
    this.selectedTypeControl.valueChanges.subscribe((value) => {
      this.selectedType.set(value);
      this.onTypeChange();
    });
    this.appointmentDateControl.valueChanges.subscribe((value) => this.onDateChange(value));
    this.currentMileageControl.valueChanges.subscribe((value) => {
      const normalized = this.normalizeMileage(value);
      if (normalized !== value) {
        this.currentMileageControl.setValue(normalized, { emitEvent: false });
      }
      this.currentMileage.set(normalized);
    });
    this.clientNotesControl.valueChanges.subscribe((value) => this.clientNotes.set(value));
  }

  protected sanitizeMileageInput(value: string): void {
    const digits = value.replace(/\D/g, '');
    const normalized = digits === '' ? 0 : Number(digits);
    this.currentMileageControl.setValue(this.normalizeMileage(normalized));
  }

  protected isCurrentMileageInvalid(): boolean {
    return !Number.isInteger(this.currentMileage()) || this.currentMileage() < 0;
  }

  private normalizeMileage(value: unknown): number {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric) || Number.isNaN(numeric)) return 0;
    return Math.max(0, Math.trunc(numeric));
  }

  protected readonly appointmentTypes = [
    { value: AppointmentType.MANUAL_WARRANTY_REVIEW, label: 'Revisión de garantía de manual' },
    { value: AppointmentType.AUTECO_WARRANTY, label: 'Garantía Auteco' },
    { value: AppointmentType.QUICK_SERVICE, label: 'Servicio rápido' },
    { value: AppointmentType.MAINTENANCE, label: 'Mantenimiento general' },
    { value: AppointmentType.OIL_CHANGE, label: 'Cambio de aceite' },
    { value: AppointmentType.REWORK, label: 'Reproceso (contactar taller)' },
  ];

  ngOnInit(): void {
    this.vehicleService.getMyVehicles().subscribe({
      next: (data) => this.vehicles.set(data),
    });
  }

  protected onTypeChange(): void {
    this.showReworkInfo.set(false);
    if (this.selectedType() === AppointmentType.REWORK) {
      this.appointmentService.getReworkInfo().subscribe({
        next: (info) => {
          this.reworkInfo.set(info);
          this.showReworkInfo.set(true);
        },
      });
    }
  }

  private isTypeNotAllowedMessage(msg?: string): boolean {
    if (!msg) return false;
    const s = msg.toLowerCase();
    const keywords = ['marca', 'no está permitido', 'no permitido', 'tipo de cita no', 'tipo no está', 'not allowed', 'not permitted'];
    return keywords.some((k) => s.includes(k));
  }

  protected isSunday(dateStr: string): boolean {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.getDay() === 0;
    } catch {
      return false;
    }
  }

  protected onDateChange(newDate: string): void {
    this.appointmentDate.set(newDate);
    // clear previous errors
    this.error.set('');
    if (!this.isFutureDate(newDate)) {
      this.error.set('La fecha de la cita debe ser futura (desde mañana).');
      return;
    }
    if (this.isSunday(newDate)) {
      this.error.set('Los domingos no están disponibles para agendar citas');
    }
  }

  protected isFutureDate(dateStr: string): boolean {
    if (!dateStr) return false;
    const selected = new Date(`${dateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected.getTime() > today.getTime();
  }

  protected checkPlateRestriction(): void {
    if (!this.selectedVehicleId() || !this.appointmentDate() || !this.selectedType()) {
      this.error.set('Selecciona vehículo, tipo y fecha para verificar pico y placa');
      return;
    }
    if (!this.isFutureDate(this.appointmentDate())) {
      this.error.set('La fecha de la cita debe ser futura (desde mañana).');
      return;
    }
    if (this.isSunday(this.appointmentDate())) {
      this.error.set('Los domingos no están disponibles para agendar citas');
      return;
    }

    this.error.set('');
    this.checkingPlate.set(true);
    this.plateRestriction.set(null);
    this.plateOk.set(false);

    this.appointmentService.checkPlateRestriction(this.selectedVehicleId()!, this.appointmentDate()).subscribe({
      next: (res) => {
        this.checkingPlate.set(false);
        this.plateRestriction.set(res);
        this.plateOk.set(!res.urgentContactMessage);
      },
      error: (err) => {
        this.checkingPlate.set(false);
        if (err.status === 409 && err.error) {
          this.plateRestriction.set(err.error);
          this.plateOk.set(!err.error.urgentContactMessage);
        }
      },
    });
  }

  protected goToStep2(): void {
    // Validate required selections before loading slots
    if (!this.selectedVehicleId() || !this.appointmentDate() || !this.selectedType()) {
      this.error.set('Selecciona vehículo, tipo y fecha antes de continuar');
      return;
    }
    if (!this.isFutureDate(this.appointmentDate())) {
      this.error.set('La fecha de la cita debe ser futura (desde mañana).');
      return;
    }
    if (this.isSunday(this.appointmentDate())) {
      this.error.set('Los domingos no están disponibles para agendar citas');
      return;
    }

    if (this.plateOk()) {
      this.error.set('');
      this.loadSlots();
      this.step.set(2);
    }
  }

  private loadSlots(): void {
    this.loadingSlots.set(true);
    this.appointmentService
      .getAvailableSlots(this.appointmentDate(), this.selectedType() as AppointmentType)
      .subscribe({
        next: (res) => {
            console.debug('[create-appointment] getAvailableSlots response:', res);
          let slots = res.availableSlots;
          // Filter out past time slots when the selected date is today
          const todayStr = new Date().toISOString().split('T')[0];
          if (this.appointmentDate() === todayStr) {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            slots = slots.filter((slot) => slot.startTime > currentTime);
          }
          this.availableSlots.set(slots);
          this.loadingSlots.set(false);
        },
        error: (err) => {
          console.error('[create-appointment] getAvailableSlots error:', err);
          this.loadingSlots.set(false);
          // Prefer backend message when available
          const serverMsg = err.error?.message;
          if (this.isTypeNotAllowedMessage(serverMsg)) {
            // return user to step 1 so they can change vehicle/type
            this.availableSlots.set([]);
            this.selectedSlot.set(null);
            this.step.set(1);
          }
          if (err.status === 400) {
            this.error.set(this.extractApiErrorMessage(err, serverMsg ?? 'Datos inválidos para consultar horarios (tipo/fecha)'));
          } else if (err.status === 409) {
            this.error.set(this.extractApiErrorMessage(err, serverMsg ?? 'No es posible consultar horarios para esta fecha.'));
          } else {
            this.error.set(this.extractApiErrorMessage(err, serverMsg ?? 'Error al cargar horarios'));
          }
        },
      });
  }

  protected selectSlot(slot: AvailableSlotDTO): void {
    this.selectedSlot.set(slot);
  }

  protected goToStep3(): void {
    if (this.selectedSlot()) {
      this.error.set('');
      this.step.set(3);
    } else {
      this.error.set('Selecciona un horario para continuar');
    }
  }

  protected goBack(): void {
    this.step.update((s) => Math.max(1, s - 1));
  }

  protected submitAppointment(): void {
    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    if (!this.selectedVehicleId() || !this.selectedType() || !this.appointmentDate() || !this.selectedSlot()) {
      this.loading.set(false);
      this.error.set('Completa todos los datos de la cita antes de confirmar');
      return;
    }
    if (!this.isFutureDate(this.appointmentDate())) {
      this.loading.set(false);
      this.error.set('La fecha de la cita debe ser futura (desde mañana).');
      return;
    }
    if (this.isSunday(this.appointmentDate())) {
      this.loading.set(false);
      this.error.set('Los domingos no están disponibles para agendar citas');
      return;
    }

    // Require mileage
    this.currentMileageTouched.set(true);
    if (!Number.isInteger(this.currentMileage()) || this.currentMileage() < 0) {
      this.loading.set(false);
      this.error.set('El kilometraje debe ser un número entero mayor o igual a 0');
      return;
    }

    // Re-validate selected slot against latest available slots to avoid server-side "out of hours" errors
    if (!this.selectedSlot()) {
      this.loading.set(false);
      this.error.set('Selecciona un horario antes de confirmar');
      return;
    }

    this.appointmentService.getAvailableSlots(this.appointmentDate(), this.selectedType() as AppointmentType).subscribe({
      next: (res) => {
        console.debug('[create-appointment] revalidate slots response:', res);
        const exists = res.availableSlots.some((s) => s.startTime === this.selectedSlot()!.startTime);
        if (!exists) {
          this.loading.set(false);
          this.error.set('El horario seleccionado ya no está disponible. Actualiza la lista de horarios.');
          // refresh available slots in UI
          this.availableSlots.set(res.availableSlots);
          return;
        }

        // proceed to create
        const notes = this.clientNotes()
          .split('\n')
          .map((n) => n.trim())
          .filter((n) => n.length > 0);
        const uniqueNotes = [...new Set(notes)];

        this.appointmentService
          .createAppointment({
            vehicleId: this.selectedVehicleId()!,
            appointmentType: this.selectedType() as AppointmentType,
            appointmentDate: this.appointmentDate(),
            startTime: this.selectedSlot()!.startTime,
            currentMileage: this.currentMileage(),
            clientNotes: uniqueNotes.length > 0 ? uniqueNotes : undefined,
          })
          .subscribe({
            next: () => {
              this.loading.set(false);
              this.success.set('Cita creada exitosamente. Redirigiendo...');
              setTimeout(() => this.router.navigate(['/appointments']), 2200);
            },
            error: (err) => {
              console.error('[create-appointment] createAppointment error:', err);
              this.loading.set(false);
              const serverMsg = err.error?.message;
              if (this.isTypeNotAllowedMessage(serverMsg)) {
                // go back to step 1 so user can change selection
                this.step.set(1);
                this.availableSlots.set([]);
                this.selectedSlot.set(null);
              }
              this.error.set(this.extractApiErrorMessage(err, serverMsg ?? 'Error al agendar la cita'));
            },
          });
      },
      error: (err) => {
        console.error('[create-appointment] revalidate getAvailableSlots error:', err);
        this.loading.set(false);
        this.error.set(this.extractApiErrorMessage(err, err.error?.message ?? 'Error al verificar disponibilidad antes de crear la cita'));
      },
    });
  }

  protected get minDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  private extractApiErrorMessage(error: any, fallback: string): string {
    const backend = error?.error;
    const message = typeof backend?.message === 'string' ? backend.message.trim() : '';

    if (Array.isArray(backend?.details)) {
      const details = backend.details
        .map((detail: unknown) => {
          if (typeof detail === 'string') return detail.trim();
          if (detail && typeof detail === 'object') {
            return Object.values(detail as Record<string, unknown>).map(String).join(': ');
          }
          return '';
        })
        .filter((detail: string) => detail.length > 0)
        .join(', ');
      if (message && details) return `${message}: ${details}`;
      if (details) return details;
    }

    if (backend?.details && typeof backend.details === 'object') {
      const details = Object.values(backend.details as Record<string, unknown>)
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0)
        .join(', ');
      if (message && details) return `${message}: ${details}`;
      if (details) return details;
    }

    if (message) return message;
    return fallback;
  }
}
