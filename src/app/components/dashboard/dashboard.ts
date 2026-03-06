import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserAppointmentService } from '../../services/user-appointment.service';
import { UserVehicleService } from '../../services/user-vehicle.service';
import { AppointmentResponseDTO, VehicleResponseDTO } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly appointmentService = inject(UserAppointmentService);
  private readonly vehicleService = inject(UserVehicleService);

  protected readonly userName = signal('');
  protected readonly appointments = signal<AppointmentResponseDTO[]>([]);
  protected readonly vehicles = signal<VehicleResponseDTO[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.userName.set(this.authService.getStoredUserName() ?? 'Usuario');
    this.loadData();
  }

  private loadData(): void {
    this.appointmentService.getMyAppointments().subscribe({
      next: (data) => this.appointments.set(data),
      error: () => {},
    });
    this.vehicleService.getMyVehicles().subscribe({
      next: (data) => {
        this.vehicles.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected get upcomingAppointments(): AppointmentResponseDTO[] {
    return this.appointments().filter((a) => a.status === 'SCHEDULED' || a.status === 'IN_PROGRESS');
  }

  protected getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      SCHEDULED: 'badge-scheduled',
      IN_PROGRESS: 'badge-in-progress',
      COMPLETED: 'badge-completed',
      CANCELLED: 'badge-cancelled',
      REJECTED: 'badge-rejected',
      NO_SHOW: 'badge-no-show',
    };
    return map[status] ?? 'bg-secondary';
  }

  protected getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      SCHEDULED: 'Agendada',
      IN_PROGRESS: 'En progreso',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
      REJECTED: 'Rechazada',
      NO_SHOW: 'No asistió',
    };
    return map[status] ?? status;
  }
}
