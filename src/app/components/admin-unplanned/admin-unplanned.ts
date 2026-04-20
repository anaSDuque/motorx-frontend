import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAppointmentService } from '../../services/admin-appointment.service';
import { AdminVehicleService } from '../../services/admin-vehicle.service';
import { AdminEmployeeService } from '../../services/admin-employee.service';
import { CreateUnplannedAppointmentRequestDTO, VehicleResponseDTO, EmployeeResponseDTO, EmployeePosition } from '../../models';
import { AppointmentType, APPOINTMENT_TYPE_LABELS } from '../../models/enums';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-admin-unplanned',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-unplanned.html',
  styleUrls: ['./admin-unplanned.css'],
})
export class AdminUnplanned implements OnInit {
  private readonly appointmentService = inject(AdminAppointmentService);
  private readonly vehicleService = inject(AdminVehicleService);
  private readonly employeeService = inject(AdminEmployeeService);
  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);

  protected readonly vehicles = signal<VehicleResponseDTO[]>([]);
  protected readonly employees = signal<EmployeeResponseDTO[]>([]);
  protected readonly appointmentTypes = Object.values(AppointmentType);
  protected readonly typeLabels = APPOINTMENT_TYPE_LABELS;

  // Plate search
  protected readonly plateSearch = signal('');
  protected readonly filteredVehicles = computed(() => {
    const search = this.plateSearch().toLowerCase().trim();
    if (!search) return this.vehicles();
    return this.vehicles().filter(
      (v) =>
        v.licensePlate.toLowerCase().includes(search) ||
        v.brand.toLowerCase().includes(search) ||
        v.model.toLowerCase().includes(search)
    );
  });

  protected readonly vehicleId = signal<number | null>(null);
  protected readonly appointmentType = signal<AppointmentType>(AppointmentType.UNPLANNED);
  protected readonly appointmentDate = signal('');
  protected readonly startTime = signal('');
  protected readonly currentMileage = signal<number | null>(null);
  protected readonly technicianId = signal<number | null>(null);
  protected readonly adminNotes = signal('');

  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  // Touched states
  protected readonly vehicleTouched = signal(false);
  protected readonly dateTouched = signal(false);
  protected readonly timeTouched = signal(false);
  protected readonly mileageTouched = signal(false);
  protected readonly businessHoursTouched = signal(false);

  protected readonly plateSearchControl = new FormControl('', { nonNullable: true });
  protected readonly vehicleIdControl = new FormControl<number | null>(null);
  protected readonly appointmentTypeControl = new FormControl<AppointmentType>(AppointmentType.UNPLANNED, { nonNullable: true });
  protected readonly appointmentDateControl = new FormControl('', { nonNullable: true });
  protected readonly startTimeControl = new FormControl('', { nonNullable: true });
  protected readonly currentMileageControl = new FormControl<number | null>(null);
  protected readonly technicianIdControl = new FormControl<number | null>(null);
  protected readonly adminNotesControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.plateSearchControl.valueChanges.subscribe((value) => this.plateSearch.set(value));
    this.vehicleIdControl.valueChanges.subscribe((value) => this.vehicleId.set(value));
    this.appointmentTypeControl.valueChanges.subscribe((value) => this.appointmentType.set(value));
    this.appointmentDateControl.valueChanges.subscribe((value) => this.appointmentDate.set(value));
    this.startTimeControl.valueChanges.subscribe((value) => this.startTime.set(value));
    this.currentMileageControl.valueChanges.subscribe((value) => this.currentMileage.set(value));
    this.technicianIdControl.valueChanges.subscribe((value) => this.technicianId.set(value));
    this.adminNotesControl.valueChanges.subscribe((value) => this.adminNotes.set(value));
  }

  // Today's date for min attribute
  protected get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.vehicleService.getAllVehicles().subscribe({
      next: (data) => this.vehicles.set(data),
    });
    this.employeeService.getAllEmployees().subscribe({
      next: (data) => this.employees.set(data.filter((e) => e.position === EmployeePosition.MECANICO)),
    });
  }

  private timeToMinutes(time: string): number {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  }

  protected isBusinessHoursInvalid(date: string, time: string): boolean {
    if (!date || !time) {
      return false;
    }

    const selectedDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime())) {
      return true;
    }

    const day = selectedDate.getDay();
    if (day === 0 || day === 6) {
      return true;
    }

    const selectedMinutes = this.timeToMinutes(time);
    const opening = 7 * 60;
    const lunchStart = 12 * 60;
    const lunchEnd = 13 * 60;
    const closing = 17 * 60 + 30;

    if (selectedMinutes < opening || selectedMinutes > closing) {
      return true;
    }

    if (selectedMinutes >= lunchStart && selectedMinutes < lunchEnd) {
      return true;
    }

    if (date === this.today) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (selectedMinutes <= currentMinutes) {
        return true;
      }
    }

    return false;
  }

  protected isMileageInvalid(): boolean {
    const mileage = this.currentMileage();
    return mileage === null || !Number.isFinite(mileage) || !Number.isInteger(mileage) || mileage <= 0;
  }

  protected t(key: string): string {
    return this.languageService.t(key);
  }

  protected submit(): void {
    this.vehicleTouched.set(true);
    this.dateTouched.set(true);
    this.timeTouched.set(true);
    this.mileageTouched.set(true);
    this.businessHoursTouched.set(true);
    this.success.set('');
    this.error.set('');

    if (!this.vehicleId() || !this.appointmentDate() || !this.startTime() || this.currentMileage() === null) {
      this.error.set('Complete todos los campos obligatorios');
      return;
    }

    if (this.isBusinessHoursInvalid(this.appointmentDate(), this.startTime())) {
      this.error.set('La hora no cumple reglas de negocio: lunes a viernes, 07:00-17:30 y sin citas de 12:00 a 13:00.');
      return;
    }

    if (this.isMileageInvalid()) {
      this.error.set('El kilometraje debe ser un número entero mayor a 0.');
      return;
    }

    const dto: CreateUnplannedAppointmentRequestDTO = {
      vehicleId: this.vehicleId()!,
      appointmentType: this.appointmentType(),
      appointmentDate: this.appointmentDate(),
      startTime: this.startTime(),
      currentMileage: this.currentMileage()!,
      technicianId: this.technicianId(),
      adminNotes: this.adminNotes() || undefined,
    };

    this.submitting.set(true);

    this.appointmentService.createUnplannedAppointment(dto).subscribe({
      next: () => {
        this.success.set('Cita imprevista creada exitosamente');
        this.submitting.set(false);
        setTimeout(() => this.router.navigate(['/admin']), 2000);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.error?.details?.message ?? 'Error al crear la cita');
        this.submitting.set(false);
      },
    });
  }
}
