import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAppointmentService } from '../../services/admin-appointment.service';
import { AdminVehicleService } from '../../services/admin-vehicle.service';
import { AdminEmployeeService } from '../../services/admin-employee.service';
import { CreateUnplannedAppointmentRequestDTO, VehicleResponseDTO, EmployeeResponseDTO } from '../../models';
import { AppointmentType } from '../../models/enums';

@Component({
  selector: 'app-admin-unplanned',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-unplanned.html',
  styleUrl: './admin-unplanned.css',
})
export class AdminUnplanned implements OnInit {
  private readonly appointmentService = inject(AdminAppointmentService);
  private readonly vehicleService = inject(AdminVehicleService);
  private readonly employeeService = inject(AdminEmployeeService);
  private readonly router = inject(Router);

  protected readonly vehicles = signal<VehicleResponseDTO[]>([]);
  protected readonly employees = signal<EmployeeResponseDTO[]>([]);
  protected readonly appointmentTypes = Object.values(AppointmentType);

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

  ngOnInit(): void {
    this.vehicleService.getAllVehicles().subscribe({
      next: (data) => this.vehicles.set(data),
    });
    this.employeeService.getAllEmployees().subscribe({
      next: (data) => this.employees.set(data),
    });
  }

  protected submit(): void {
    if (!this.vehicleId() || !this.appointmentDate() || !this.startTime() || !this.currentMileage()) {
      this.error.set('Complete todos los campos obligatorios');
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
    this.error.set('');

    this.appointmentService.createUnplannedAppointment(dto).subscribe({
      next: () => {
        this.success.set('Cita imprevista creada exitosamente');
        this.submitting.set(false);
        setTimeout(() => this.router.navigate(['/admin']), 1500);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al crear la cita');
        this.submitting.set(false);
      },
    });
  }
}
