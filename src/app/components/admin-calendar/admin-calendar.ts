import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminAppointmentService } from '../../services/admin-appointment.service';
import { AppointmentResponseDTO } from '../../models';

@Component({
  selector: 'app-admin-calendar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-calendar.html',
  styleUrl: './admin-calendar.css',
})
export class AdminCalendar implements OnInit {
  private readonly appointmentService = inject(AdminAppointmentService);

  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly appointments = signal<AppointmentResponseDTO[]>([]);
  protected readonly loading = signal(false);
  protected readonly groupedByDate = signal<Record<string, AppointmentResponseDTO[]>>({});

  ngOnInit(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.startDate.set(start.toISOString().split('T')[0]);
    this.endDate.set(end.toISOString().split('T')[0]);
    this.loadCalendar();
  }

  protected loadCalendar(): void {
    this.loading.set(true);
    this.appointmentService.getCalendar(this.startDate(), this.endDate()).subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.groupByDate(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private groupByDate(data: AppointmentResponseDTO[]): void {
    const grouped: Record<string, AppointmentResponseDTO[]> = {};
    for (const apt of data) {
      if (!grouped[apt.appointmentDate]) grouped[apt.appointmentDate] = [];
      grouped[apt.appointmentDate].push(apt);
    }
    this.groupedByDate.set(grouped);
  }

  protected get dates(): string[] {
    return Object.keys(this.groupedByDate()).sort();
  }

  protected getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      SCHEDULED: 'badge-scheduled', IN_PROGRESS: 'badge-in-progress',
      COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled',
      REJECTED: 'badge-rejected', NO_SHOW: 'badge-no-show',
    };
    return map[status] ?? 'bg-secondary';
  }

  protected getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      SCHEDULED: 'Agendada', IN_PROGRESS: 'En progreso',
      COMPLETED: 'Completada', CANCELLED: 'Cancelada',
      REJECTED: 'Rechazada', NO_SHOW: 'No asistió',
    };
    return map[status] ?? status;
  }
}
