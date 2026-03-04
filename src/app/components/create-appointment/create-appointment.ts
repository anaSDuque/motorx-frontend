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
  styleUrl: './create-appointment.css',
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
          this.loadingSlots.set(false);
          this.error.set(err.error?.message ?? 'Error al cargar horarios');
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
          this.loading.set(false);
          this.error.set(err.error?.message ?? 'Error al agendar la cita');
        },
      });
  }

  protected get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
