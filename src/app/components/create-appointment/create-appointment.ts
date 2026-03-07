import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  imports: [FormsModule, RouterLink],
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
    if (this.isSunday(newDate)) {
      this.error.set('Los domingos no están disponibles para agendar citas');
    }
  }

  protected checkPlateRestriction(): void {
    if (!this.selectedVehicleId() || !this.appointmentDate()) return;
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

    if (this.plateOk()) {
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
            this.error.set(serverMsg ?? 'Datos inválidos para consultar horarios (tipo/fecha)');
          } else if (err.status === 409) {
            this.error.set(serverMsg ?? 'No es posible consultar horarios para esta fecha.');
          } else {
            this.error.set(serverMsg ?? 'Error al cargar horarios');
          }
        },
      });
  }

  protected selectSlot(slot: AvailableSlotDTO): void {
    this.selectedSlot.set(slot);
  }

  protected goToStep3(): void {
    if (this.selectedSlot()) {
      this.step.set(3);
    }
  }

  protected goBack(): void {
    this.step.update((s) => Math.max(1, s - 1));
  }

  protected submitAppointment(): void {
    this.loading.set(true);
    this.error.set('');

    // Require mileage
    this.currentMileageTouched.set(true);
    if (!this.currentMileage() || this.currentMileage() <= 0) {
      this.loading.set(false);
      this.error.set('El kilometraje es obligatorio');
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

        this.appointmentService
          .createAppointment({
            vehicleId: this.selectedVehicleId()!,
            appointmentType: this.selectedType() as AppointmentType,
            appointmentDate: this.appointmentDate(),
            startTime: this.selectedSlot()!.startTime,
            currentMileage: this.currentMileage(),
            clientNotes: notes.length > 0 ? notes : undefined,
          })
          .subscribe({
            next: () => {
              this.loading.set(false);
              this.router.navigate(['/appointments']);
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
              this.error.set(serverMsg ?? 'Error al agendar la cita');
            },
          });
      },
      error: (err) => {
        console.error('[create-appointment] revalidate getAvailableSlots error:', err);
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Error al verificar disponibilidad antes de crear la cita');
      },
    });
  }

  protected get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
