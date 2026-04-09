import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminAppointmentService } from '../../services/admin-appointment.service';
import { AdminEmployeeService } from '../../services/admin-employee.service';
import { AdminUserService } from '../../services/admin-user.service';
import { AdminVehicleService } from '../../services/admin-vehicle.service';
import {
  AdminUserResponseDTO,
  AppointmentResponseDTO,
  EmployeeResponseDTO,
  VehicleResponseDTO,
} from '../../models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboard implements OnInit {
  private readonly appointmentService = inject(AdminAppointmentService);
  private readonly userService = inject(AdminUserService);
  private readonly employeeService = inject(AdminEmployeeService);
  private readonly vehicleService = inject(AdminVehicleService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly today = signal(new Date().toISOString().split('T')[0]);

  protected readonly agenda = signal<AppointmentResponseDTO[]>([]);
  protected readonly users = signal<AdminUserResponseDTO[]>([]);
  protected readonly employees = signal<EmployeeResponseDTO[]>([]);
  protected readonly vehicles = signal<VehicleResponseDTO[]>([]);

  protected readonly scheduledToday = computed(() =>
    this.agenda().filter((appointment) => appointment.status === 'SCHEDULED').length
  );

  protected readonly inProgressToday = computed(() =>
    this.agenda().filter((appointment) => appointment.status === 'IN_PROGRESS').length
  );

  protected readonly activeUsers = computed(() =>
    this.users().filter((user) => user.enabled && !user.accountLocked && !user.deletedAt).length
  );

  protected readonly availableTechnicians = computed(() =>
    this.employees().filter((employee) => employee.position === 'MECANICO' && employee.state === 'AVAILABLE').length
  );

  protected readonly completionRate = computed(() => {
    const totalAgenda = this.agenda().length;
    if (!totalAgenda) {
      return 0;
    }
    const completed = this.agenda().filter((appointment) => appointment.status === 'COMPLETED').length;
    return Math.round((completed / totalAgenda) * 100);
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  protected loadDashboard(): void {
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      agenda: this.appointmentService.getAgenda(this.today()),
      users: this.userService.getAllUsers(),
      employees: this.employeeService.getAllEmployees(),
      vehicles: this.vehicleService.getAllVehicles(),
    }).subscribe({
      next: ({ agenda, users, employees, vehicles }) => {
        this.agenda.set(agenda);
        this.users.set(users);
        this.employees.set(employees);
        this.vehicles.set(vehicles);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el dashboard administrativo.');
      },
    });
  }

  protected getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      MANUAL_WARRANTY_REVIEW: 'Rev. Garantia',
      AUTECO_WARRANTY: 'Garantia Auteco',
      QUICK_SERVICE: 'Servicio rapido',
      MAINTENANCE: 'Mantenimiento',
      OIL_CHANGE: 'Cambio de aceite',
      UNPLANNED: 'No planeada',
      REWORK: 'Reproceso',
    };
    return map[type] ?? type;
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
      NO_SHOW: 'No asistio',
    };
    return map[status] ?? status;
  }
}
