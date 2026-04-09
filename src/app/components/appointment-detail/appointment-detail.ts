import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
    AppointmentResponseDTO,
    AppointmentStatus,
    AppointmentType,
    APPOINTMENT_STATUS_LABELS,
    APPOINTMENT_TYPE_LABELS,
    Role,
} from '../../models';
import { AuthService } from '../../services/auth.service';
import { AdminAppointmentService } from '../../services/admin-appointment.service';
import { UserAppointmentService } from '../../services/user-appointment.service';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-appointment-detail',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './appointment-detail.html',
    styleUrls: ['./appointment-detail.css'],
})
export class AppointmentDetailModal {
    @Input() appointment: AppointmentResponseDTO | null = null;
    @Input() show = false;
    @Output() close = new EventEmitter<void>();
    @Output() updated = new EventEmitter<void>();

    private readonly authService = inject(AuthService);
    private readonly adminApptService = inject(AdminAppointmentService);
    private readonly userApptService = inject(UserAppointmentService);
    private readonly notificationService = inject(NotificationService);

    readonly statusLabels = APPOINTMENT_STATUS_LABELS;
    readonly typeLabels = APPOINTMENT_TYPE_LABELS;

    protected readonly isCancelling = signal(false);
    protected cancelReason = signal('');

    getTypeLabel(type: AppointmentType | string): string {
        return this.typeLabels[type as AppointmentType] || type || 'Tipo desconocido';
    }

    get isClient(): boolean {
        return this.authService.getStoredRole() === Role.CLIENT;
    }

    get isAdmin(): boolean {
        return this.authService.getStoredRole() === Role.ADMIN;
    }

    get canCancel(): boolean {
        if (!this.appointment) return false;
        return this.appointment.status === AppointmentStatus.SCHEDULED;
    }

    get statusBadgeClass(): string {
        if (!this.appointment) return 'bg-secondary';
        switch (this.appointment.status) {
            case AppointmentStatus.SCHEDULED: return 'bg-primary';
            case AppointmentStatus.IN_PROGRESS: return 'bg-info text-dark';
            case AppointmentStatus.COMPLETED: return 'bg-success';
            case AppointmentStatus.CANCELLED: return 'bg-danger';
            case AppointmentStatus.REJECTED: return 'bg-dark';
            case AppointmentStatus.NO_SHOW: return 'bg-warning text-dark';
            default: return 'bg-secondary';
        }
    }

    protected doCancel(): void {
        if (!this.appointment) return;
        this.isCancelling.set(true);

        if (this.isClient) {
            this.userApptService.cancelMyAppointment(this.appointment.id).subscribe({
                next: () => {
                    this.isCancelling.set(false);
                    this.notificationService.success('Cita cancelada exitosamente');
                    this.updated.emit();
                    this.onClose();
                },
                error: (err) => {
                    this.isCancelling.set(false);
                    this.notificationService.error(this.notificationService.handleHttpError(err));
                }
            });
        } else if (this.isAdmin) {
            if (!this.cancelReason().trim()) {
                this.notificationService.error('Debe ingresar un motivo de cancelación');
                this.isCancelling.set(false);
                return;
            }
            this.adminApptService.cancelAppointment(this.appointment.id, {
                reason: this.cancelReason(),
                notifyClient: true
            }).subscribe({
                next: () => {
                    this.isCancelling.set(false);
                    this.notificationService.success('Cita cancelada exitosamente');
                    this.updated.emit();
                    this.onClose();
                },
                error: (err) => {
                    this.isCancelling.set(false);
                    this.notificationService.error(this.notificationService.handleHttpError(err));
                }
            });
        }
    }

    protected onClose(): void {
        this.cancelReason.set('');
        this.isCancelling.set(false);
        this.close.emit();
    }
}
