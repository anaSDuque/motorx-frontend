import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private nextId = 0;
    readonly notifications = signal<Notification[]>([]);

    show(message: string, type: NotificationType = 'info', durationMs = 5000): void {
        const id = this.nextId++;
        this.notifications.update((list) => [...list, { id, message, type }]);

        setTimeout(() => this.dismiss(id), durationMs);
    }

    success(message: string): void {
        this.show(message, 'success');
    }

    error(message: string): void {
        this.show(message, 'error', 7000);
    }

    warning(message: string): void {
        this.show(message, 'warning');
    }

    info(message: string): void {
        this.show(message, 'info');
    }

    dismiss(id: number): void {
        this.notifications.update((list) => list.filter((n) => n.id !== id));
    }

    /**
     * Transforms an HTTP error into a user-friendly message.
     * The backend sends ResponseErrorDTO { path, error, message, status }
     */
    handleHttpError(err: any): string {
        // If it's a validation error with details (MethodArgumentNotValidException)
        if (err.status === 400 && err.error?.details) {
            const details = err.error.details;
            return 'Errores de validación: ' + Object.entries(details)
                .map(([field, msg]) => `${msg}`)
                .join(', ');
        }

        // If backend sent a structured message, use it
        if (err.error?.message && typeof err.error.message === 'string') {
            return err.error.message;
        }

        // Map HTTP status to friendly message
        switch (err.status) {
            case 0:
                return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
            case 400:
                return 'Los datos enviados no son válidos. Revisa el formulario e intenta de nuevo.';
            case 401:
                return 'Tu sesión ha expirado o las credenciales son incorrectas. Inicia sesión nuevamente.';
            case 403:
                return 'No tienes permisos para realizar esta acción.';
            case 404:
                return 'El recurso solicitado no fue encontrado.';
            case 409:
                return 'Ya existe un registro con esa información. Verifica los datos e intenta de nuevo.';
            case 422:
                return 'Los datos proporcionados no pudieron ser procesados. Verifica e intenta de nuevo.';
            case 429:
                return 'Demasiadas solicitudes. Por favor, espera un momento antes de intentar de nuevo.';
            case 500:
                return 'Ocurrió un error interno en el servidor. Intenta de nuevo más tarde.';
            case 502:
            case 503:
                return 'El servicio no está disponible en este momento. Intenta de nuevo más tarde.';
            default:
                return 'Ocurrió un error inesperado. Intenta de nuevo.';
        }
    }
}
