import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminAppointmentService } from '../../services/admin-appointment.service';
import { AppointmentResponseDTO } from '../../models';
import { AppointmentDetailModal } from '../appointment-detail/appointment-detail';

@Component({
  selector: 'app-admin-agenda',
  standalone: true,
  imports: [FormsModule, RouterLink, AppointmentDetailModal],
  templateUrl: './admin-agenda.html',
  styleUrl: './admin-agenda.css',
})
export class AdminAgenda implements OnInit {
  private readonly appointmentService = inject(AdminAppointmentService);

  protected readonly selectedDate = signal(new Date().toISOString().split('T')[0]);
  protected readonly appointments = signal<AppointmentResponseDTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');

  // Modal
  protected readonly showModal = signal(false);
  protected readonly selectedAppointment = signal<AppointmentResponseDTO | null>(null);

  // Cancel modal
  protected readonly cancellingId = signal<number | null>(null);
  protected readonly cancelReason = signal('');
  protected readonly cancelNotify = signal(true);
  protected readonly cancelLoading = signal(false);

  ngOnInit(): void {
    this.loadAgenda();
  }

  protected loadAgenda(): void {
    this.loading.set(true);
    this.appointmentService.getAgenda(this.selectedDate()).subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected viewDetails(apt: AppointmentResponseDTO): void {
    this.selectedAppointment.set(apt);
    this.showModal.set(true);
  }

  protected onModalClosed(): void {
    this.showModal.set(false);
    this.selectedAppointment.set(null);
  }

  protected onAppointmentUpdated(): void {
    this.loadAgenda();
  }

  protected openCancelModal(id: number): void {
    this.cancellingId.set(id);
    this.cancelReason.set('');
    this.cancelNotify.set(true);
  }

  protected confirmCancel(): void {
    if (!this.cancellingId()) return;
    this.cancelLoading.set(true);
    this.appointmentService
      .cancelAppointment(this.cancellingId()!, {
        reason: this.cancelReason(),
        notifyClient: this.cancelNotify(),
      })
      .subscribe({
        next: () => {
          this.cancelLoading.set(false);
          this.cancellingId.set(null);
          this.success.set('Cita cancelada exitosamente');
          this.loadAgenda();
        },
        error: (err) => {
          this.cancelLoading.set(false);
          this.error.set(err.error?.message ?? 'Error al cancelar');
        },
      });
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

  protected getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      MANUAL_WARRANTY_REVIEW: 'Rev. Garantía', AUTECO_WARRANTY: 'Garantía Auteco',
      QUICK_SERVICE: 'Servicio rápido', MAINTENANCE: 'Mantenimiento',
      OIL_CHANGE: 'Cambio de aceite', UNPLANNED: 'No planeada', REWORK: 'Reproceso',
    };
    return map[type] ?? type;
  }
}
