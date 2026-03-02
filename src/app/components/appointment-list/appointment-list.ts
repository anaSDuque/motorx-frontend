import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserAppointmentService } from '../../services/user-appointment.service';
import { AppointmentResponseDTO } from '../../models';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './appointment-list.html',
  styleUrl: './appointment-list.css',
})
export class AppointmentList implements OnInit {
  private readonly appointmentService = inject(UserAppointmentService);

  protected readonly appointments = signal<AppointmentResponseDTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly success = signal('');
  protected readonly error = signal('');

  ngOnInit(): void {
    this.loadAppointments();
  }

  private loadAppointments(): void {
    this.appointmentService.getMyAppointments().subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected cancelAppointment(id: number): void {
    if (!confirm('¿Estás seguro de cancelar esta cita?')) return;
    this.appointmentService.cancelMyAppointment(id).subscribe({
      next: () => {
        this.success.set('Cita cancelada exitosamente');
        this.loadAppointments();
      },
      error: (err) => this.error.set(err.error?.message ?? 'Error al cancelar'),
    });
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

  protected getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      MANUAL_WARRANTY_REVIEW: 'Revisión de garantía',
      AUTECO_WARRANTY: 'Garantía Auteco',
      QUICK_SERVICE: 'Servicio rápido',
      MAINTENANCE: 'Mantenimiento',
      OIL_CHANGE: 'Cambio de aceite',
      UNPLANNED: 'No planeada',
      REWORK: 'Reproceso',
    };
    return map[type] ?? type;
  }
}
